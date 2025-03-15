import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { PrismaVerificationImageRepository } from '@/infrastructure/repositories/PrismaVerificationImageRepository';
import { createImageId } from '@/domain/valueObjects/ImageId';

const prisma = new PrismaClient();
const imageRepository = new PrismaVerificationImageRepository(prisma);

/**
 * 特定の画像を取得するAPI
 * GET /api/images/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { error: '画像IDが必要です' },
        { status: 400 }
      );
    }

    // 画像IDの検証
    const imageIdResult = createImageId(id);
    if (!imageIdResult.ok) {
      return NextResponse.json(
        { error: imageIdResult.error.message },
        { status: 400 }
      );
    }

    // 画像の取得
    const imageResult = await imageRepository.findById(imageIdResult.value);
    if (!imageResult.ok) {
      return NextResponse.json(
        { error: '画像の取得中にエラーが発生しました' },
        { status: 500 }
      );
    }
    
    const image = imageResult.value;
    if (!image) {
      return NextResponse.json(
        { error: '指定された画像が見つかりません' },
        { status: 404 }
      );
    }

    // TODO: 現在の実装では画像データを直接取得できないため、一時的な対応として
    // 以下のコードはコメントアウトしています
    /*
    // 画像データをBase64エンコードして返す
    const base64Image = image.imageData.toString('base64');
    
    // Content-Typeを設定して画像データを直接返す場合
    if (request.headers.get('accept')?.includes('image/')) {
      return new NextResponse(image.imageData, {
        headers: {
          'Content-Type': image.mimeType || 'image/jpeg',
        },
      });
    }
    */

    // JSONとして画像情報を返す場合
    return NextResponse.json({
      id: image.id.toString(),
      userId: image.userId.toString(),
      imageUrl: image.imageUrl,
      createdAt: image.createdAt.toString(),
      // 一時的な対応として、ダミーデータを返す
      imageData: "base64-encoded-image-data-placeholder",
    });
  } catch (error) {
    return NextResponse.json(
      { error: '画像の取得中にエラーが発生しました' },
      { status: 500 }
    );
  }
} 