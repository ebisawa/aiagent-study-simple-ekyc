import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { VerificationStatusEnum } from '../../../../../domain/valueObjects/VerificationStatus';

// モック
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

// リポジトリのモック
jest.mock('../../../../../infrastructure/repositories/PrismaVerificationRequestRepository', () => {
  return {
    PrismaVerificationRequestRepository: jest.fn().mockImplementation(() => ({
      findAll: jest.fn(),
      findById: jest.fn(),
      findByStatus: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    })),
  };
});

jest.mock('../../../../../infrastructure/repositories/PrismaVerificationImageRepository', () => {
  return {
    PrismaVerificationImageRepository: jest.fn().mockImplementation(() => ({
      findById: jest.fn(),
    })),
  };
});

jest.mock('../../../../../infrastructure/repositories/PrismaUserRepository', () => {
  return {
    PrismaUserRepository: jest.fn().mockImplementation(() => ({
      findById: jest.fn(),
    })),
  };
});

// 値オブジェクトのモック
jest.mock('../../../../../domain/valueObjects/UserId', () => {
  return {
    createUserId: jest.fn().mockImplementation((id) => {
      if (id === 'invalid-id') {
        return { ok: false, error: { message: '無効なユーザーID' } };
      }
      return { ok: true, value: { value: id, toString: () => id } };
    }),
  };
});

jest.mock('../../../../../domain/valueObjects/ImageId', () => {
  return {
    createImageId: jest.fn().mockImplementation((id) => {
      if (id === 'invalid-id') {
        return { ok: false, error: { message: '無効な画像ID' } };
      }
      return { ok: true, value: { value: id, toString: () => id } };
    }),
  };
});

jest.mock('../../../../../domain/valueObjects/VerificationStatus', () => {
  return {
    createVerificationStatus: jest.fn().mockImplementation((status) => {
      if (!['PENDING', 'APPROVED', 'REJECTED'].includes(status)) {
        return { ok: false, error: { message: '無効なステータス' } };
      }
      return { ok: true, value: { value: status, toString: () => status } };
    }),
    VerificationStatusEnum: {
      PENDING: 'PENDING',
      APPROVED: 'APPROVED',
      REJECTED: 'REJECTED',
    },
  };
});

jest.mock('../../../../../domain/valueObjects/DateTime', () => {
  return {
    createDateTime: jest.fn().mockImplementation((date) => {
      return { ok: true, value: { value: date, toString: () => date } };
    }),
  };
});

// エンティティのモック
jest.mock('../../../../../domain/entities/VerificationRequest', () => {
  return {
    createVerificationRequest: jest.fn().mockImplementation((params) => {
      return {
        ok: true,
        value: {
          id: params.id || 1,
          userId: params.userId,
          imageId: params.imageId,
          status: params.status,
          reviewedBy: params.reviewedBy,
          reviewedAt: params.reviewedAt,
          comment: params.comment,
          createdAt: params.createdAt,
          updatedAt: params.updatedAt,
          toJSON: () => ({
            id: params.id || 1,
            userId: params.userId?.toString() || 'user-1',
            imageId: params.imageId?.toString() || 'image-1',
            status: params.status?.toString() || 'PENDING',
            reviewedBy: params.reviewedBy?.toString(),
            reviewedAt: params.reviewedAt?.toString(),
            comment: params.comment,
            createdAt: params.createdAt?.toString() || new Date().toISOString(),
            updatedAt: params.updatedAt?.toString() || new Date().toISOString(),
          }),
        },
      };
    }),
  };
});

// 実際のAPIルートをインポート
import { GET, POST, PUT } from '../route';

