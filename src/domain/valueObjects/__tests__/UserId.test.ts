import { createUserId } from '../UserId';

describe('createUserId', () => {
  it('should create a valid UserId', () => {
    const result = createUserId('valid-id');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe('valid-id');
    }
  });

  it('should return an error for an empty id', () => {
    const result = createUserId('');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toBe('User ID cannot be empty');
    }
  });
});