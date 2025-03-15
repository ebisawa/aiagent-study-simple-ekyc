import { createVerificationStatus, VerificationStatusEnum } from '../VerificationStatus';

describe('VerificationStatus', () => {
  it('should create a valid PENDING status', () => {
    const result = createVerificationStatus(VerificationStatusEnum.PENDING);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe(VerificationStatusEnum.PENDING);
    }
  });

  it('should create a valid APPROVED status', () => {
    const result = createVerificationStatus(VerificationStatusEnum.APPROVED);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe(VerificationStatusEnum.APPROVED);
    }
  });

  it('should create a valid REJECTED status', () => {
    const result = createVerificationStatus(VerificationStatusEnum.REJECTED);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe(VerificationStatusEnum.REJECTED);
    }
  });

  it('should return an error for an invalid status', () => {
    const result = createVerificationStatus('INVALID');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toBe('無効な確認ステータスです');
    }
  });
});