import { createNumericId } from '../NumericId';

describe('NumericId', () => {
  it('should create a valid NumericId from a numeric string', () => {
    const result = createNumericId('123');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe(123);
    }
  });

  it('should create a valid NumericId from a number', () => {
    const result = createNumericId(123);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe(123);
    }
  });

  it('should create a valid NumericId from zero', () => {
    const result = createNumericId(0);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe(0);
    }
  });

  it('should return an error for a non-numeric string', () => {
    const result = createNumericId('invalid');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toBe('ID cannot be interpreted as a number');
    }
  });

  it('should return an error for a decimal number', () => {
    const result = createNumericId(123.45);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toBe('ID must be an integer');
    }
  });

  it('should return an error for a negative number', () => {
    const result = createNumericId(-123);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toBe('Numeric ID must be a non-negative integer');
    }
  });
});