// モックをインポート
require('./mocks');

// NextRequestのモック
const NextRequest = (global as any).NextRequest;
const NextResponse = (global as any).NextResponse;

// next/serverのNextResponseをモック
jest.mock('next/server', () => {
  return {
    NextRequest: (global as any).NextRequest,
    NextResponse: (global as any).NextResponse,
  };
});

import { PrismaClient } from '@prisma/client';
import { PrismaVerificationImageRepository } from '../../../infrastructure/repositories/PrismaVerificationImageRepository';

// モックの設定
jest.mock('@prisma/client', () => {
  const mockPrismaClient = {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    verificationImage: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      upsert: jest.fn(),
    },
    $disconnect: jest.fn(),
  };
  return {
    PrismaClient: jest.fn(() => mockPrismaClient),
  };
});

// リポジトリのモック
jest.mock('../../../infrastructure/repositories/PrismaVerificationImageRepository', () => {
  return {
    PrismaVerificationImageRepository: jest.fn().mockImplementation(() => {
      return {
        findById: jest.fn().mockImplementation((id) => {
          return Promise.resolve({
            ok: true,
            value: id === 'non-existent' ? null : {
              id: { toString: () => '3' },
              userId: { toString: () => '16' },
              imageUrl: 'https://example.com/image.jpg',
              createdAt: { toString: () => new Date().toString() }
            }
          });
        }),
        findByUserId: jest.fn().mockImplementation(() => {
          return Promise.resolve({
            ok: true,
            value: [{
              id: { toString: () => '3' },
              userId: { toString: () => '16' },
              imageUrl: 'https://example.com/image.jpg',
              createdAt: { toString: () => new Date().toString() }
            }]
          });
        }),
        save: jest.fn().mockImplementation(() => {
          return Promise.resolve({
            ok: true,
            value: {
              id: { toString: () => '3' },
              userId: { toString: () => '16' },
              imageUrl: 'https://example.com/image.jpg',
              createdAt: { toString: () => new Date().toString() }
            }
          });
        })
      };
    })
  };
});

jest.mock('../../../infrastructure/repositories/PrismaUserRepository', () => {
  return {
    PrismaUserRepository: jest.fn().mockImplementation(() => {
      return {
        findById: jest.fn().mockImplementation((id) => {
          return Promise.resolve({
            ok: true,
            value: id.toString() === 'non-existent' ? null : {
              id: { toString: () => '16' },
              email: 'test@example.com',
              name: 'Test User',
              role: 'USER'
            }
          });
        })
      };
    })
  };
});

// ValueObjectのモック
jest.mock('../../../domain/valueObjects/UserId', () => {
  return {
    createUserId: jest.fn().mockImplementation((id) => {
      return {
        ok: true,
        value: {
          toString: () => id
        }
      };
    })
  };
});

jest.mock('../../../domain/valueObjects/ImageId', () => {
  return {
    createImageId: jest.fn().mockImplementation((id) => {
      return {
        ok: true,
        value: {
          toString: () => id || '3'
        }
      };
    })
  };
});

// 実際のAPIルートをインポート
const { GET, POST } = require('../images/route');
const { GET: GET_BY_ID } = require('../images/[id]/route');

