import { UserId } from '../valueObjects/UserId';
import { ImageId } from '../valueObjects/ImageId';
import { DateTime, createDateTime } from '../valueObjects/DateTime';
import { VerificationStatus, VerificationStatusEnum, createVerificationStatus } from '../valueObjects/VerificationStatus';
import { Result, ok, err } from '../../utils/Result';

/**
 * Properties for verification request
 */
interface VerificationRequestProps {
  id: number;
  userId: UserId;
  imageId: ImageId;
  status: VerificationStatus;
  reviewedBy?: UserId;
  reviewedAt?: DateTime;
  comment?: string;
  createdAt: DateTime;
  updatedAt: DateTime;
}

/**
 * Verification request entity
 */
interface VerificationRequest {
  readonly id: number;
  readonly userId: UserId;
  readonly imageId: ImageId;
  readonly status: VerificationStatus;
  readonly reviewedBy?: UserId;
  readonly reviewedAt?: DateTime;
  readonly comment?: string;
  readonly createdAt: DateTime;
  readonly updatedAt: DateTime;

  /**
   * Approve the verification request
   * @param adminId ID of the admin who approves the request
   * @param comment Optional comment
   * @returns Updated verification request or error
   */
  approve(adminId: UserId, comment?: string): Result<VerificationRequest, Error>;

  /**
   * Reject the verification request
   * @param adminId ID of the admin who rejects the request
   * @param comment Rejection reason (required)
   * @returns Updated verification request or error
   */
  reject(adminId: UserId, comment: string): Result<VerificationRequest, Error>;

  /**
   * Check if the request is pending
   * @returns true if pending
   */
  isPending(): boolean;

  /**
   * Check if the request is approved
   * @returns true if approved
   */
  isApproved(): boolean;

  /**
   * Check if the request is rejected
   * @returns true if rejected
   */
  isRejected(): boolean;
}

/**
 * Create a verification request entity
 * @param props Properties for the verification request
 * @returns Verification request entity if valid properties, otherwise error
 */
function createVerificationRequest(props: VerificationRequestProps): Result<VerificationRequest, Error> {
  return ok({
    ...props,

    approve(adminId: UserId, comment?: string): Result<VerificationRequest, Error> {
      if (this.status !== VerificationStatusEnum.PENDING as VerificationStatus) {
        return err(new Error('Only pending requests can be approved'));
      }

      const statusResult = createVerificationStatus(VerificationStatusEnum.APPROVED);
      if (!statusResult.ok) {
        return statusResult;
      }

      const nowResult = createDateTime(new Date());
      if (!nowResult.ok) {
        return nowResult;
      }

      return createVerificationRequest({
        ...props,
        status: statusResult.value,
        reviewedBy: adminId,
        reviewedAt: nowResult.value,
        comment: comment || props.comment,
        updatedAt: nowResult.value
      });
    },

    reject(adminId: UserId, comment: string): Result<VerificationRequest, Error> {
      if (this.status !== VerificationStatusEnum.PENDING as VerificationStatus) {
        return err(new Error('Only pending requests can be rejected'));
      }

      if (!comment || comment.trim() === '') {
        return err(new Error('Rejection reason is required'));
      }

      const statusResult = createVerificationStatus(VerificationStatusEnum.REJECTED);
      if (!statusResult.ok) {
        return statusResult;
      }

      const nowResult = createDateTime(new Date());
      if (!nowResult.ok) {
        return nowResult;
      }

      return createVerificationRequest({
        ...props,
        status: statusResult.value,
        reviewedBy: adminId,
        reviewedAt: nowResult.value,
        comment,
        updatedAt: nowResult.value
      });
    },

    isPending(): boolean {
      return this.status === VerificationStatusEnum.PENDING as VerificationStatus;
    },

    isApproved(): boolean {
      return this.status === VerificationStatusEnum.APPROVED as VerificationStatus;
    },

    isRejected(): boolean {
      return this.status === VerificationStatusEnum.REJECTED as VerificationStatus;
    }
  });
}

export type { VerificationRequest, VerificationRequestProps };
export { createVerificationRequest };