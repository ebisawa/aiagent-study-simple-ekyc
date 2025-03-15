import { createUser, UserProps } from '../User';
import { createUserId } from '../../valueObjects/UserId';
import { createEmail } from '../../valueObjects/Email';
import { createUserRole } from '../../valueObjects/UserRole';
import { createDateTime } from '../../valueObjects/DateTime';

describe('User entity', () => {
  let validUserProps: UserProps;

  beforeEach(() => {
    const idResult = createUserId('valid-id');
    const emailResult = createEmail('test@example.com');
    const roleResult = createUserRole('USER');
    const createdAtResult = createDateTime(new Date());
    const updatedAtResult = createDateTime(new Date());

    expect(idResult.ok).toBe(true);
    expect(emailResult.ok).toBe(true);
    expect(roleResult.ok).toBe(true);
    expect(createdAtResult.ok).toBe(true);
    expect(updatedAtResult.ok).toBe(true);

    if (!idResult.ok || !emailResult.ok || !roleResult.ok || !createdAtResult.ok || !updatedAtResult.ok) {
      throw new Error('Failed to create test data');
    }

    validUserProps = {
      id: idResult.value,
      email: emailResult.value,
      name: 'Test User',
      role: roleResult.value,
      createdAt: createdAtResult.value,
      updatedAt: updatedAtResult.value,
    };
  });

  it('should create a valid User', () => {
    const result = createUser(validUserProps);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.name).toBe('Test User');
    }
  });

  it('should change the user role', () => {
    const userResult = createUser(validUserProps);
    expect(userResult.ok).toBe(true);
    if (!userResult.ok) return;

    const roleResult = createUserRole('ADMIN');
    expect(roleResult.ok).toBe(true);
    if (!roleResult.ok) return;

    const result = userResult.value.changeRole(roleResult.value);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.role).toBe('ADMIN');
    }
  });

  it('should return an error when changing to an empty name', () => {
    const userResult = createUser(validUserProps);
    expect(userResult.ok).toBe(true);
    if (!userResult.ok) return;

    const result = userResult.value.changeName('');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toBe('Name cannot be empty');
    }
  });
});