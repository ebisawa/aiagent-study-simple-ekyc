import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { PrismaVerificationRequestRepository } from '../../../../infrastructure/repositories/PrismaVerificationRequestRepository';
import { PrismaVerificationImageRepository } from '../../../../infrastructure/repositories/PrismaVerificationImageRepository';
import { PrismaUserRepository } from '../../../../infrastructure/repositories/PrismaUserRepository';
import { UserId, createUserId } from '../../../../domain/valueObjects/UserId';
import { ImageId, createImageId } from '../../../../domain/valueObjects/ImageId';
import { VerificationStatusEnum, createVerificationStatus } from '../../../../domain/valueObjects/VerificationStatus';
import { createVerificationRequest } from '../../../../domain/entities/VerificationRequest';
import { createDateTime } from '../../../../domain/valueObjects/DateTime';
import { Result } from '../../../../utils/Result';

// テスト環境かどうかを判定
const isTest = process.env.NODE_ENV === 'test';

// Prismaクライアントの初期化
const prisma = isTest ? {} as PrismaClient : new PrismaClient();

// リポジトリの初期化
const requestRepository = new PrismaVerificationRequestRepository(prisma);
const imageRepository = new PrismaVerificationImageRepository(prisma);
const userRepository = new PrismaUserRepository(prisma);

/**
 * エラーレスポンスを生成する共通関数
 */
function createErrorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * ユーザーIDの検証と取得
 */
async function validateAndGetUser(userId: string): Promise<Result<{ userIdObj: UserId, user: any }, { message: string, status: number }>> {
  const userIdResult = createUserId(userId);
  if (!userIdResult.ok) {
    return { ok: false, error: { message: userIdResult.error.message, status: 400 } };
  }
  
  const userIdObj = userIdResult.value;
  const userResult = await userRepository.findById(userIdObj);
  
  if (!userResult.ok) {
    return { ok: false, error: { message: 'ユーザー情報の取得中にエラーが発生しました', status: 500 } };
  }
  
  const user = userResult.value;
  if (!user) {
    return { ok: false, error: { message: '指定されたユーザーが見つかりません', status: 404 } };
  }
  
  return { ok: true, value: { userIdObj, user } };
}

/**
 * 画像IDの検証と取得
 */
async function validateAndGetImage(imageId: string): Promise<Result<{ imageIdObj: ImageId, image: any }, { message: string, status: number }>> {
  const imageIdResult = createImageId(imageId);
  if (!imageIdResult.ok) {
    return { ok: false, error: { message: imageIdResult.error.message, status: 400 } };
  }
  
  const imageIdObj = imageIdResult.value;
  const imageResult = await imageRepository.findById(imageIdObj);
  
  if (!imageResult.ok) {
    return { ok: false, error: { message: '画像情報の取得中にエラーが発生しました', status: 500 } };
  }
  
  const image = imageResult.value;
  if (!image) {
    return { ok: false, error: { message: '指定された画像が見つかりません', status: 404 } };
  }
  
  return { ok: true, value: { imageIdObj, image } };
}

/**
 * リクエストをフォーマットして返却用に整形する
 */
async function formatRequestsForResponse(requests: any[]) {
  return Promise.all(requests.map(async (request: any) => {
    // 関連する画像情報を取得
    const imageResult = await imageRepository.findById(request.imageId);
    const imageUrl = imageResult.ok && imageResult.value ? imageResult.value.imageUrl : null;

    return {
      id: request.id,
      userId: request.userId,
      imageId: request.imageId,
      imageUrl,
      status: request.status,
      reviewedBy: request.reviewedBy,
      reviewedAt: request.reviewedAt,
      comment: request.comment,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt
    };
  }));
}

/**
 * ステータスによるリクエスト取得
 */
async function getRequestsByStatus(status: string) {
  const statusResult = createVerificationStatus(status as any);
  if (!statusResult.ok) {
    return { ok: false, error: { message: '無効なステータス値です', status: 400 } };
  }

  const requestsResult = await requestRepository.findByStatus(statusResult.value);
  if (!requestsResult.ok) {
    return { ok: false, error: { message: 'リクエストの取得中にエラーが発生しました', status: 500 } };
  }

  return { ok: true, value: requestsResult.value };
}

/**
 * ユーザーIDによるリクエスト取得
 */
async function getRequestsByUserId(userId: string) {
  const userValidation = await validateAndGetUser(userId);
  if (!userValidation.ok) {
    return { ok: false, error: userValidation.error };
  }

  const requestsResult = await requestRepository.findByUserId(userValidation.value.userIdObj);
  if (!requestsResult.ok) {
    return { ok: false, error: { message: 'リクエストの取得中にエラーが発生しました', status: 500 } };
  }

  return { ok: true, value: requestsResult.value };
}

/**
 * 新しい本人確認リクエストを作成する
 */
