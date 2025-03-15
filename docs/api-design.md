# API設計

## 画像アップロード用エンドポイント

### エンドポイント
`POST /api/upload`

### リクエスト
- ヘッダー
  - `Content-Type: multipart/form-data`
- ボディ
  - `file`: アップロードする画像ファイル

### レスポンス
- 成功時
  - ステータス: `200 OK`
  - ボディ: `{ "message": "アップロード成功", "imageUrl": "アップロードされた画像のURL" }`
- 失敗時
  - ステータス: `400 Bad Request`
  - ボディ: `{ "error": "エラーメッセージ" }`

## 画像一覧取得用エンドポイント

### エンドポイント
`GET /api/images`

### リクエスト
- クエリパラメータ
  - `userId`: ユーザーIDでフィルタリング（オプション）
  - `limit`: 取得する画像の最大数（デフォルト: 20）
  - `offset`: ページネーション用オフセット（デフォルト: 0）

### レスポンス
- 成功時
  - ステータス: `200 OK`
  - ボディ: 
  ```json
  {
    "images": [
      {
        "id": "image-1",
        "userId": 123,
        "imageUrl": "画像のURL",
        "createdAt": "2023-01-01T00:00:00Z",
        "updatedAt": "2023-01-01T00:00:00Z"
      }
    ],
    "total": 100,
    "limit": 20,
    "offset": 0
  }
  ```
- 失敗時
  - ステータス: `400 Bad Request` または `500 Internal Server Error`
  - ボディ: `{ "error": "エラーメッセージ" }`

## 画像取得用エンドポイント

### エンドポイント
`GET /api/images/{id}`

### リクエスト
- パスパラメータ
  - `id`: 取得する画像のID

### レスポンス
- 成功時
  - ステータス: `200 OK`
  - ボディ: 画像ファイル
- 失敗時
  - ステータス: `404 Not Found`
  - ボディ: `{ "error": "画像が見つかりません" }`

## 本人確認用画像送信エンドポイント

### エンドポイント
`POST /api/verification/images`

### リクエスト
- ヘッダー
  - `Content-Type: application/json`
- ボディ
  ```json
  {
    "image": "Base64エンコードされた画像データ",
    "userId": 123
  }
  ```

### レスポンス
- 成功時
  - ステータス: `200 OK`
  - ボディ: 
  ```json
  {
    "message": "本人確認用画像が送信されました",
    "requestId": 456,
    "status": "PENDING"
  }
  ```
- 失敗時
  - ステータス: `400 Bad Request` または `500 Internal Server Error`
  - ボディ: `{ "error": "エラーメッセージ" }`

## 本人確認リクエスト一覧取得エンドポイント

### エンドポイント
`GET /api/verification/requests`

### リクエスト
- クエリパラメータ
  - `status`: ステータスでフィルタリング（オプション）
  - `userId`: ユーザーIDでフィルタリング（オプション）

### レスポンス
- 成功時
  - ステータス: `200 OK`
  - ボディ: 
  ```json
  [
    {
      "id": 1,
      "userId": 123,
      "imageId": "image-1",
      "imageUrl": "画像のURL",
      "status": "PENDING",
      "reviewedBy": null,
      "reviewedAt": null,
      "comment": null,
      "createdAt": "2023-01-01T00:00:00Z",
      "updatedAt": "2023-01-01T00:00:00Z"
    }
  ]
  ```
- 失敗時
  - ステータス: `400 Bad Request` または `500 Internal Server Error`
  - ボディ: `{ "error": "エラーメッセージ" }`

## 本人確認リクエスト更新エンドポイント

### エンドポイント
`PUT /api/verification/requests/{id}`

### リクエスト
- パスパラメータ
  - `id`: 更新するリクエストのID
- ボディ
  ```json
  {
    "action": "approve" または "reject",
    "adminId": 123,
    "comment": "コメント（rejectの場合は必須）"
  }
  ```

### レスポンス
- 成功時
  - ステータス: `200 OK`
  - ボディ: 
  ```json
  {
    "id": 1,
    "userId": 123,
    "imageId": "image-1",
    "status": "APPROVED" または "REJECTED",
    "reviewedBy": 456,
    "reviewedAt": "2023-01-02T00:00:00Z",
    "comment": "コメント",
    "createdAt": "2023-01-01T00:00:00Z",
    "updatedAt": "2023-01-02T00:00:00Z"
  }
  ```
- 失敗時
  - ステータス: `400 Bad Request`、`404 Not Found` または `500 Internal Server Error`
  - ボディ: `{ "error": "エラーメッセージ" }`

## 現在のユーザー情報取得エンドポイント

### エンドポイント
`GET /api/user/current`

### リクエスト
- 認証情報（セッションクッキーなど）が必要

### レスポンス
- 成功時
  - ステータス: `200 OK`
  - ボディ: 
  ```json
  {
    "id": 123,
    "email": "user@example.com",
    "name": "ユーザー名",
    "role": "USER" または "ADMIN"
  }
  ```
- 失敗時
  - ステータス: `404 Not Found` または `500 Internal Server Error`
  - ボディ: `{ "error": "エラーメッセージ" }`
