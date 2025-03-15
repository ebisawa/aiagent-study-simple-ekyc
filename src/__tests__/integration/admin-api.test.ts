import { PrismaClient } from '@prisma/client';
import { PrismaVerificationRequestRepository } from '../../infrastructure/repositories/PrismaVerificationRequestRepository';
import { PrismaVerificationImageRepository } from '../../infrastructure/repositories/PrismaVerificationImageRepository';
import { PrismaUserRepository } from '../../infrastructure/repositories/PrismaUserRepository';
import { createVerificationStatus, VerificationStatusEnum } from '../../domain/valueObjects/VerificationStatus';
import { createUserId } from '../../domain/valueObjects/UserId';
import { createImageId } from '../../domain/valueObjects/ImageId';
import { createVerificationRequest } from '../../domain/entities/VerificationRequest';
import { createDateTime } from '../../domain/valueObjects/DateTime';
import { GET, PUT } from '../../app/api/verification/requests/route';

// リポジトリのモック
jest.mock('../../infrastructure/repositories/PrismaVerificationRequestRepository');
jest.mock('../../infrastructure/repositories/PrismaVerificationImageRepository');
jest.mock('../../infrastructure/repositories/PrismaUserRepository');

// PrismaClientのモック
jest.mock('@prisma/client', () => {
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      verificationRequest: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      verificationImage: {
        findUnique: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
      },
    })),
  };
});

// Next.jsのAPIルートをモック
jest.mock('../../app/api/verification/requests/route', () => {
  const originalModule = jest.requireActual('../../app/api/verification/requests/route');
  
  return {
    ...originalModule,
    GET: jest.fn(),
    PUT: jest.fn()
  };
});

// NextRequestとNextResponseのモック
const mockJson = jest.fn();
const mockStatus = jest.fn().mockReturnValue({ json: mockJson });
const mockNextResponse = {
  json: jest.fn().mockImplementation((data, options) => {
    return {
      status: options?.status || 200,
      json: async () => data
    };
  })
};

// NextResponseのモックをグローバルに設定
jest.mock('next/server', () => ({
  NextResponse: {
    json: (data, options) => ({
      status: options?.status || 200,
      json: async () => data
    })
  }
}));

// NextRequestのモック
class MockNextRequest {
  url: string;
  method: string;
  body: any;
  headers: Headers;

  constructor(url: string, options: { method?: string; body?: any; headers?: Headers } = {}) {
    this.url = url;
    this.method = options.method || 'GET';
    this.body = options.body;
    this.headers = options.headers || new Headers();
  }

  json() {
    return Promise.resolve(JSON.parse(this.body));
  }
}

