import { PrismaUserRepository } from '../PrismaUserRepository';
import { createUser, UserProps } from '../../../domain/entities/User';
import { createEmail } from '../../../domain/valueObjects/Email';
import { createUserRole } from '../../../domain/valueObjects/UserRole';
import { createDateTime } from '../../../domain/valueObjects/DateTime';
import { createUserId } from '../../../domain/valueObjects/UserId';
import { RepositoryError } from '../RepositoryError';
import { prismaTest, resetDatabase } from './prisma';

describe('PrismaUserRepository', () => {
  let repository: PrismaUserRepository;
  let testUser: UserProps;

  beforeAll(() => {
    repository = new PrismaUserRepository(prismaTest);
  });

  beforeEach(async () => {
    // 一意のメールアドレスを生成するためにタイムスタンプを追加
    const timestamp = new Date().getTime();
    const uniqueEmail = `test-${timestamp}@example.com`;

    // Create user directly in database and get generated ID
    const dbUser = await prismaTest.user.create({
      data: {
        email: uniqueEmail,
        name: 'Test User',
        role: 'USER'
      }
    });

    // Create test user data
    const now = new Date();
    const userIdResult = createUserId(dbUser.id.toString());
    const emailResult = createEmail(dbUser.email);
    const roleResult = createUserRole('USER');
    const createdAtResult = createDateTime(now);
    const updatedAtResult = createDateTime(now);

    if (!userIdResult.ok || !emailResult.ok || !roleResult.ok || 
        !createdAtResult.ok || !updatedAtResult.ok) {
      throw new Error('Failed to create test data');
    }

    testUser = {
      id: userIdResult.value,
      email: emailResult.value,
      name: 'Test User',
      role: roleResult.value,
      createdAt: createdAtResult.value,
      updatedAt: updatedAtResult.value
    };
  });

  afterAll(async () => {
    await prismaTest.$disconnect();
  });

  describe('save', () => {
    it('should save a new user', async () => {
      const emailResult = createEmail('new-user@example.com');
      expect(emailResult.ok).toBe(true);
      if (!emailResult.ok) return;

      const newUser = {
        ...testUser,
        email: emailResult.value,
      };

      const userResult = createUser(newUser);
      expect(userResult.ok).toBe(true);
      if (!userResult.ok) return;

      const saveResult = await repository.save(userResult.value);
      expect(saveResult.ok).toBe(true);
      if (!saveResult.ok) return;

      expect(saveResult.value.name).toBe(newUser.name);
      expect(saveResult.value.email).toBe(newUser.email);
    });

    it('should update an existing user', async () => {
      const userResult = createUser(testUser);
      expect(userResult.ok).toBe(true);
      if (!userResult.ok) return;

      // Change the name
      const updatedResult = userResult.value.changeName('Updated Name');
      expect(updatedResult.ok).toBe(true);
      if (!updatedResult.ok) return;

      // Save the update
      const updateSaveResult = await repository.save(updatedResult.value);
      expect(updateSaveResult.ok).toBe(true);
      if (!updateSaveResult.ok) return;

      expect(updateSaveResult.value.name).toBe('Updated Name');
    });

    it('should return an error for duplicate email', async () => {
      // Create a new user with existing email
      const userIdResult = createUserId('999');
      expect(userIdResult.ok).toBe(true);
      if (!userIdResult.ok) return;

      const userResult = createUser({
        ...testUser,
        id: userIdResult.value, // Different ID
      });
      expect(userResult.ok).toBe(true);
      if (!userResult.ok) return;

      const saveResult = await repository.save(userResult.value);
      expect(saveResult.ok).toBe(false);
      if (saveResult.ok) return;

      expect(saveResult.error.type).toBe('DUPLICATE_EMAIL');
    });
  });

  describe('findById', () => {
    it('should find a user by ID', async () => {
      const findResult = await repository.findById(testUser.id);
      expect(findResult.ok).toBe(true);
      if (!findResult.ok) return;

      expect(findResult.value).not.toBeNull();
      expect(findResult.value?.name).toBe(testUser.name);
    });

    it('should return null for non-existent ID', async () => {
      const nonExistentIdResult = createUserId('999');
      expect(nonExistentIdResult.ok).toBe(true);
      if (!nonExistentIdResult.ok) return;

      const findResult = await repository.findById(nonExistentIdResult.value);
      expect(findResult.ok).toBe(true);
      if (!findResult.ok) return;

      expect(findResult.value).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should find a user by email', async () => {
      const findResult = await repository.findByEmail(testUser.email);
      expect(findResult.ok).toBe(true);
      if (!findResult.ok) return;

      expect(findResult.value).not.toBeNull();
      expect(findResult.value?.email).toBe(testUser.email);
    });
  });

  describe('findAll', () => {
    it('should retrieve all users', async () => {
      // Create a second user
      const timestamp = new Date().getTime();
      const uniqueEmail = `test2-${timestamp}@example.com`;
      
      await prismaTest.user.create({
        data: {
          email: uniqueEmail,
          name: 'Test User 2',
          role: 'USER'
        }
      });

      // Get all users
      const findAllResult = await repository.findAll();
      expect(findAllResult.ok).toBe(true);
      if (!findAllResult.ok) return;

      // 少なくとも2人以上のユーザーが存在することを確認
      expect(findAllResult.value.length).toBeGreaterThanOrEqual(2);
      
      // 作成したユーザーが含まれていることを確認
      const foundTestUser = findAllResult.value.find(user => user.email === testUser.email);
      expect(foundTestUser).toBeDefined();
      
      const foundSecondUser = findAllResult.value.find(user => user.email === uniqueEmail);
      expect(foundSecondUser).toBeDefined();
    });
  });
});