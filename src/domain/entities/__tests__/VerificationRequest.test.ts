import { createVerificationRequest, VerificationRequestProps } from '../VerificationRequest';
import { createImageId } from '../../valueObjects/ImageId';
import { createUserId } from '../../valueObjects/UserId';
import { createDateTime } from '../../valueObjects/DateTime';
import { createVerificationStatus, VerificationStatusEnum } from '../../valueObjects/VerificationStatus';

describe('VerificationRequest entity', () => {
  let validProps: VerificationRequestProps;

  beforeEach(() => {
    // Prepare valid properties for testing
    const userId = createUserId('user-123').value as any;
    const imageId = createImageId('image-456').value as any;
    const status = createVerificationStatus(VerificationStatusEnum.PENDING).value as any;
    const now = createDateTime(new Date()).value as any;

    validProps = {
      id: 1,
      userId,
      imageId,
      status,
      createdAt: now,
      updatedAt: now
    };
  });

  it('should create a valid VerificationRequest', () => {
    const result = createVerificationRequest(validProps);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.id).toBe(1);
      expect(result.value.isPending()).toBe(true);
    }
  });

  it('should approve a pending request', () => {
    const adminId = createUserId('admin-123').value as any;
    const result = createVerificationRequest(validProps);
    expect(result.ok).toBe(true);
    
    if (result.ok) {
      const approveResult = result.value.approve(adminId, 'Approved comment');
      expect(approveResult.ok).toBe(true);
      
      if (approveResult.ok) {
        expect(approveResult.value.isApproved()).toBe(true);
        expect(approveResult.value.isPending()).toBe(false);
        expect(approveResult.value.reviewedBy).toBe(adminId);
        expect(approveResult.value.comment).toBe('Approved comment');
      }
    }
  });

  it('should reject a pending request with a comment', () => {
    const adminId = createUserId('admin-123').value as any;
    const result = createVerificationRequest(validProps);
    expect(result.ok).toBe(true);
    
    if (result.ok) {
      const rejectResult = result.value.reject(adminId, 'Rejection reason');
      expect(rejectResult.ok).toBe(true);
      
      if (rejectResult.ok) {
        expect(rejectResult.value.isRejected()).toBe(true);
        expect(rejectResult.value.isPending()).toBe(false);
        expect(rejectResult.value.reviewedBy).toBe(adminId);
        expect(rejectResult.value.comment).toBe('Rejection reason');
      }
    }
  });

  it('should not allow rejecting a request without a comment', () => {
    const adminId = createUserId('admin-123').value as any;
    const result = createVerificationRequest(validProps);
    expect(result.ok).toBe(true);
    
    if (result.ok) {
      const rejectResult = result.value.reject(adminId, '');
      expect(rejectResult.ok).toBe(false);
      if (!rejectResult.ok) {
        expect(rejectResult.error.message).toBe('Rejection reason is required');
      }
    }
  });

  it('should not allow approving a non-pending request', () => {
    const adminId = createUserId('admin-123').value as any;
    // Create an already approved request
    const approvedStatus = createVerificationStatus(VerificationStatusEnum.APPROVED).value as any;
    const approvedProps = { ...validProps, status: approvedStatus };
    
    const result = createVerificationRequest(approvedProps);
    expect(result.ok).toBe(true);
    
    if (result.ok) {
      const approveResult = result.value.approve(adminId);
      expect(approveResult.ok).toBe(false);
      if (!approveResult.ok) {
        expect(approveResult.error.message).toBe('Only pending requests can be approved');
      }
    }
  });

  it('should not allow rejecting a non-pending request', () => {
    const adminId = createUserId('admin-123').value as any;
    // Create an already rejected request
    const rejectedStatus = createVerificationStatus(VerificationStatusEnum.REJECTED).value as any;
    const rejectedProps = { ...validProps, status: rejectedStatus };
    
    const result = createVerificationRequest(rejectedProps);
    expect(result.ok).toBe(true);
    
    if (result.ok) {
      const rejectResult = result.value.reject(adminId, 'New rejection reason');
      expect(rejectResult.ok).toBe(false);
      if (!rejectResult.ok) {
        expect(rejectResult.error.message).toBe('Only pending requests can be rejected');
      }
    }
  });

  it('should correctly identify request status', () => {
    // PENDING
    const pendingResult = createVerificationRequest(validProps);
    expect(pendingResult.ok).toBe(true);
    if (pendingResult.ok) {
      expect(pendingResult.value.isPending()).toBe(true);
      expect(pendingResult.value.isApproved()).toBe(false);
      expect(pendingResult.value.isRejected()).toBe(false);
    }

    // APPROVED
    const approvedStatus = createVerificationStatus(VerificationStatusEnum.APPROVED).value as any;
    const approvedProps = { ...validProps, status: approvedStatus };
    const approvedResult = createVerificationRequest(approvedProps);
    expect(approvedResult.ok).toBe(true);
    if (approvedResult.ok) {
      expect(approvedResult.value.isPending()).toBe(false);
      expect(approvedResult.value.isApproved()).toBe(true);
      expect(approvedResult.value.isRejected()).toBe(false);
    }

    // REJECTED
    const rejectedStatus = createVerificationStatus(VerificationStatusEnum.REJECTED).value as any;
    const rejectedProps = { ...validProps, status: rejectedStatus };
    const rejectedResult = createVerificationRequest(rejectedProps);
    expect(rejectedResult.ok).toBe(true);
    if (rejectedResult.ok) {
      expect(rejectedResult.value.isPending()).toBe(false);
      expect(rejectedResult.value.isApproved()).toBe(false);
      expect(rejectedResult.value.isRejected()).toBe(true);
    }
  });
});