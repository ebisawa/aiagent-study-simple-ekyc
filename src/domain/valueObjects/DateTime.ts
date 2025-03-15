import { Result, ok, err } from '../../utils/Result';
import { Branded } from '../../utils/Branded';

/**
 * DateTime value object
 */
type DateTime = Branded<Date, 'DateTime'>;

/**
 * Create a date time value object
 * @param date Date to validate
 * @returns DateTime value object if valid, otherwise error
 */
function createDateTime(date: Date): Result<DateTime, Error> {
  if (isNaN(date.getTime())) {
    return err(new Error('Invalid date'));
  }
  return ok(date as DateTime);
}

export type { DateTime };
export { createDateTime };
