import { createUserRole, UserRole } from '../UserRole';
import { Result } from '../../../utils/Result';

describe('UserRole', () => {
  it('should create a valid USER role', () => {
    const result = createUserRole('USER');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe('USER');
    }
  });

  it('should create a valid ADMIN role', () => {
    const result = createUserRole('ADMIN');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe('ADMIN');
    }
  });

  it('should return an error for an invalid role', () => {
    const result = createUserRole('INVALID');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toBe('Invalid user role');
    }
  });
});