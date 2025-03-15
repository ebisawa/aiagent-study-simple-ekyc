import { PrismaClient } from '@prisma/client';
import { VerificationRequest, VerificationRequestProps, createVerificationRequest } from '../../domain/entities/VerificationRequest';
import { ImageId, createImageId } from '../../domain/valueObjects/ImageId';
import { UserId, createUserId } from '../../domain/valueObjects/UserId';
import { VerificationStatus, VerificationStatusEnum, createVerificationStatus } from '../../domain/valueObjects/VerificationStatus';
import { DateTime, createDateTime } from '../../domain/valueObjects/DateTime';
import { NumericId, createNumericId } from '../../domain/valueObjects/NumericId';
import { Result, ok, err } from '../../utils/Result';
import { RepositoryError } from './RepositoryError';
import { VerificationRequestRepository } from './VerificationRequestRepository';

export class PrismaVerificationRequestRepository implements VerificationRequestRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: number): Promise<Result<VerificationRequest | null, RepositoryError>> {
    try {
      const request = await this.prisma.verificationRequest.findUnique({
        where: { id }
      });

      if (!request) {
        return ok(null);
      }

      return this.toDomainVerificationRequest(request);
    } catch (error) {
      return err(RepositoryError.databaseError(error));
    }
  }

  async findByUserId(userId: UserId): Promise<Result<VerificationRequest[], RepositoryError>> {
    try {
      const numericUserIdResult = createNumericId(userId);
      if (!numericUserIdResult.ok) {
        return err(RepositoryError.invalidIdFormat());
      }

      const requests = await this.prisma.verificationRequest.findMany({
        where: { userId: numericUserIdResult.value }
      });

      const domainRequests: VerificationRequest[] = [];
      for (const request of requests) {
        const domainRequestResult = await this.toDomainVerificationRequest(request);
        if (domainRequestResult.ok) {
          domainRequests.push(domainRequestResult.value);
        } else {
          return err(domainRequestResult.error);
        }
      }

      return ok(domainRequests);
    } catch (error) {
      return err(RepositoryError.databaseError(error));
    }
  }

  async findByImageId(imageId: ImageId): Promise<Result<VerificationRequest | null, RepositoryError>> {
    try {
      const numericImageIdResult = createNumericId(imageId);
      if (!numericImageIdResult.ok) {
        return err(RepositoryError.invalidIdFormat());
      }

      const request = await this.prisma.verificationRequest.findFirst({
        where: { imageId: numericImageIdResult.value }
      });

      if (!request) {
        return ok(null);
      }

      return this.toDomainVerificationRequest(request);
    } catch (error) {
      return err(RepositoryError.databaseError(error));
    }
  }

  async findByStatus(status: VerificationStatus): Promise<Result<VerificationRequest[], RepositoryError>> {
    try {
      const statusValue = this.mapStatusToPrismaEnum(status);
      
      const requests = await this.prisma.verificationRequest.findMany({
        where: { status: statusValue }
      });

      const domainRequests: VerificationRequest[] = [];
      for (const request of requests) {
        const domainRequestResult = await this.toDomainVerificationRequest(request);
        if (domainRequestResult.ok) {
          domainRequests.push(domainRequestResult.value);
        } else {
          return err(domainRequestResult.error);
        }
      }

      return ok(domainRequests);
    } catch (error) {
      return err(RepositoryError.databaseError(error));
    }
  }

  async save(request: VerificationRequest): Promise<Result<VerificationRequest, RepositoryError>> {
    try {
      const numericUserIdResult = createNumericId(request.userId);
      const numericImageIdResult = createNumericId(request.imageId);
      
      if (!numericUserIdResult.ok) {
        return err(RepositoryError.invalidIdFormat('userId'));
      }
      
      if (!numericImageIdResult.ok) {
        return err(RepositoryError.invalidIdFormat('imageId'));
      }

      let numericReviewedById: number | null = null;
      if (request.reviewedBy) {
        const numericReviewedByIdResult = createNumericId(request.reviewedBy);
        if (!numericReviewedByIdResult.ok) {
          return err(RepositoryError.invalidIdFormat('reviewedById'));
        }
        numericReviewedById = numericReviewedByIdResult.value;
      }

      const statusValue = this.mapStatusToPrismaEnum(request.status);

      try {
        const savedRequest = await this.prisma.verificationRequest.upsert({
          where: { id: request.id },
          update: {
            userId: numericUserIdResult.value,
            imageId: numericImageIdResult.value,
            status: statusValue,
            reviewedById: numericReviewedById,
            reviewedAt: request.reviewedAt ? new Date(request.reviewedAt as unknown as string) : null,
            comment: request.comment,
            updatedAt: new Date()
          },
          create: {
            id: request.id,
            userId: numericUserIdResult.value,
            imageId: numericImageIdResult.value,
            status: statusValue,
            reviewedById: numericReviewedById,
            reviewedAt: request.reviewedAt ? new Date(request.reviewedAt as unknown as string) : null,
            comment: request.comment,
            createdAt: new Date(request.createdAt as unknown as string),
            updatedAt: new Date(request.updatedAt as unknown as string)
          }
        });
        return this.toDomainVerificationRequest(savedRequest);
      } catch (prismaError) {
        throw prismaError;
      }
    } catch (error) {
      return err(RepositoryError.databaseError(error));
    }
  }

  private mapStatusToPrismaEnum(status: VerificationStatus): 'PENDING' | 'APPROVED' | 'REJECTED' {
    if (status === VerificationStatusEnum.PENDING as VerificationStatus) {
      return 'PENDING';
    } else if (status === VerificationStatusEnum.APPROVED as VerificationStatus) {
      return 'APPROVED';
    } else if (status === VerificationStatusEnum.REJECTED as VerificationStatus) {
      return 'REJECTED';
    }
    return 'PENDING';
  }

  private async toDomainVerificationRequest(prismaRequest: any): Promise<Result<VerificationRequest, RepositoryError>> {
    try {
      const userIdResult = createUserId(prismaRequest.userId.toString());
      const imageIdResult = createImageId(prismaRequest.imageId.toString());
      const statusResult = createVerificationStatus(prismaRequest.status);
      const createdAtResult = createDateTime(new Date(prismaRequest.createdAt));
      const updatedAtResult = createDateTime(new Date(prismaRequest.updatedAt));

      if (!userIdResult.ok) return err(RepositoryError.invalidData('userId'));
      if (!imageIdResult.ok) return err(RepositoryError.invalidData('imageId'));
      if (!statusResult.ok) return err(RepositoryError.invalidData('status'));
      if (!createdAtResult.ok) return err(RepositoryError.invalidData('createdAt'));
      if (!updatedAtResult.ok) return err(RepositoryError.invalidData('updatedAt'));

      let reviewedByResult = undefined;
      let reviewedAtResult = undefined;

      if (prismaRequest.reviewedById) {
        reviewedByResult = createUserId(prismaRequest.reviewedById.toString());
        if (!reviewedByResult.ok) return err(RepositoryError.invalidData('reviewedById'));
      }

      if (prismaRequest.reviewedAt) {
        reviewedAtResult = createDateTime(new Date(prismaRequest.reviewedAt));
        if (!reviewedAtResult.ok) return err(RepositoryError.invalidData('reviewedAt'));
      }

      const props: VerificationRequestProps = {
        id: prismaRequest.id,
        userId: userIdResult.value,
        imageId: imageIdResult.value,
        status: statusResult.value,
        reviewedBy: reviewedByResult?.value,
        reviewedAt: reviewedAtResult?.value,
        comment: prismaRequest.comment,
        createdAt: createdAtResult.value,
        updatedAt: updatedAtResult.value
      };

      const result = createVerificationRequest(props);
      if (!result.ok) {
        return err(RepositoryError.mappingError(result.error));
      }
      return ok(result.value);
    } catch (error) {
      return err(RepositoryError.mappingError(error));
    }
  }
} 