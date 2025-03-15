import { createEmail, Email } from '../Email';
import { Result } from '../../../utils/Result';

describe('Email', () => {
  it('should create a valid Email', () => {
    const result = createEmail('test@example.com');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(typeof result.value).toBe('string');
      expect(result.value).toBe('test@example.com');
    }
  });

  it('should return an error for an invalid email', () => {
    const result = createEmail('invalid-email');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toBe('Invalid email format');
    }
  });

  it('should return an error for an empty email', () => {
    const result = createEmail('');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toBe('Invalid email format');
    }
  });
});