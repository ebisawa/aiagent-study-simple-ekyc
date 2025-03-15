import { Branded } from '../../utils/Branded';
import { Result, ok, err } from '../../utils/Result';

/**
 * Email value object
 */
type Email = Branded<string, 'Email'>;

/**
 * Create an email value object
 * @param value Email string to validate
 * @returns Email value object if valid, otherwise error
 */
function createEmail(value: string): Result<Email, Error> {
  if (!value || !value.includes('@')) {
    return err(new Error('Invalid email format'));
  }
  return ok(value as Email);
}

export type { Email };
export { createEmail };