import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 現在のユーザー情報を取得するAPI
 * GET /api/user/current
 */
export async function GET() {
  try {
    // テスト用に最初のユーザーを取得
    const user = await prisma.user.findFirst();
    
    if (!user) {
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 404 }
      );
    }
    
    // ユーザー情報を返す
    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'ユーザー情報の取得中にエラーが発生しました' },
      { status: 500 }
    );
  }
} 