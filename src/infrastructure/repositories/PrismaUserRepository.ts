import { PrismaClient } from '@prisma/client';
import { User, UserProps, createUser } from '../../domain/entities/User';
import { UserId, createUserId } from '../../domain/valueObjects/UserId';
import { Email, createEmail } from '../../domain/valueObjects/Email';
import { UserRole, createUserRole } from '../../domain/valueObjects/UserRole';
import { DateTime, createDateTime } from '../../domain/valueObjects/DateTime';
import { NumericId, createNumericId } from '../../domain/valueObjects/NumericId';
import { Result, ok, err } from '../../utils/Result';
import { RepositoryError } from './RepositoryError';

export interface UserRepository {
  findById(id: UserId): Promise<Result<User | null, RepositoryError>>;
  findByEmail(email: Email): Promise<Result<User | null, RepositoryError>>;
  save(user: User): Promise<Result<User, RepositoryError>>;
  findAll(): Promise<Result<User[], RepositoryError>>;
}

export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: UserId): Promise<Result<User | null, RepositoryError>> {
    try {
      const numericIdResult = createNumericId(id);
      if (!numericIdResult.ok) {
        return err(RepositoryError.invalidIdFormat());
      }

      const user = await this.prisma.user.findUnique({
        where: { id: numericIdResult.value }
      });

      if (!user) {
        return ok(null);
      }

      return this.toDomainUser(user);
    } catch (error) {
      return err(RepositoryError.databaseError(error));
    }
  }

  async findByEmail(email: Email): Promise<Result<User | null, RepositoryError>> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        return ok(null);
      }

      return this.toDomainUser(user);
    } catch (error) {
      return err(RepositoryError.databaseError(error));
    }
  }

  async save(user: User): Promise<Result<User, RepositoryError>> {
    try {
      const numericIdResult = createNumericId(user.id);
      if (!numericIdResult.ok) {
        return err(RepositoryError.invalidIdFormat());
      }

      const savedUser = await this.prisma.user.upsert({
        where: { id: numericIdResult.value },
        update: {
          email: user.email,
          name: user.name,
          role: user.role,
          updatedAt: user.updatedAt
        },
        create: {
          id: numericIdResult.value,
          email: user.email,
          name: user.name,
          role: user.role,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      });

      return this.toDomainUser(savedUser);
    } catch (error) {
      if (error instanceof Error && error.message.includes('Unique constraint')) {
        return err(RepositoryError.duplicateEmail());
      }
      return err(RepositoryError.databaseError(error));
    }
  }

  async findAll(): Promise<Result<User[], RepositoryError>> {
    try {
      const users = await this.prisma.user.findMany();
      
      const domainUsersResults = await Promise.all(
        users.map(user => this.toDomainUser(user))
      );

      // Return early if there are any errors
      const error = domainUsersResults.find(result => !result.ok);
      if (error && !error.ok) {
        return err(error.error);
      }

      // Return array of values if all successful
      return ok(domainUsersResults.map(result => 
        // Check ok for TypeScript type checking
        result.ok ? result.value : null
      ).filter((user): user is User => user !== null));
    } catch (error) {
      return err(RepositoryError.databaseError(error));
    }
  }

  private async toDomainUser(prismaUser: { 
    id: number; 
    email: string; 
    name: string | null; 
    role: string;
    createdAt: Date;
    updatedAt: Date;
  }): Promise<Result<User, RepositoryError>> {
    const userIdResult = createUserId(prismaUser.id.toString());
    const emailResult = createEmail(prismaUser.email);
    const roleResult = createUserRole(prismaUser.role as 'USER' | 'ADMIN');
    const createdAtResult = createDateTime(prismaUser.createdAt);
    const updatedAtResult = createDateTime(prismaUser.updatedAt);

    if (!userIdResult.ok) return err(RepositoryError.invalidIdFormat());
    if (!emailResult.ok) return err(new RepositoryError('DATABASE_ERROR', 'メールアドレスの形式が不正です'));
    if (!roleResult.ok) return err(new RepositoryError('DATABASE_ERROR', '不正なユーザーロールです'));
    if (!createdAtResult.ok) return err(new RepositoryError('DATABASE_ERROR', '不正な作成日時です'));
    if (!updatedAtResult.ok) return err(new RepositoryError('DATABASE_ERROR', '不正な更新日時です'));

    const props: UserProps = {
      id: userIdResult.value,
      email: emailResult.value,
      name: prismaUser.name ?? '',
      role: roleResult.value,
      createdAt: createdAtResult.value,
      updatedAt: updatedAtResult.value
    };

    const userResult = createUser(props);
    if (!userResult.ok) {
      return err(new RepositoryError('DATABASE_ERROR', 'ユーザーエンティティの作成に失敗しました'));
    }

    return ok(userResult.value);
  }
}