import { createImageId, ImageId } from '../ImageId';
import { Result } from '../../../utils/Result';

describe('ImageId', () => {
  it('should create a valid ImageId', () => {
    const result = createImageId('valid-id');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(typeof result.value).toBe('string');
    }
  });

  it('should return an error for an empty id', () => {
    const result = createImageId('');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toBe('画像IDは空にできません');
    }
  });
});