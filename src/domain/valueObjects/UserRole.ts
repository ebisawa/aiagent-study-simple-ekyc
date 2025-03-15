import { Branded } from '../../utils/Branded';
import { Result, ok, err } from '../../utils/Result';

/**
 * User role value object
 */
type UserRole = Branded<'USER' | 'ADMIN', 'UserRole'>;

/**
 * Create a user role value object
 * @param value Role string to validate
 * @returns UserRole value object if valid, otherwise error
 */
function createUserRole(value: string): Result<UserRole, Error> {
  if (value !== 'USER' && value !== 'ADMIN') {
    return err(new Error('Invalid user role'));
  }
  return ok(value as UserRole);
}

export type { UserRole };
export { createUserRole };