async function createNewVerificationRequest(userId: string, imageId: string) {
  // ユーザーの検証
  const userValidation = await validateAndGetUser(userId);
  if (!userValidation.ok) {
    return { ok: false, error: userValidation.error };
  }

  // 画像の検証
  const imageValidation = await validateAndGetImage(imageId);
  if (!imageValidation.ok) {
    return { ok: false, error: imageValidation.error };
  }

  // 既存のリクエストを確認（同じ画像に対する重複リクエストを防止）
  const existingRequestResult = await requestRepository.findByImageId(imageValidation.value.imageIdObj);
  if (existingRequestResult.ok && existingRequestResult.value) {
    return { ok: false, error: { message: 'この画像に対するリクエストは既に存在します', status: 409 } };
  }

  // 新しいリクエストを作成
  const now = new Date();
  const statusResult = createVerificationStatus(VerificationStatusEnum.PENDING);
  const createdAtResult = createDateTime(now);
  const updatedAtResult = createDateTime(now);

  if (!statusResult.ok || !createdAtResult.ok || !updatedAtResult.ok) {
    return { ok: false, error: { message: 'リクエストの作成中にエラーが発生しました', status: 500 } };
  }

  const requestProps = {
    id: 0, // 自動生成されるID
    userId: userValidation.value.userIdObj,
    imageId: imageValidation.value.imageIdObj,
    status: statusResult.value,
    createdAt: createdAtResult.value,
    updatedAt: updatedAtResult.value
  };

  const requestResult = createVerificationRequest(requestProps);
  if (!requestResult.ok) {
    return { ok: false, error: { message: 'リクエストの作成に失敗しました', status: 500 } };
  }

  // リクエストを保存
  const saveResult = await requestRepository.save(requestResult.value);
  if (!saveResult.ok) {
    return { ok: false, error: { message: 'リクエストの保存中にエラーが発生しました', status: 500 } };
  }

  return { ok: true, value: saveResult.value };
}

/**
 * 保存されたリクエストをレスポンス用にフォーマットする
 */
function formatRequestForResponse(request: any) {
  return {
    id: request.id,
    userId: request.userId.toString(),
    imageId: request.imageId.toString(),
    status: request.status.toString(),
    reviewedBy: null,
    reviewedAt: null,
    comment: null,
    createdAt: request.createdAt.toString(),
    updatedAt: request.updatedAt.toString()
  };
}

/**
 * リクエストIDの検証
 */
function validateRequestId(id: string): Result<number, { message: string; status: number }> {
  if (!id || isNaN(Number(id))) {
    return { ok: false, error: { message: '有効なリクエストIDが必要です', status: 400 } };
  }
  return { ok: true, value: Number(id) };
}

/**
 * リクエストアクションの検証
 */
function validateRequestAction(action: string | undefined, comment?: string): Result<string, { message: string; status: number }> {
  if (!action) {
    return { ok: false, error: { message: 'アクションは必須です', status: 400 } };
  }

  if (action !== 'approve' && action !== 'reject') {
    return { ok: false, error: { message: 'アクションは approve または reject である必要があります', status: 400 } };
  }

  if (action === 'reject' && (!comment || comment.trim() === '')) {
    return { ok: false, error: { message: '拒否理由は必須です', status: 400 } };
  }

  return { ok: true, value: action };
}

/**
 * 管理者の検証
 */
async function validateAdmin(adminId: string): Promise<Result<any, { message: string; status: number }>> {
  // 管理者の検証
  const adminValidation = await validateAndGetUser(adminId);
  if (!adminValidation.ok) {
    return adminValidation;
  }

  // 管理者権限の確認
  if (!adminValidation.value.user.isAdmin()) {
    return { ok: false, error: { message: '管理者権限が必要です', status: 403 } };
  }

  return { ok: true, value: adminValidation.value };
}

/**
 * リクエストの取得と更新
 */
async function processVerificationRequest(
  requestId: number,
  action: string,
  adminId: string | undefined,
  comment?: string
): Promise<Result<any, { message: string; status: number }>> {
  if (!adminId) {
    return { ok: false, error: { message: '管理者IDは必須です', status: 400 } };
  }

  // リクエストの取得
  const requestResult = await requestRepository.findById(requestId);
  if (!requestResult.ok) {
    return { ok: false, error: { message: 'リクエストの取得中にエラーが発生しました', status: 500 } };
  }

  const verificationRequest = requestResult.value;
  if (!verificationRequest) {
    return { ok: false, error: { message: '指定されたリクエストが見つかりません', status: 404 } };
  }

  // 管理者IDの検証
  const adminIdResult = createUserId(adminId);
  if (!adminIdResult.ok) {
    return { ok: false, error: { message: '無効な管理者IDです', status: 400 } };
  }

  // リクエストの更新
  let updateResult;
  if (action === 'approve') {
    updateResult = verificationRequest.approve(adminIdResult.value, comment);
  } else {
    // rejectの場合はcommentが必須なので、空文字をデフォルト値として設定
    updateResult = verificationRequest.reject(adminIdResult.value, comment || '');
  }

  if (!updateResult.ok) {
    return { ok: false, error: { message: updateResult.error.message, status: 400 } };
  }

  // 更新されたリクエストを保存
  const saveResult = await requestRepository.save(updateResult.value);
  if (!saveResult.ok) {
    return { ok: false, error: { message: 'リクエストの保存中にエラーが発生しました', status: 500 } };
  }

  return { ok: true, value: { saveResult: saveResult.value, adminId: adminIdResult.value, action } };
}

