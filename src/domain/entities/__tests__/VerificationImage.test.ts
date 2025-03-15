import { createVerificationImage, VerificationImageProps } from '../VerificationImage';
import { createImageId } from '../../valueObjects/ImageId';
import { createUserId } from '../../valueObjects/UserId';
import { createDateTime } from '../../valueObjects/DateTime';
import { Result } from '../../../utils/Result';

describe('VerificationImage entity', () => {
  it('should create a valid VerificationImage', async () => {
    const idResult = createImageId('valid-id');
    const userIdResult = createUserId('valid-user-id');
    const createdAtResult = createDateTime(new Date());

    expect(idResult.ok).toBe(true);
    expect(userIdResult.ok).toBe(true);
    expect(createdAtResult.ok).toBe(true);

    if (!idResult.ok || !userIdResult.ok || !createdAtResult.ok) {
      throw new Error('Failed to create test data');
    }

    const props: VerificationImageProps = {
      id: idResult.value,
      userId: userIdResult.value,
      imageUrl: 'https://example.com/image.jpg',
      createdAt: createdAtResult.value
    };

    const result = createVerificationImage(props);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.imageUrl).toBe('https://example.com/image.jpg');
    }
  });

  it('should return an error when imageUrl is empty', async () => {
    const idResult = createImageId('valid-id');
    const userIdResult = createUserId('valid-user-id');
    const createdAtResult = createDateTime(new Date());

    expect(idResult.ok).toBe(true);
    expect(userIdResult.ok).toBe(true);
    expect(createdAtResult.ok).toBe(true);

    if (!idResult.ok || !userIdResult.ok || !createdAtResult.ok) {
      throw new Error('Failed to create test data');
    }

    const props: VerificationImageProps = {
      id: idResult.value,
      userId: userIdResult.value,
      imageUrl: '',
      createdAt: createdAtResult.value
    };

    const result = createVerificationImage(props);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toBe('Image URL cannot be empty');
    }
  });
});