describe('検証リクエストAPI', () => {
  let mockPrismaClient: any;
  let mockRequestRepository: any;
  let mockImageRepository: any;
  let mockUserRepository: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // モックのリセット
    mockPrismaClient = new PrismaClient();
    mockRequestRepository = require('../../../../../infrastructure/repositories/PrismaVerificationRequestRepository').PrismaVerificationRequestRepository.mock.instances[0];
    mockImageRepository = require('../../../../../infrastructure/repositories/PrismaVerificationImageRepository').PrismaVerificationImageRepository.mock.instances[0];
    mockUserRepository = require('../../../../../infrastructure/repositories/PrismaUserRepository').PrismaUserRepository.mock.instances[0];
  });

  describe('GET', () => {
    it('ステータスパラメータがある場合、そのステータスのリクエストを返すこと', async () => {
      // モックの設定
      const mockRequests = [
        {
          id: 1,
          userId: 'user-1',
          imageId: 'image-1',
          status: 'PENDING',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      
      mockRequestRepository.findByStatus.mockResolvedValue({
        ok: true,
        value: mockRequests.map(req => ({
          toJSON: () => req,
        })),
      });
      
      // リクエストの作成
      const request = new NextRequest('http://localhost:3000/api/verification/requests?status=PENDING');
      
      // APIの呼び出し
      const response = await GET(request);
      const data = await response.json();
      
      // 検証
      expect(response.status).toBe(200);
      expect(data).toEqual(mockRequests);
      expect(mockRequestRepository.findByStatus).toHaveBeenCalledWith(expect.objectContaining({
        value: 'PENDING',
      }));
    });
    
    it('ステータスパラメータがない場合、すべてのリクエストを返すこと', async () => {
      // モックの設定
      const mockRequests = [
        {
          id: 1,
          userId: 'user-1',
          imageId: 'image-1',
          status: 'PENDING',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 2,
          userId: 'user-2',
          imageId: 'image-2',
          status: 'APPROVED',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      
      mockRequestRepository.findAll.mockResolvedValue({
        ok: true,
        value: mockRequests.map(req => ({
          toJSON: () => req,
        })),
      });
      
      // リクエストの作成
      const request = new NextRequest('http://localhost:3000/api/verification/requests');
      
      // APIの呼び出し
      const response = await GET(request);
      const data = await response.json();
      
      // 検証
      expect(response.status).toBe(200);
      expect(data).toEqual(mockRequests);
      expect(mockRequestRepository.findAll).toHaveBeenCalled();
    });
    
    it('リポジトリでエラーが発生した場合、エラーレスポンスを返すこと', async () => {
      // モックの設定
      mockRequestRepository.findAll.mockResolvedValue({
        ok: false,
        error: { message: 'データベースエラー' },
      });
      
      // リクエストの作成
      const request = new NextRequest('http://localhost:3000/api/verification/requests');
      
      // APIの呼び出し
      const response = await GET(request);
      const data = await response.json();
      
      // 検証
      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'リクエストの取得中にエラーが発生しました' });
    });
  });
  
  describe('POST', () => {
    it('有効なデータで新しいリクエストを作成できること', async () => {
      // モックの設定
      mockUserRepository.findById.mockResolvedValue({
        ok: true,
        value: { id: 'user-1' },
      });
      
      mockImageRepository.findById.mockResolvedValue({
        ok: true,
        value: { id: 'image-1' },
      });
      
      mockRequestRepository.create.mockResolvedValue({
        ok: true,
        value: {
          id: 1,
          toJSON: () => ({
            id: 1,
            userId: 'user-1',
            imageId: 'image-1',
            status: 'PENDING',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }),
        },
      });
      
      // リクエストの作成
      const request = new NextRequest('http://localhost:3000/api/verification/requests', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'user-1',
          imageId: 'image-1',
        }),
      });
      
      // APIの呼び出し
      const response = await POST(request);
      const data = await response.json();
      
      // 検証
      expect(response.status).toBe(201);
      expect(data).toHaveProperty('id', 1);
      expect(data).toHaveProperty('userId', 'user-1');
      expect(data).toHaveProperty('imageId', 'image-1');
      expect(data).toHaveProperty('status', 'PENDING');
    });
    
    it('無効なユーザーIDの場合、エラーレスポンスを返すこと', async () => {
      // リクエストの作成
      const request = new NextRequest('http://localhost:3000/api/verification/requests', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'invalid-id',
          imageId: 'image-1',
        }),
      });
      
      // APIの呼び出し
      const response = await POST(request);
      const data = await response.json();
      
      // 検証
      expect(response.status).toBe(400);
      expect(data).toEqual({ error: '無効なユーザーID' });
    });
    
    it('存在しないユーザーIDの場合、エラーレスポンスを返すこと', async () => {
      // モックの設定
      mockUserRepository.findById.mockResolvedValue({
        ok: true,
        value: null,
      });
      
      // リクエストの作成
      const request = new NextRequest('http://localhost:3000/api/verification/requests', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'user-999',
          imageId: 'image-1',
        }),
      });
      
      // APIの呼び出し
      const response = await POST(request);
      const data = await response.json();
      
      // 検証
      expect(response.status).toBe(404);
      expect(data).toEqual({ error: '指定されたユーザーが見つかりません' });
    });
  });
  
  describe('PUT', () => {
    it('リクエストを承認できること', async () => {
      // モックの設定
      mockRequestRepository.findById.mockResolvedValue({
        ok: true,
        value: {
          id: 1,
          userId: { toString: () => 'user-1' },
          imageId: { toString: () => 'image-1' },
          status: { toString: () => 'PENDING' },
          approve: jest.fn().mockReturnValue({
            ok: true,
            value: {
              id: 1,
              toJSON: () => ({
                id: 1,
                userId: 'user-1',
                imageId: 'image-1',
                status: 'APPROVED',
                reviewedBy: 'admin-1',
                reviewedAt: expect.any(String),
                comment: '承認済み',
                createdAt: expect.any(String),
                updatedAt: expect.any(String),
              }),
            },
          }),
        },
      });
      
      mockRequestRepository.update.mockResolvedValue({
        ok: true,
        value: {
          id: 1,
          toJSON: () => ({
            id: 1,
            userId: 'user-1',
            imageId: 'image-1',
            status: 'APPROVED',
            reviewedBy: 'admin-1',
            reviewedAt: expect.any(String),
            comment: '承認済み',
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
          }),
        },
      });
      
      // リクエストの作成
      const url = new URL('http://localhost:3000/api/verification/requests/1');
      const params = { params: { id: '1' } };
      const request = new NextRequest(url, {
        method: 'PUT',
        body: JSON.stringify({
          action: 'approve',
          adminId: 'admin-1',
          comment: '承認済み',
        }),
      });
      
      // APIの呼び出し
      const response = await PUT(request, { params: { id: '1' } });
      const data = await response.json();
      
      // 検証
      expect(response.status).toBe(200);
      expect(data).toHaveProperty('status', 'APPROVED');
      expect(data).toHaveProperty('reviewedBy', 'admin-1');
      expect(data).toHaveProperty('comment', '承認済み');
    });
    
    it('リクエストを拒否できること', async () => {
      // モックの設定
      mockRequestRepository.findById.mockResolvedValue({
        ok: true,
        value: {
          id: 1,
          userId: { toString: () => 'user-1' },
          imageId: { toString: () => 'image-1' },
          status: { toString: () => 'PENDING' },
          reject: jest.fn().mockReturnValue({
            ok: true,
            value: {
              id: 1,
              toJSON: () => ({
                id: 1,
                userId: 'user-1',
                imageId: 'image-1',
                status: 'REJECTED',
                reviewedBy: 'admin-1',
                reviewedAt: expect.any(String),
                comment: '不適切な画像',
                createdAt: expect.any(String),
                updatedAt: expect.any(String),
              }),
            },
          }),
        },
      });
      
      mockRequestRepository.update.mockResolvedValue({
        ok: true,
        value: {
          id: 1,
          toJSON: () => ({
            id: 1,
            userId: 'user-1',
            imageId: 'image-1',
            status: 'REJECTED',
            reviewedBy: 'admin-1',
            reviewedAt: expect.any(String),
            comment: '不適切な画像',
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
          }),
        },
      });
      
      // リクエストの作成
      const url = new URL('http://localhost:3000/api/verification/requests/1');
      const params = { params: { id: '1' } };
      const request = new NextRequest(url, {
        method: 'PUT',
        body: JSON.stringify({
          action: 'reject',
          adminId: 'admin-1',
          comment: '不適切な画像',
        }),
      });
      
      // APIの呼び出し
      const response = await PUT(request, { params: { id: '1' } });
      const data = await response.json();
      
      // 検証
      expect(response.status).toBe(200);
      expect(data).toHaveProperty('status', 'REJECTED');
      expect(data).toHaveProperty('reviewedBy', 'admin-1');
      expect(data).toHaveProperty('comment', '不適切な画像');
    });
    
    it('無効なアクションの場合、エラーレスポンスを返すこと', async () => {
      // リクエストの作成
      const url = new URL('http://localhost:3000/api/verification/requests/1');
      const params = { params: { id: '1' } };
      const request = new NextRequest(url, {
        method: 'PUT',
        body: JSON.stringify({
          action: 'invalid-action',
          adminId: 'admin-1',
          comment: 'コメント',
        }),
      });
      
      // APIの呼び出し
      const response = await PUT(request, { params: { id: '1' } });
      const data = await response.json();
      
      // 検証
      expect(response.status).toBe(400);
      expect(data).toEqual({ error: '無効なアクション。approve または reject を指定してください。' });
    });
    
    it('存在しないリクエストIDの場合、エラーレスポンスを返すこと', async () => {
      // モックの設定
      mockRequestRepository.findById.mockResolvedValue({
        ok: true,
        value: null,
      });
      
      // リクエストの作成
      const url = new URL('http://localhost:3000/api/verification/requests/999');
      const params = { params: { id: '999' } };
      const request = new NextRequest(url, {
        method: 'PUT',
        body: JSON.stringify({
          action: 'approve',
          adminId: 'admin-1',
          comment: 'コメント',
        }),
      });
      
      // APIの呼び出し
      const response = await PUT(request, { params: { id: '999' } });
      const data = await response.json();
      
      // 検証
      expect(response.status).toBe(404);
      expect(data).toEqual({ error: '指定されたリクエストが見つかりません' });
    });
  });
}); 