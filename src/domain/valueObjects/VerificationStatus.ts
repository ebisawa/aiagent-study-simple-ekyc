import { Branded } from '../../utils/Branded';
import { Result, ok, err } from '../../utils/Result';

/**
 * Enumeration representing verification status
 */
export const VerificationStatusEnum = {
  PENDING: 'PENDING',   // Pending
  APPROVED: 'APPROVED', // Approved
  REJECTED: 'REJECTED'  // Rejected
} as const;

export type VerificationStatusType = typeof VerificationStatusEnum[keyof typeof VerificationStatusEnum];

/**
 * Value object representing verification status
 */
type VerificationStatus = Branded<VerificationStatusType, 'VerificationStatus'>;

/**
 * Function to create a verification status
 * @param value Status value
 * @returns VerificationStatus object if valid, otherwise error
 */
function createVerificationStatus(value: string): Result<VerificationStatus, Error> {
  const statusValues = Object.values(VerificationStatusEnum);
  if (!statusValues.includes(value as any)) {
    return err(new Error('無効な確認ステータスです'));
  }
  return ok(value as VerificationStatus);
}

export type { VerificationStatus };
export { createVerificationStatus };