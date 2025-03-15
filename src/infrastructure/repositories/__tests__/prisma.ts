import { PrismaClient } from '@prisma/client';

// テスト用のPrismaClientを作成
// 環境変数からURLを取得するか、明示的にテスト用DBを指定
const prismaTest = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'file:./test.db'
    }
  }
});

/**
 * Reset database for testing
 * Deletes all data in the test database in the correct order to avoid foreign key constraints
 */
async function resetDatabase() {
  try {
    // 外部キー制約を無視してデータを削除する
    await prismaTest.$executeRawUnsafe('PRAGMA foreign_keys = OFF;');
    
    // すべてのテーブルのデータを削除
    await prismaTest.verificationRequest.deleteMany();
    console.log('Deleted verification requests');
    
    await prismaTest.verificationImage.deleteMany();
    console.log('Deleted verification images');
    
    await prismaTest.user.deleteMany();
    console.log('Deleted users');
    
    // 外部キー制約を再度有効化
    await prismaTest.$executeRawUnsafe('PRAGMA foreign_keys = ON;');
  } catch (error) {
    console.error('Error resetting database:', error);
    throw error;
  }
}

// グローバルセットアップ - Jest実行の最初に一度だけ実行
// この関数はJestのグローバルセットアップとして機能し、テスト全体の実行前に一度だけ呼び出される
beforeAll(async () => {
  try {
    // テスト用データベースの初期化（テスト実行時に1回だけ実行）
    await resetDatabase();
    console.log('Database initialized for tests');
  } catch (error) {
    console.error('Failed to initialize database:', error);
  }
});

// グローバルクリーンアップ - Jest実行の最後に一度だけ実行
afterAll(async () => {
  await prismaTest.$disconnect();
  console.log('Disconnected from test database');
});

export { prismaTest, resetDatabase };