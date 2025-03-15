# ドメインモデル詳細設計

## 値オブジェクト (Value Objects)

### UserId
```typescript
type UserId = Branded<string, "UserId">;

// 作成関数
function createUserId(id: string): Result<UserId, Error> {
  if (!id || id.trim() === "") {
    return err(new Error("ユーザーIDは空にできません"));
  }
  return ok(id as UserId);
}
```

### ImageId
```typescript
type ImageId = Branded<string, "ImageId">;

// 作成関数
function createImageId(id: string): Result<ImageId, Error> {
  if (!id || id.trim() === "") {
    return err(new Error("画像IDは空にできません"));
  }
  return ok(id as ImageId);
}
```

### NumericId
```typescript
type NumericId = Branded<number, "NumericId">;

// 作成関数
function createNumericId(id: number): Result<NumericId, Error> {
  if (isNaN(id) || id < 0 || !Number.isInteger(id)) {
    return err(new Error("数値IDは0以上の整数である必要があります"));
  }
  return ok(id as NumericId);
}
```

### VerificationStatus
```typescript
enum VerificationStatusEnum {
  PENDING = "PENDING",       // 未確認
  APPROVED = "APPROVED",     // 承認済み
  REJECTED = "REJECTED"      // 拒否
}

type VerificationStatus = Branded<VerificationStatusEnum, "VerificationStatus">;

// 作成関数
function createVerificationStatus(status: VerificationStatusEnum): Result<VerificationStatus, Error> {
  if (!Object.values(VerificationStatusEnum).includes(status)) {
    return err(new Error("無効な確認ステータス"));
  }
  return ok(status as VerificationStatus);
}
```

### UserRole
```typescript
enum UserRoleEnum {
  USER = "USER",           // 一般ユーザー
  ADMIN = "ADMIN"          // 管理者
}

type UserRole = Branded<UserRoleEnum, "UserRole">;

// 作成関数
function createUserRole(role: UserRoleEnum): Result<UserRole, Error> {
  if (!Object.values(UserRoleEnum).includes(role)) {
    return err(new Error("無効なユーザーロール"));
  }
  return ok(role as UserRole);
}
```

### Email
```typescript
type Email = Branded<string, "Email">;

// 作成関数
function createEmail(email: string): Result<Email, Error> {
  // 簡単なメールバリデーション
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return err(new Error("無効なメールアドレス形式です"));
  }
  return ok(email as Email);
}
```

### DateTime
```typescript
type DateTime = Branded<Date, "DateTime">;

// 作成関数
function createDateTime(date: Date): Result<DateTime, Error> {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return err(new Error("無効な日付"));
  }
  return ok(date as DateTime);
}
```

### ImageMetadata
```typescript
interface ImageMetadataProps {
  capturedAt: DateTime;
  deviceInfo?: string;
  dimensions?: {
    width: number;
    height: number;
  };
}

type ImageMetadata = Branded<ImageMetadataProps, "ImageMetadata">;

// 作成関数
function createImageMetadata(props: ImageMetadataProps): Result<ImageMetadata, Error> {
  if (!props.capturedAt) {
    return err(new Error("撮影日時は必須です"));
  }
  return ok(props as ImageMetadata);
}
```

## エンティティ (Entities)

### User
```typescript
interface UserProps {
  id: UserId;
  email: Email;
  name: string;
  role: UserRole;
  createdAt: DateTime;
  updatedAt: DateTime;
}

interface User {
  readonly id: UserId;
  readonly email: Email;
  readonly name: string;
  readonly role: UserRole;
  readonly createdAt: DateTime;
  readonly updatedAt: DateTime;
  
  // メソッド
  isAdmin(): boolean;
  changeRole(newRole: UserRole): Result<User, Error>;
  changeName(newName: string): Result<User, Error>;
}

// ファクトリ関数
function createUser(props: UserProps): Result<User, Error> {
  // バリデーションなど
  return ok({
    ...props,
    isAdmin(): boolean {
      return props.role === UserRoleEnum.ADMIN as UserRole;
    },
    changeRole(newRole: UserRole): Result<User, Error> {
      return createUser({
        ...props,
        role: newRole,
        updatedAt: createDateTime(new Date()).value
      });
    },
    changeName(newName: string): Result<User, Error> {
      if (!newName || newName.trim() === "") {
        return err(new Error("名前は空にできません"));
      }
      return createUser({
        ...props,
        name: newName,
        updatedAt: createDateTime(new Date()).value
      });
    }
  });
}
```