/**
 * 更新されたリクエストをレスポンス用にフォーマットする
 */
function formatUpdatedRequestForResponse(result: any) {
  const { saveResult, adminId, action } = result;
  
  return {
    id: saveResult.id,
    userId: saveResult.userId.toString(),
    imageId: saveResult.imageId.toString(),
    status: action === 'approve' ? 'APPROVED' : 'REJECTED',
    reviewedBy: adminId.toString(),
    reviewedAt: new Date().toISOString(),
    comment: saveResult.comment,
    createdAt: saveResult.createdAt.toString(),
    updatedAt: saveResult.updatedAt.toString()
  };
}

/**
 * 本人確認リクエスト作成API
 * POST /api/verification/requests
 * リクエストボディ:
 * - userId: ユーザーID
 * - imageId: 画像ID
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, imageId } = body;

    if (!userId || !imageId) {
      return createErrorResponse('ユーザーIDと画像IDは必須です', 400);
    }

    const result = await createNewVerificationRequest(userId, imageId);
    if (!result.ok && result.error) {
      return createErrorResponse(result.error.message, result.error.status);
    }

    // 成功レスポンス
    return NextResponse.json(formatRequestForResponse(result.value), { status: 200 });
  } catch (error) {
    return createErrorResponse('リクエストの処理中にエラーが発生しました', 500);
  }
}

/**
 * 本人確認リクエスト更新API
 * PUT /api/verification/requests/:id
 * リクエストボディ:
 * - action: 'approve' または 'reject'
 * - adminId: 管理者ID
 * - comment: コメント（rejectの場合は必須）
 */
export async function PUT(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 1];
    
    // リクエストIDの検証
    const requestIdResult = validateRequestId(id);
    if (!requestIdResult.ok) {
      return createErrorResponse(requestIdResult.error.message, requestIdResult.error.status);
    }

    const body = await request.json();
    const { action, adminId, comment } = body;

    if (!adminId) {
      return createErrorResponse('管理者IDは必須です', 400);
    }

    // アクションの検証
    const actionResult = validateRequestAction(action, comment);
    if (!actionResult.ok) {
      return createErrorResponse(actionResult.error.message, actionResult.error.status);
    }

    // 管理者の検証
    const adminResult = await validateAdmin(adminId);
    if (!adminResult.ok) {
      return createErrorResponse(adminResult.error.message, adminResult.error.status);
    }

    // リクエストの処理
    const processResult = await processVerificationRequest(
      requestIdResult.value,
      actionResult.value,
      adminId.toString(), // 文字列に変換して渡す
      comment
    );
    
    if (!processResult.ok) {
      return createErrorResponse(processResult.error.message, processResult.error.status);
    }

    // 成功レスポンス
    return NextResponse.json(
      formatUpdatedRequestForResponse(processResult.value),
      { status: 200 }
    );
  } catch (error) {
    return createErrorResponse('リクエストの更新中にエラーが発生しました', 500);
  }
}

/**
 * 本人確認リクエスト一覧取得API
 * GET /api/verification/requests
 * クエリパラメータ:
 * - status: ステータスでフィルタリング（オプション）
 * - userId: ユーザーIDでフィルタリング（オプション）
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const userId = searchParams.get('userId');

    let requestsResult: { ok: boolean; value?: any[]; error?: { message: string; status: number } };

    // ステータスでフィルタリング
    if (status) {
      requestsResult = await getRequestsByStatus(status);
    }
    // ユーザーIDでフィルタリング
    else if (userId) {
      requestsResult = await getRequestsByUserId(userId);
    }
    // フィルタリングなし - 現在は未実装（全件取得は非効率的なため）
    else {
      // 実際のアプリケーションでは、ページネーションなどを実装する必要がある
      return createErrorResponse('フィルタリングパラメータが必要です', 400);
    }

    if (!requestsResult.ok && requestsResult.error) {
      return createErrorResponse(requestsResult.error.message, requestsResult.error.status);
    }

    // レスポンス用にデータを整形
    const formattedRequests = await formatRequestsForResponse(requestsResult.value || []);

    return NextResponse.json(formattedRequests);
  } catch (error) {
    return createErrorResponse('リクエストの取得中に予期しないエラーが発生しました', 500);
  }
} 