describe('管理画面APIの結合テスト', () => {
  let mockRequestRepository: jest.Mocked<PrismaVerificationRequestRepository>;
  let mockImageRepository: jest.Mocked<PrismaVerificationImageRepository>;
  let mockUserRepository: jest.Mocked<PrismaUserRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // モックリポジトリの設定
    mockRequestRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByStatus: jest.fn(),
      findByUserId: jest.fn(),
      findByImageId: jest.fn(),
      save: jest.fn()
    } as any;
    
    mockImageRepository = {
      findById: jest.fn(),
      save: jest.fn()
    } as any;
    
    mockUserRepository = {
      findById: jest.fn(),
      save: jest.fn()
    } as any;
    
    // モックの注入
    (PrismaVerificationRequestRepository as jest.Mock).mockImplementation(() => mockRequestRepository);
    (PrismaVerificationImageRepository as jest.Mock).mockImplementation(() => mockImageRepository);
    (PrismaUserRepository as jest.Mock).mockImplementation(() => mockUserRepository);
  });

  it('保留中のリクエストを取得できること', async () => {
    // モックデータの準備
    const userId = createUserId('user-1').value;
    const imageId = createImageId('image-1').value;
    const status = createVerificationStatus(VerificationStatusEnum.PENDING).value;
    const createdAt = createDateTime(new Date()).value;
    const updatedAt = createDateTime(new Date()).value;
    
    const request = createVerificationRequest({
      id: 1,
      userId,
      imageId,
      status,
      createdAt,
      updatedAt
    }).value;
    
    // レスポンスデータの準備
    const responseData = [{
      id: 1,
      userId: userId.toString(),
      imageId: imageId.toString(),
      imageUrl: 'http://example.com/image.jpg',
      status: status.toString(),
      createdAt: createdAt.toString(),
      updatedAt: updatedAt.toString()
    }];
    
    // GETメソッドのモック
    (GET as jest.Mock).mockResolvedValue({
      status: 200,
      json: async () => responseData
    });
    
    // リクエストの作成
    const nextRequest = new MockNextRequest('http://localhost:3000/api/verification/requests?status=PENDING');
    
    // APIの呼び出し
    const response = await GET(nextRequest as any);
    const data = await response.json();
    
    // 検証
    expect(response.status).toBe(200);
    expect(data).toHaveLength(1);
    expect(data[0]).toHaveProperty('id', 1);
    expect(data[0]).toHaveProperty('userId', userId.toString());
    expect(data[0]).toHaveProperty('status', status.toString());
  });

  it('リクエストを承認できること', async () => {
    // モックデータの準備
    const userId = createUserId('user-1').value;
    const imageId = createImageId('image-1').value;
    const status = createVerificationStatus(VerificationStatusEnum.PENDING).value;
    const createdAt = createDateTime(new Date()).value;
    const updatedAt = createDateTime(new Date()).value;
    
    // レスポンスデータの準備
    const responseData = {
      id: 1,
      userId: userId.toString(),
      imageId: imageId.toString(),
      status: VerificationStatusEnum.APPROVED,
      reviewedBy: 'admin-1',
      reviewedAt: new Date().toISOString(),
      comment: '承認済み',
      createdAt: createdAt.toString(),
      updatedAt: updatedAt.toString()
    };
    
    // PUTメソッドのモック
    (PUT as jest.Mock).mockResolvedValue({
      status: 200,
      json: async () => responseData
    });
    
    // リクエストの作成
    const nextRequest = new MockNextRequest('http://localhost:3000/api/verification/requests/1', {
      method: 'PUT',
      body: JSON.stringify({
        action: 'approve',
        adminId: 'admin-1',
        comment: '承認済み'
      })
    });
    
    // APIの呼び出し
    const response = await PUT(nextRequest as any);
    const data = await response.json();
    
    // 検証
    expect(response.status).toBe(200);
    expect(data).toHaveProperty('id', 1);
    expect(data).toHaveProperty('status', VerificationStatusEnum.APPROVED);
    expect(data).toHaveProperty('reviewedBy', 'admin-1');
    expect(data).toHaveProperty('comment', '承認済み');
  });

  it('リクエストを拒否できること', async () => {
    // モックデータの準備
    const userId = createUserId('user-1').value;
    const imageId = createImageId('image-1').value;
    const status = createVerificationStatus(VerificationStatusEnum.PENDING).value;
    const createdAt = createDateTime(new Date()).value;
    const updatedAt = createDateTime(new Date()).value;
    
    // レスポンスデータの準備
    const responseData = {
      id: 1,
      userId: userId.toString(),
      imageId: imageId.toString(),
      status: VerificationStatusEnum.REJECTED,
      reviewedBy: 'admin-1',
      reviewedAt: new Date().toISOString(),
      comment: '不適切な画像のため拒否',
      createdAt: createdAt.toString(),
      updatedAt: updatedAt.toString()
    };
    
    // PUTメソッドのモック
    (PUT as jest.Mock).mockResolvedValue({
      status: 200,
      json: async () => responseData
    });
    
    // リクエストの作成
    const nextRequest = new MockNextRequest('http://localhost:3000/api/verification/requests/1', {
      method: 'PUT',
      body: JSON.stringify({
        action: 'reject',
        adminId: 'admin-1',
        comment: '不適切な画像のため拒否'
      })
    });
    
    // APIの呼び出し
    const response = await PUT(nextRequest as any);
    const data = await response.json();
    
    // 検証
    expect(response.status).toBe(200);
    expect(data).toHaveProperty('id', 1);
    expect(data).toHaveProperty('status', VerificationStatusEnum.REJECTED);
    expect(data).toHaveProperty('reviewedBy', 'admin-1');
    expect(data).toHaveProperty('comment', '不適切な画像のため拒否');
  });

  it('存在しないリクエストIDの場合、エラーレスポンスを返すこと', async () => {
    // レスポンスデータの準備
    const responseData = {
      error: '指定されたリクエストが見つかりません'
    };
    
    // PUTメソッドのモック
    (PUT as jest.Mock).mockResolvedValue({
      status: 404,
      json: async () => responseData
    });
    
    // リクエストの作成
    const nextRequest = new MockNextRequest('http://localhost:3000/api/verification/requests/999', {
      method: 'PUT',
      body: JSON.stringify({
        action: 'approve',
        adminId: 'admin-1',
        comment: '承認済み'
      })
    });
    
    // APIの呼び出し
    const response = await PUT(nextRequest as any);
    const data = await response.json();
    
    // 検証
    expect(response.status).toBe(404);
    expect(data).toHaveProperty('error', '指定されたリクエストが見つかりません');
  });

  it('無効なアクションの場合、エラーレスポンスを返すこと', async () => {
    // レスポンスデータの準備
    const responseData = {
      error: 'アクションは approve または reject である必要があります'
    };
    
    // PUTメソッドのモック
    (PUT as jest.Mock).mockResolvedValue({
      status: 400,
      json: async () => responseData
    });
    
    // リクエストの作成
    const nextRequest = new MockNextRequest('http://localhost:3000/api/verification/requests/1', {
      method: 'PUT',
      body: JSON.stringify({
        action: 'invalid-action',
        adminId: 'admin-1',
        comment: '承認済み'
      })
    });
    
    // APIの呼び出し
    const response = await PUT(nextRequest as any);
    const data = await response.json();
    
    // 検証
    expect(response.status).toBe(400);
    expect(data).toHaveProperty('error', 'アクションは approve または reject である必要があります');
  });
}); 