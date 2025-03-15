import { PrismaVerificationRequestRepository } from '../PrismaVerificationRequestRepository';
import { createVerificationRequest, VerificationRequestProps } from '../../../domain/entities/VerificationRequest';
import { createUserId } from '../../../domain/valueObjects/UserId';
import { createImageId } from '../../../domain/valueObjects/ImageId';
import { createVerificationStatus, VerificationStatusEnum } from '../../../domain/valueObjects/VerificationStatus';
import { createDateTime } from '../../../domain/valueObjects/DateTime';
import { RepositoryError } from '../RepositoryError';
import { prismaTest, resetDatabase } from './prisma';

describe('PrismaVerificationRequestRepository', () => {
  let repository: PrismaVerificationRequestRepository;
  let testUserId: number;
  let testImageId: number;
  let testRequestId: number;

  beforeAll(() => {
    repository = new PrismaVerificationRequestRepository(prismaTest);
  });

  beforeEach(async () => {
    // 各テスト前にデータベースをリセット
    await resetDatabase();
    
    try {
      // 一意のメールアドレスを生成するためにタイムスタンプを追加
      const timestamp = new Date().getTime();
      const uniqueEmail = `test-${timestamp}@example.com`;

      // Create test user
      const dbUser = await prismaTest.user.create({
        data: {
          email: uniqueEmail,
          name: 'Test User',
          role: 'USER'
        }
      });
      testUserId = dbUser.id;

      // Create test image
      const dbImage = await prismaTest.verificationImage.create({
        data: {
          userId: dbUser.id,
          imageUrl: `http://example.com/test-${timestamp}.jpg`
        }
      });
      testImageId = dbImage.id;

      // Create test verification request
      const dbRequest = await prismaTest.verificationRequest.create({
        data: {
          userId: dbUser.id,
          imageId: dbImage.id,
          status: VerificationStatusEnum.PENDING
        }
      });
      testRequestId = dbRequest.id;
    } catch (error) {
      console.error('Failed to create test data:', error);
      throw error;
    }
  });

  describe('findById', () => {
    it('should find a verification request by id', async () => {
      const result = await repository.findById(testRequestId);
      
      expect(result.ok).toBe(true);
      if (result.ok && result.value) {
        expect(result.value.id).toBe(testRequestId);
        expect(result.value.userId).toBeDefined();
        expect(result.value.imageId).toBeDefined();
        expect(result.value.status).toBe(VerificationStatusEnum.PENDING);
      }
    });

    it('should return null for non-existent id', async () => {
      const result = await repository.findById(9999);
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBeNull();
      }
    });
  });

  describe('findByUserId', () => {
    it('should find verification requests by user id', async () => {
      const userIdResult = createUserId(testUserId.toString());
      expect(userIdResult.ok).toBe(true);
      
      if (userIdResult.ok) {
        const result = await repository.findByUserId(userIdResult.value);
        
        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value.length).toBeGreaterThan(0);
          expect(result.value[0].userId).toBe(userIdResult.value);
        }
      }
    });

    it('should return empty array for non-existent user id', async () => {
      const userIdResult = createUserId('9999');
      expect(userIdResult.ok).toBe(true);
      
      if (userIdResult.ok) {
        const result = await repository.findByUserId(userIdResult.value);
        
        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value.length).toBe(0);
        }
      }
    });
  });

  describe('findByImageId', () => {
    it('should find a verification request by image id', async () => {
      const imageIdResult = createImageId(testImageId.toString());
      expect(imageIdResult.ok).toBe(true);
      
      if (imageIdResult.ok) {
        const result = await repository.findByImageId(imageIdResult.value);
        
        expect(result.ok).toBe(true);
        if (result.ok && result.value) {
          expect(result.value.imageId).toBe(imageIdResult.value);
        }
      }
    });

    it('should return null for non-existent image id', async () => {
      const imageIdResult = createImageId('9999');
      expect(imageIdResult.ok).toBe(true);
      
      if (imageIdResult.ok) {
        const result = await repository.findByImageId(imageIdResult.value);
        
        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value).toBeNull();
        }
      }
    });
  });

  describe('findByStatus', () => {
    it('should find verification requests by status', async () => {
      // Create a second verification request with the same status
      await prismaTest.verificationRequest.create({
        data: {
          userId: testUserId,
          imageId: testImageId,
          status: VerificationStatusEnum.PENDING
        }
      });

      const statusResult = createVerificationStatus(VerificationStatusEnum.PENDING);
      expect(statusResult.ok).toBe(true);
      if (!statusResult.ok) return;

      const result = await repository.findByStatus(statusResult.value);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.length).toBeGreaterThan(0);
        expect(result.value[0].status).toBe(statusResult.value);
      }
    });

    it('should return empty array for non-existent status', async () => {
      // First create a valid status
      const statusResult = createVerificationStatus(VerificationStatusEnum.APPROVED);
      expect(statusResult.ok).toBe(true);
      
      if (statusResult.ok) {
        const result = await repository.findByStatus(statusResult.value);
        
        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value.length).toBe(0);
        }
      }
    });
  });

  describe('save', () => {
    it('should create a new verification request', async () => {
      // Create domain objects
      const userIdResult = createUserId(testUserId.toString());
      const imageIdResult = createImageId(testImageId.toString());
      const statusResult = createVerificationStatus(VerificationStatusEnum.PENDING);
      const now = new Date();
      const createdAtResult = createDateTime(now);
      const updatedAtResult = createDateTime(now);
      
      expect(userIdResult.ok && imageIdResult.ok && statusResult.ok && 
             createdAtResult.ok && updatedAtResult.ok).toBe(true);
      
      if (userIdResult.ok && imageIdResult.ok && statusResult.ok && 
          createdAtResult.ok && updatedAtResult.ok) {
        
        // Create a new verification request
        const props: VerificationRequestProps = {
          id: 9999, // New ID
          userId: userIdResult.value,
          imageId: imageIdResult.value,
          status: statusResult.value,
          createdAt: createdAtResult.value,
          updatedAt: updatedAtResult.value
        };
        
        const createResult = createVerificationRequest(props);
        expect(createResult.ok).toBe(true);
        
        if (createResult.ok) {
          // Save the request
          const saveResult = await repository.save(createResult.value);

          expect(saveResult.ok).toBe(true);
          if (saveResult.ok) {
            expect(saveResult.value.id).toBe(9999);
            expect(saveResult.value.userId).toBe(userIdResult.value);
            expect(saveResult.value.imageId).toBe(imageIdResult.value);
            expect(saveResult.value.status).toBe(statusResult.value);
          }
        }
      }
    });

    it('should update an existing verification request', async () => {
      // First get the existing request
      const result = await repository.findById(testRequestId);
      expect(result.ok && result.value).toBeTruthy();
      
      if (result.ok && result.value) {
        // Create a new status
        const statusResult = createVerificationStatus(VerificationStatusEnum.APPROVED);
        expect(statusResult.ok).toBe(true);
        
        if (statusResult.ok) {
          // Update the request with a new status
          const adminIdResult = createUserId(testUserId.toString());
          expect(adminIdResult.ok).toBe(true);
          
          if (adminIdResult.ok) {
            const approveResult = result.value.approve(adminIdResult.value, 'Approved');
            expect(approveResult.ok).toBe(true);
            
            if (approveResult.ok) {
              // Save the updated request
              const saveResult = await repository.save(approveResult.value);
              
              expect(saveResult.ok).toBe(true);
              if (saveResult.ok) {
                expect(saveResult.value.id).toBe(testRequestId);
                expect(saveResult.value.status).toBe(VerificationStatusEnum.APPROVED);
                expect(saveResult.value.reviewedBy).toBe(adminIdResult.value);
                expect(saveResult.value.comment).toBe('Approved');
              }
            }
          }
        }
      }
    });
  });
}); 