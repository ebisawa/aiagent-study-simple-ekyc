import { UserId, createUserId } from '../valueObjects/UserId';
import { Email, createEmail } from '../valueObjects/Email';
import { UserRole, createUserRole } from '../valueObjects/UserRole';
import { DateTime, createDateTime } from '../valueObjects/DateTime';
import { Result, ok, err } from '../../utils/Result';

/**
 * Properties for user entity
 */
interface UserProps {
  id: UserId;
  email: Email;
  name: string;
  role: UserRole;
  createdAt: DateTime;
  updatedAt: DateTime;
}

/**
 * User entity
 */
interface User {
  readonly id: UserId;
  readonly email: Email;
  readonly name: string;
  readonly role: UserRole;
  readonly createdAt: DateTime;
  readonly updatedAt: DateTime;
  
  /**
   * Check if user has admin role
   * @returns true if user is admin
   */
  isAdmin(): boolean;
  
  /**
   * Change user role
   * @param newRole New role to assign
   * @returns Updated user or error
   */
  changeRole(newRole: UserRole): Result<User, Error>;
  
  /**
   * Change user name
   * @param newName New name to assign
   * @returns Updated user or error
   */
  changeName(newName: string): Result<User, Error>;
}

/**
 * Create a user entity
 * @param props Properties for the user
 * @returns User entity if valid properties, otherwise error
 */
function createUser(props: UserProps): Result<User, Error> {
  if (!props.name || props.name.trim() === '') {
    return err(new Error('Name cannot be empty'));
  }

  return ok({
    ...props,
    isAdmin(): boolean {
      return props.role === 'ADMIN';
    },
    changeRole(newRole: UserRole): Result<User, Error> {
      const dateTimeResult = createDateTime(new Date());
      if (!dateTimeResult.ok) {
        return err(dateTimeResult.error);
      }
      return createUser({
        ...props,
        role: newRole,
        updatedAt: dateTimeResult.value
      });
    },
    changeName(newName: string): Result<User, Error> {
      if (!newName || newName.trim() === '') {
        return err(new Error('Name cannot be empty'));
      }
      const dateTimeResult = createDateTime(new Date());
      if (!dateTimeResult.ok) {
        return err(dateTimeResult.error);
      }
      return createUser({
        ...props,
        name: newName,
        updatedAt: dateTimeResult.value
      });
    }
  });
}

export type { User, UserProps };
export { createUser };