import { VerificationRequest } from '../../domain/entities/VerificationRequest';
import { ImageId } from '../../domain/valueObjects/ImageId';
import { UserId } from '../../domain/valueObjects/UserId';
import { VerificationStatus } from '../../domain/valueObjects/VerificationStatus';
import { Result } from '../../utils/Result';
import { RepositoryError } from './RepositoryError';

/**
 * Interface for verification request repository
 */
export interface VerificationRequestRepository {
  /**
   * Find verification request by ID
   * @param id ID of the request to find
   * @returns Verification request or null
   */
  findById(id: number): Promise<Result<VerificationRequest | null, RepositoryError>>;

  /**
   * Find verification requests by user ID
   * @param userId ID of the user to search for
   * @returns Array of verification requests
   */
  findByUserId(userId: UserId): Promise<Result<VerificationRequest[], RepositoryError>>;

  /**
   * Find verification request by image ID
   * @param imageId ID of the image to search for
   * @returns Verification request or null
   */
  findByImageId(imageId: ImageId): Promise<Result<VerificationRequest | null, RepositoryError>>;

  /**
   * Find verification requests by status
   * @param status Status to search for
   * @returns Array of verification requests
   */
  findByStatus(status: VerificationStatus): Promise<Result<VerificationRequest[], RepositoryError>>;

  /**
   * Save verification request
   * @param request Verification request to save
   * @returns Saved verification request
   */
  save(request: VerificationRequest): Promise<Result<VerificationRequest, RepositoryError>>;
}