### VerificationImage
```typescript
interface VerificationImageProps {
  id: ImageId;
  userId: UserId;
  imageUrl: string;
  metadata: ImageMetadata;
  createdAt: DateTime;
}

interface VerificationImage {
  readonly id: ImageId;
  readonly userId: UserId;
  readonly imageUrl: string;
  readonly metadata: ImageMetadata;
  readonly createdAt: DateTime;
  
  // メソッド
  belongsToUser(userId: UserId): boolean;
}

// ファクトリ関数
function createVerificationImage(props: VerificationImageProps): Result<VerificationImage, Error> {
  if (!props.imageUrl || props.imageUrl.trim() === "") {
    return err(new Error("画像URLは必須です"));
  }
  
  return ok({
    ...props,
    belongsToUser(userId: UserId): boolean {
      return props.userId === userId;
    }
  });
}
```

### VerificationRequest
```typescript
interface VerificationRequestProps {
  id: NumericId;
  userId: UserId;
  imageId: ImageId;
  status: VerificationStatus;
  reviewedBy?: UserId;
  reviewedAt?: DateTime;
  comment?: string;
  createdAt: DateTime;
  updatedAt: DateTime;
}

interface VerificationRequest {
  readonly id: NumericId;
  readonly userId: UserId;
  readonly imageId: ImageId;
  readonly status: VerificationStatus;
  readonly reviewedBy?: UserId;
  readonly reviewedAt?: DateTime;
  readonly comment?: string;
  readonly createdAt: DateTime;
  readonly updatedAt: DateTime;
  
  // メソッド
  approve(adminId: UserId, comment?: string): Result<VerificationRequest, Error>;
  reject(adminId: UserId, comment: string): Result<VerificationRequest, Error>;
  isPending(): boolean;
  isApproved(): boolean;
  isRejected(): boolean;
}

// ファクトリ関数
function createVerificationRequest(props: VerificationRequestProps): Result<VerificationRequest, Error> {
  return ok({
    ...props,
    approve(adminId: UserId, comment?: string): Result<VerificationRequest, Error> {
      if (this.status !== VerificationStatusEnum.PENDING as VerificationStatus) {
        return err(new Error("保留中のリクエストのみ承認できます"));
      }
      
      return createVerificationRequest({
        ...props,
        status: createVerificationStatus(VerificationStatusEnum.APPROVED).value,
        reviewedBy: adminId,
        reviewedAt: createDateTime(new Date()).value,
        comment: comment || props.comment,
        updatedAt: createDateTime(new Date()).value
      });
    },
    reject(adminId: UserId, comment: string): Result<VerificationRequest, Error> {
      if (this.status !== VerificationStatusEnum.PENDING as VerificationStatus) {
        return err(new Error("保留中のリクエストのみ拒否できます"));
      }
      
      if (!comment || comment.trim() === "") {
        return err(new Error("拒否理由は必須です"));
      }
      
      return createVerificationRequest({
        ...props,
        status: createVerificationStatus(VerificationStatusEnum.REJECTED).value,
        reviewedBy: adminId,
        reviewedAt: createDateTime(new Date()).value,
        comment: comment,
        updatedAt: createDateTime(new Date()).value
      });
    },
    isPending(): boolean {
      return props.status === VerificationStatusEnum.PENDING as VerificationStatus;
    },
    isApproved(): boolean {
      return props.status === VerificationStatusEnum.APPROVED as VerificationStatus;
    },
    isRejected(): boolean {
      return props.status === VerificationStatusEnum.REJECTED as VerificationStatus;
    }
  });
}
```

## リポジトリインターフェース (Repository Interfaces)

### UserRepository
```typescript
interface UserRepository {
  findById(id: UserId): Promise<Result<User | null, Error>>;
  findByEmail(email: Email): Promise<Result<User | null, Error>>;
  save(user: User): Promise<Result<User, Error>>;
  findAll(): Promise<Result<User[], Error>>;
}
```

### VerificationImageRepository
```typescript
interface VerificationImageRepository {
  findById(id: ImageId): Promise<Result<VerificationImage | null, Error>>;
  findByUserId(userId: UserId): Promise<Result<VerificationImage[], Error>>;
  save(image: VerificationImage): Promise<Result<VerificationImage, Error>>;
}
```

### VerificationRequestRepository
```typescript
interface VerificationRequestRepository {
  findById(id: NumericId): Promise<Result<VerificationRequest | null, Error>>;
  findByUserId(userId: UserId): Promise<Result<VerificationRequest[], Error>>;
  findByImageId(imageId: ImageId): Promise<Result<VerificationRequest | null, Error>>;
  findByStatus(status: VerificationStatus): Promise<Result<VerificationRequest[], Error>>;
  save(request: VerificationRequest): Promise<Result<VerificationRequest, Error>>;
}
```

## Result型の定義

```typescript
type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

function err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}
```

## Branded型の定義

```typescript
type Branded<T, B> = T & { _brand: B };
```