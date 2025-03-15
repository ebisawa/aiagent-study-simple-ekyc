import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { PrismaVerificationImageRepository } from '../../../../infrastructure/repositories/PrismaVerificationImageRepository';
import { PrismaUserRepository } from '../../../../infrastructure/repositories/PrismaUserRepository';
import { PrismaVerificationRequestRepository } from '../../../../infrastructure/repositories/PrismaVerificationRequestRepository';
import { UserId, createUserId } from '../../../../domain/valueObjects/UserId';
import { createVerificationImage } from '../../../../domain/entities/VerificationImage';
import { createImageId } from '../../../../domain/valueObjects/ImageId';
import { createDateTime } from '../../../../domain/valueObjects/DateTime';
import { VerificationStatusEnum, createVerificationStatus } from '../../../../domain/valueObjects/VerificationStatus';
import { createVerificationRequest } from '../../../../domain/entities/VerificationRequest';
import { Result } from '../../../../utils/Result';

// ファイルサイズ制限を設定（50MB）
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
};

const prisma = new PrismaClient();
const imageRepository = new PrismaVerificationImageRepository(prisma);
const userRepository = new PrismaUserRepository(prisma);
const requestRepository = new PrismaVerificationRequestRepository(prisma);

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
 * 本人確認用画像アップロードAPI
 * POST /api/verification/images
 */
export async function POST(request: NextRequest) {
  try {
    // リクエストのContent-Typeを確認
    const contentType = request.headers.get('Content-Type');
    
    // リクエストの処理方法を変更
    let imageData: string;
    let userId: string;
    
    if (contentType?.includes('multipart/form-data')) {
      // FormDataとして処理
      try {
        const formData = await request.formData();
        
        imageData = formData.get('image') as string;
        userId = formData.get('userId') as string;
        
        // userId が null または undefined の場合のチェックを追加
        if (userId === null || userId === undefined) {
          return createErrorResponse('ユーザーIDが提供されていません', 400);
        }
        
        // 文字列でない場合は文字列に変換
        if (typeof userId !== 'string') {
          userId = String(userId);
        }
      } catch (error) {
        return createErrorResponse('フォームデータの解析に失敗しました', 400);
      }
    } else {
      // JSONとして処理
      try {
        const jsonData = await request.json();
        
        imageData = jsonData.image;
        userId = jsonData.userId;
        
        // userId が null または undefined の場合のチェックを追加
        if (userId === null || userId === undefined) {
          return createErrorResponse('ユーザーIDが提供されていません', 400);
        }
        
        // 文字列でない場合は文字列に変換
        if (typeof userId !== 'string') {
          userId = String(userId);
        }
      } catch (error) {
        return createErrorResponse('JSONデータの解析に失敗しました', 400);
      }
    }

    // 入力検証
    if (!imageData) {
      return createErrorResponse('画像データが必要です', 400);
    }

    if (!userId) {
      return createErrorResponse('ユーザーIDが必要です', 400);
    }

    // ユーザーの存在確認
    const userResult = await validateAndGetUser(userId);
    if (!userResult.ok) {
      return createErrorResponse(userResult.error.message, userResult.error.status);
    }
    
    const { userIdObj } = userResult.value;

    // Base64データを抽出
    let base64Data = imageData;
    let mimeType = 'image/jpeg';
    
    // data:image/jpeg;base64,xxxxx 形式の場合、Base64部分とMIMEタイプを抽出
    if (imageData.startsWith('data:')) {
      const matches = imageData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        mimeType = matches[1];
        base64Data = matches[2];
      } else {
        base64Data = imageData.split(',')[1];
      }
    }

    // 日時の生成
    const now = new Date();
    const dateTimeResult = createDateTime(now);
    if (!dateTimeResult.ok) {
      return createErrorResponse('日時の生成に失敗しました', 500);
    }

    // 画像エンティティの作成 - IDは自動生成されるので0を指定
    const tempImageId = "0"; // 一時的なID（Prismaが自動生成）
    const imageIdResult = createImageId(tempImageId);
    if (!imageIdResult.ok) {
      return createErrorResponse('画像IDの生成に失敗しました', 500);
    }

    // 画像エンティティの作成
    const verificationImageResult = createVerificationImage({
      id: imageIdResult.value,
      userId: userIdObj,
      imageUrl: `data:${mimeType};base64,${base64Data}`,
      createdAt: dateTimeResult.value
    });

    if (!verificationImageResult.ok) {
      return createErrorResponse(verificationImageResult.error.message, 400);
    }

    // 画像の保存
    const saveResult = await imageRepository.save(verificationImageResult.value);
    if (!saveResult.ok) {
      return createErrorResponse('画像の保存中にエラーが発生しました', 500);
    }
    
    const savedImage = saveResult.value;

    // 本人確認リクエストの作成
    const statusResult = createVerificationStatus(VerificationStatusEnum.PENDING);
    const updatedAtResult = createDateTime(now);
    
    if (!statusResult.ok || !updatedAtResult.ok) {
      return createErrorResponse('リクエストの作成中にエラーが発生しました', 500);
    }

    const requestProps = {
      id: 0, // 自動生成されるID
      userId: userIdObj,
      imageId: savedImage.id,
      status: statusResult.value,
      createdAt: dateTimeResult.value,
      updatedAt: updatedAtResult.value
    };

    const createRequestResult = createVerificationRequest(requestProps);
    if (!createRequestResult.ok) {
      return createErrorResponse('本人確認リクエストの作成に失敗しました', 400);
    }

    // 本人確認リクエストの保存
    const saveRequestResult = await requestRepository.save(createRequestResult.value);
    if (!saveRequestResult.ok) {
      return createErrorResponse('本人確認リクエストの保存中にエラーが発生しました', 500);
    }

    return NextResponse.json(
      { 
        message: '本人確認用画像が送信されました', 
        requestId: saveRequestResult.value.id,
        status: 'PENDING'
      },
      { status: 200 }
    );
  } catch (error) {
    return createErrorResponse('画像のアップロード中にエラーが発生しました', 500);
  }
}

/**
 * 本人確認用画像取得API
 * GET /api/verification/images
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({ message: 'GET method is available' }, { status: 200 });
} 