import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { PrismaUserRepository } from '@/infrastructure/repositories/PrismaUserRepository';
import { PrismaVerificationImageRepository } from '@/infrastructure/repositories/PrismaVerificationImageRepository';

const prisma = new PrismaClient();
const userRepository = new PrismaUserRepository(prisma);
const imageRepository = new PrismaVerificationImageRepository(prisma);

/**
 * データベース接続確認API
 * GET /api/db-test
 */
export async function GET() {
  try {
    // データベース接続テスト
    const result = await prisma.user.findMany();
    
    // 接続成功時のレスポンス
    return NextResponse.json({
      status: 'success',
      message: 'データベース接続に成功しました',
      data: {
        userCount: result.length,
        users: result.map(user => ({
          id: user.id,
          email: user.email,
          role: user.role,
        })),
      }
    });
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'error',
        message: 'データベース接続に失敗しました',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 