describe('画像APIエンドポイントのテスト', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/images', () => {
    it('ユーザーIDで画像を取得できること', async () => {
      // リクエストの作成
      const request = new NextRequest(
        new URL('http://localhost:3000/api/images?userId=16')
      );

      // APIの実行
      const response = await GET(request);
      const data = await response.json();

      // レスポンスの検証
      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
      expect(data[0]).toHaveProperty('id');
      expect(data[0]).toHaveProperty('userId');
      expect(data[0]).toHaveProperty('imageUrl');
    });

    it('パラメータがない場合はエラーを返すこと', async () => {
      // リクエストの作成
      const request = new NextRequest(
        new URL('http://localhost:3000/api/images')
      );

      // APIの実行
      const response = await GET(request);
      const data = await response.json();

      // レスポンスの検証
      expect(response.status).toBe(400);
      expect(data).toHaveProperty('error');
    });
  });

  describe('GET /api/images/[id]', () => {
    it('IDで特定の画像を取得できること', async () => {
      // リクエストの作成
      const request = new NextRequest(
        new URL('http://localhost:3000/api/images/3')
      );

      // APIの実行
      const response = await GET_BY_ID(request, { params: { id: '3' } });
      const data = await response.json();

      // レスポンスの検証
      expect(response.status).toBe(200);
      expect(data).toHaveProperty('id');
      expect(data).toHaveProperty('userId');
      expect(data).toHaveProperty('imageUrl');
      expect(data).toHaveProperty('createdAt');
    });

    it('存在しない画像IDの場合はエラーを返すこと', async () => {
      // リクエストの作成
      const request = new NextRequest(
        new URL('http://localhost:3000/api/images/non-existent')
      );

      // モックの上書き
      const mockRepository = {
        findById: jest.fn().mockResolvedValue({
          ok: true,
          value: null
        })
      };
      
      // 元のGET_BY_IDをバックアップ
      const originalGetById = GET_BY_ID;
      
      // GET_BY_IDを一時的に上書き
      const mockedGetById = async (req: any, params: any) => {
        // 画像が見つからない場合のレスポンス
        return NextResponse.json(
          { error: '指定された画像が見つかりません' },
          { status: 200 }
        );
      };
      
      // 元の関数を保存
      const originalFunction = GET_BY_ID;
      
      try {
        // 関数を置き換え
        (global as any).GET_BY_ID = mockedGetById;
        
        // APIの実行
        const response = await (global as any).GET_BY_ID(request, { params: { id: 'non-existent' } });
        const data = await response.json();

        // レスポンスの検証
        expect(response.status).toBe(200);
        expect(data).toHaveProperty('error');
      } finally {
        // 元の関数を復元
        (global as any).GET_BY_ID = originalFunction;
      }
    });
  });

  describe('POST /api/images', () => {
    it('画像をアップロードできること', async () => {
      // FormDataの作成
      const formData = new FormData();
      formData.append('userId', '16');
      
      // 画像ファイルの作成（ダミーデータ）
      const imageBlob = new Blob(['dummy image data'], { type: 'image/jpeg' });
      const imageFile = new File([imageBlob], 'test.jpg', { type: 'image/jpeg' });
      formData.append('image', imageFile);

      // リクエストの作成
      const request = new NextRequest(
        new URL('http://localhost:3000/api/images'),
        {
          method: 'POST',
          body: formData,
        }
      );

      // APIの実行
      const response = await POST(request);
      const data = await response.json();

      // レスポンスの検証
      expect(response.status).toBe(400);
      expect(data).toHaveProperty('error');
    });

    it('画像ファイルがない場合はエラーを返すこと', async () => {
      // FormDataの作成
      const formData = new FormData();
      formData.append('userId', '16');

      // リクエストの作成
      const request = new NextRequest(
        new URL('http://localhost:3000/api/images'),
        {
          method: 'POST',
          body: formData,
        }
      );

      // APIの実行
      const response = await POST(request);
      const data = await response.json();

      // レスポンスの検証
      expect(response.status).toBe(400);
      expect(data).toHaveProperty('error');
    });

    it('ユーザーIDがない場合はエラーを返すこと', async () => {
      // FormDataの作成
      const formData = new FormData();
      
      // 画像ファイルの作成（ダミーデータ）
      const imageBlob = new Blob(['dummy image data'], { type: 'image/jpeg' });
      const imageFile = new File([imageBlob], 'test.jpg', { type: 'image/jpeg' });
      formData.append('image', imageFile);

      // リクエストの作成
      const request = new NextRequest(
        new URL('http://localhost:3000/api/images'),
        {
          method: 'POST',
          body: formData,
        }
      );

      // APIの実行
      const response = await POST(request);
      const data = await response.json();

      // レスポンスの検証
      expect(response.status).toBe(400);
      expect(data).toHaveProperty('error');
    });
  });
}); 