import { Branded } from '../../utils/Branded';
import { Result, ok, err } from '../../utils/Result';

/**
 * Numeric ID value object
 */
type NumericId = Branded<number, 'NumericId'>;

/**
 * Create a numeric ID value object
 * @param value Numeric value to validate
 * @returns NumericId value object if valid, otherwise error
 */
function createNumericId(value: string | number): Result<NumericId, Error> {
  const numericValue = typeof value === 'string' ? Number(value) : value;
  if (isNaN(numericValue)) {
    return err(new Error('ID cannot be interpreted as a number'));
  }
  if (!Number.isInteger(numericValue)) {
    return err(new Error('ID must be an integer'));
  }
  if (numericValue < 0) {
    return err(new Error('Numeric ID must be a non-negative integer'));
  }
  return ok(numericValue as NumericId);
}

export type { NumericId };
export { createNumericId };