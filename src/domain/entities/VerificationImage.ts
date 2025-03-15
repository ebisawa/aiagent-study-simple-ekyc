import { ImageId, createImageId } from '../valueObjects/ImageId';
import { UserId, createUserId } from '../valueObjects/UserId';
import { DateTime, createDateTime } from '../valueObjects/DateTime';
import { Result, ok, err } from '../../utils/Result';

/**
 * Properties for verification image
 */
interface VerificationImageProps {
  id: ImageId;
  userId: UserId;
  imageUrl: string;
  createdAt: DateTime;
}

/**
 * Verification image entity
 */
interface VerificationImage {
  readonly id: ImageId;
  readonly userId: UserId;
  readonly imageUrl: string;
  readonly createdAt: DateTime;
}

/**
 * Create a verification image entity
 * @param props Properties for the verification image
 * @returns Verification image entity if valid properties, otherwise error
 */
function createVerificationImage(props: VerificationImageProps): Result<VerificationImage, Error> {
  if (!props.imageUrl || props.imageUrl.trim() === '') {
    return err(new Error('Image URL cannot be empty'));
  }
  return ok({ ...props });
}

export type { VerificationImage, VerificationImageProps };
export { createVerificationImage };
