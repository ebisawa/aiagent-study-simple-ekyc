import { createDateTime, DateTime } from '../DateTime';
import { Result } from '../../../utils/Result';

describe('DateTime', () => {
  it('should create a valid DateTime', () => {
    const result = createDateTime(new Date());
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value instanceof Date).toBe(true);
    }
  });

  it('should return an error for an invalid date', () => {
    const result = createDateTime(new Date('invalid'));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toBe('Invalid date');
    }
  });
});