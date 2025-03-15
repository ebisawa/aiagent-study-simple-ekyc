import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { PrismaVerificationRequestRepository } from '../../../../../infrastructure/repositories/PrismaVerificationRequestRepository';
import { PrismaUserRepository } from '../../../../../infrastructure/repositories/PrismaUserRepository';
import { createUserId } from '../../../../../domain/valueObjects/UserId';
import { createDateTime } from '../../../../../domain/valueObjects/DateTime';

const prisma = new PrismaClient();
const requestRepository = new PrismaVerificationRequestRepository(prisma);
const userRepository = new PrismaUserRepository(prisma);

/**
 * エラーレスポンスを生成する共通関数
 */
function createErrorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    
    if (!id || isNaN(Number(id))) {
      return createErrorResponse('有効なリクエストIDが必要です', 400);
    }

    const requestId = Number(id);
    const body = await request.json();
    const { action, adminId, comment } = body;

    if (!action || !adminId) {
      return createErrorResponse('アクションと管理者IDは必須です', 400);
    }

    if (action !== 'approve' && action !== 'reject') {
      return createErrorResponse('アクションは approve または reject である必要があります', 400);
    }

    if (action === 'reject' && (!comment || comment.trim() === '')) {
      return createErrorResponse('拒否理由は必須です', 400);
    }

    // 管理者IDの検証
    const adminIdResult = createUserId(adminId);
    if (!adminIdResult.ok) {
      return createErrorResponse('無効な管理者IDです', 400);
    }

    // リクエストの取得
    const requestResult = await requestRepository.findById(requestId);
    if (!requestResult.ok) {
      return createErrorResponse('リクエストの取得中にエラーが発生しました', 500);
    }

    const verificationRequest = requestResult.value;
    if (!verificationRequest) {
      return createErrorResponse('指定されたリクエストが見つかりません', 404);
    }

    // リクエストの更新
    let updateResult;
    if (action === 'approve') {
      updateResult = verificationRequest.approve(adminIdResult.value, comment);
    } else {
      updateResult = verificationRequest.reject(adminIdResult.value, comment);
    }

    if (!updateResult.ok) {
      return createErrorResponse(updateResult.error.message, 400);
    }

    // 更新されたリクエストを保存
    const saveResult = await requestRepository.save(updateResult.value);
    if (!saveResult.ok) {
      return createErrorResponse('リクエストの保存中にエラーが発生しました', 500);
    }

    // 現在の日時を取得
    const now = new Date();
    const dateTimeResult = createDateTime(now);
    if (!dateTimeResult.ok) {
      return createErrorResponse('日時の生成に失敗しました', 500);
    }

    const response = {
      id: saveResult.value.id,
      userId: saveResult.value.userId.toString(),
      imageId: saveResult.value.imageId.toString(),
      status: action === 'approve' ? 'APPROVED' : 'REJECTED',
      reviewedBy: adminIdResult.value.toString(),
      reviewedAt: now.toISOString(),
      comment: comment,
      createdAt: saveResult.value.createdAt.toString(),
      updatedAt: saveResult.value.updatedAt.toString()
    };
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    return createErrorResponse('リクエストの更新中にエラーが発生しました', 500);
  }
} 