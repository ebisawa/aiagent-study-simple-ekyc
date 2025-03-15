import { PrismaVerificationImageRepository } from '../PrismaVerificationImageRepository';
import { VerificationImageProps, createVerificationImage } from '../../../domain/entities/VerificationImage';
import { createImageId } from '../../../domain/valueObjects/ImageId';
import { createUserId } from '../../../domain/valueObjects/UserId';
import { createDateTime } from '../../../domain/valueObjects/DateTime';
import { RepositoryError } from '../RepositoryError';
import { prismaTest, resetDatabase } from './prisma';

describe('PrismaVerificationImageRepository', () => {
  let repository: PrismaVerificationImageRepository;
  let testImage: VerificationImageProps;
  let userId: string;

  beforeAll(() => {
    repository = new PrismaVerificationImageRepository(prismaTest);
  });

  beforeEach(async () => {
    // 一意のメールアドレスを生成するためにタイムスタンプを追加
    const timestamp = new Date().getTime();
    const uniqueEmail = `test-${timestamp}@example.com`;

    // Create test user
    const user = await prismaTest.user.create({
      data: {
        email: uniqueEmail,
        name: 'Test User',
        role: 'USER',
      }
    });
    userId = user.id.toString();

    // Create test image data
    const now = new Date();
    const imageIdResult = createImageId('1');
    const userIdResult = createUserId(userId);
    const createdAtResult = createDateTime(now);

    if (!imageIdResult.ok || !userIdResult.ok || !createdAtResult.ok) {
      throw new Error('Failed to create test data');
    }

    testImage = {
      id: imageIdResult.value,
      userId: userIdResult.value,
      imageUrl: 'https://example.com/test.jpg',
      createdAt: createdAtResult.value
    };
  });

  describe('save', () => {
    it('should save a new image', async () => {
      const imageResult = createVerificationImage(testImage);
      expect(imageResult.ok).toBe(true);
      if (!imageResult.ok) return;

      const saveResult = await repository.save(imageResult.value);
      expect(saveResult.ok).toBe(true);
      if (!saveResult.ok) return;

      expect(saveResult.value.userId).toBe(testImage.userId);
      expect(saveResult.value.imageUrl).toBe(testImage.imageUrl);
    });

    it('should return an error for invalid ID', async () => {
      const invalidIdResult = createImageId('-1');
      expect(invalidIdResult.ok).toBe(true);
      if (!invalidIdResult.ok) return;

      const invalidImage = {
        ...testImage,
        id: invalidIdResult.value
      };

      const imageResult = createVerificationImage(invalidImage);
      expect(imageResult.ok).toBe(true);
      if (!imageResult.ok) return;

      const saveResult = await repository.save(imageResult.value);
      expect(saveResult.ok).toBe(false);
      if (saveResult.ok) return;

      expect(saveResult.error.type).toBe('INVALID_ID_FORMAT');
    });
  });

  describe('findById', () => {
    it('should find an image by ID', async () => {
      // First save the image
      const imageResult = createVerificationImage(testImage);
      expect(imageResult.ok).toBe(true);
      if (!imageResult.ok) return;

      const saveResult = await repository.save(imageResult.value);
      expect(saveResult.ok).toBe(true);
      if (!saveResult.ok) return;

      // Search by ID
      const findResult = await repository.findById(testImage.id);
      expect(findResult.ok).toBe(true);
      if (!findResult.ok) return;

      expect(findResult.value).not.toBeNull();
      expect(findResult.value?.userId).toBe(testImage.userId);
      expect(findResult.value?.imageUrl).toBe(testImage.imageUrl);
    });

    it('should return null for non-existent ID', async () => {
      const nonExistentIdResult = createImageId('999');
      expect(nonExistentIdResult.ok).toBe(true);
      if (!nonExistentIdResult.ok) return;

      const findResult = await repository.findById(nonExistentIdResult.value);
      expect(findResult.ok).toBe(true);
      if (!findResult.ok) return;

      expect(findResult.value).toBeNull();
    });
  });

  describe('findByUserId', () => {
    it('should find all images by user ID', async () => {
      // Save the first image
      const image1Result = createVerificationImage(testImage);
      expect(image1Result.ok).toBe(true);
      if (!image1Result.ok) return;

      const saveResult1 = await repository.save(image1Result.value);
      expect(saveResult1.ok).toBe(true);

      // Create and save the second image
      const imageId2Result = createImageId('2');
      expect(imageId2Result.ok).toBe(true);
      if (!imageId2Result.ok) return;

      const image2Result = createVerificationImage({
        ...testImage,
        id: imageId2Result.value,
        imageUrl: 'https://example.com/test2.jpg'
      });
      expect(image2Result.ok).toBe(true);
      if (!image2Result.ok) return;

      const saveResult2 = await repository.save(image2Result.value);
      expect(saveResult2.ok).toBe(true);

      // Search by user ID
      const userIdResult = createUserId(userId);
      expect(userIdResult.ok).toBe(true);
      if (!userIdResult.ok) return;

      const findResult = await repository.findByUserId(userIdResult.value);
      expect(findResult.ok).toBe(true);
      if (!findResult.ok) return;

      expect(findResult.value.length).toBe(2);
    });

    it('should return an empty array for a user with no images', async () => {
      const userWithoutImagesResult = createUserId('999');
      expect(userWithoutImagesResult.ok).toBe(true);
      if (!userWithoutImagesResult.ok) return;

      const findResult = await repository.findByUserId(userWithoutImagesResult.value);
      expect(findResult.ok).toBe(true);
      if (!findResult.ok) return;

      expect(findResult.value).toEqual([]);
    });

    it('should return an error for invalid user ID', async () => {
      const invalidUserIdResult = createUserId('-1');
      expect(invalidUserIdResult.ok).toBe(true);
      if (!invalidUserIdResult.ok) return;

      const findResult = await repository.findByUserId(invalidUserIdResult.value);
      expect(findResult.ok).toBe(false);
      if (findResult.ok) return;

      expect(findResult.error.type).toBe('INVALID_ID_FORMAT');
    });
  });
});