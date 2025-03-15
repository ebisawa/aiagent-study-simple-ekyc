import { Branded } from '../../utils/Branded';
import { Result, ok, err } from '../../utils/Result';

type ImageId = Branded<string, 'ImageId'>;

function createImageId(value: string): Result<ImageId, Error> {
  if (!value || value.trim() === '') {
    return err(new Error('画像IDは空にできません'));
  }
  return ok(value as ImageId);
}

export type { ImageId };
export { createImageId };