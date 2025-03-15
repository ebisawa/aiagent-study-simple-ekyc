export type RepositoryErrorType = 
  | 'INVALID_ID_FORMAT'
  | 'DATABASE_ERROR'
  | 'NOT_FOUND'
  | 'DUPLICATE_EMAIL'
  | 'INVALID_DATA'
  | 'MAPPING_ERROR';

export class RepositoryError extends Error {
  constructor(
    public readonly type: RepositoryErrorType,
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = 'RepositoryError';
  }

  static invalidIdFormat(message: string = 'IDの形式が不正です'): RepositoryError {
    return new RepositoryError('INVALID_ID_FORMAT', message);
  }

  static databaseError(cause: unknown): RepositoryError {
    return new RepositoryError(
      'DATABASE_ERROR',
      'データベース操作中にエラーが発生しました',
      cause
    );
  }

  static notFound(message: string = 'データが見つかりません'): RepositoryError {
    return new RepositoryError('NOT_FOUND', message);
  }

  static duplicateEmail(message: string = 'このメールアドレスは既に使用されています'): RepositoryError {
    return new RepositoryError('DUPLICATE_EMAIL', message);
  }

  static invalidData(field: string = ''): RepositoryError {
    const message = field ? `${field}のデータが不正です` : 'データが不正です';
    return new RepositoryError('INVALID_DATA', message);
  }

  static mappingError(cause: unknown): RepositoryError {
    return new RepositoryError(
      'MAPPING_ERROR',
      'データのマッピング中にエラーが発生しました',
      cause
    );
  }
}