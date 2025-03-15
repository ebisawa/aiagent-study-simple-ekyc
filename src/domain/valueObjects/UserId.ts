import { Branded } from '../../utils/Branded';
import { Result, ok, err } from '../../utils/Result';

/**
 * User ID value object
 */
export type UserId = Branded<string, 'UserId'>;

/**
 * Create a user ID value object
 * @param id ID string to validate
 * @returns UserId value object if valid, otherwise error
 */
export function createUserId(id: string | null | undefined): Result<UserId, Error> {
  // If id is null or undefined
  if (id === null || id === undefined) {
    return err(new Error('User ID cannot be empty'));
  }
  
  // Try to convert to string if not a string
  if (typeof id !== 'string') {
    try {
      id = String(id);
    } catch (e) {
      return err(new Error('Cannot convert User ID to string'));
    }
  }
  
  // Check for empty string
  if (id.trim() === '') {
    return err(new Error('User ID cannot be empty'));
  }
  
  return ok(id as UserId);
}