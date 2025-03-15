import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import AdminPage from '../../app/admin/page';
import { PrismaVerificationRequestRepository } from '../../infrastructure/repositories/PrismaVerificationRequestRepository';
import { createVerificationStatus, VerificationStatusEnum } from '../../domain/valueObjects/VerificationStatus';
import { createUserId } from '../../domain/valueObjects/UserId';
import { createImageId } from '../../domain/valueObjects/ImageId';
import { createVerificationRequest } from '../../domain/entities/VerificationRequest';
import { createDateTime } from '../../domain/valueObjects/DateTime';

// リポジトリのモック
jest.mock('../../infrastructure/repositories/PrismaVerificationRequestRepository');
jest.mock('@prisma/client', () => {
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      verificationRequest: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    })),
  };
});

// fetchのモック
global.fetch = jest.fn() as jest.Mock;

describe('管理画面の結合テスト', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // 管理者情報のモックを追加
    (global.fetch as jest.Mock).mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ id: '1', name: 'Admin User' }),
      })
    );
  });

  it('保留中のリクエストを取得して表示すること', async () => {
    // モックデータの準備
    const mockRequests = [
      {
        id: 1,
        userId: 'user-1',
        imageId: 'image-1',
        imageUrl: 'https://example.com/image1.jpg',
        status: 'PENDING',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      },
      {
        id: 2,
        userId: 'user-2',
        imageId: 'image-2',
        imageUrl: 'https://example.com/image2.jpg',
        status: 'PENDING',
        createdAt: '2023-01-02T00:00:00Z',
        updatedAt: '2023-01-02T00:00:00Z',
      },
    ];

    // fetchのモック設定
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ requests: mockRequests }),
    });

    // コンポーネントのレンダリング
    render(<AdminPage />);

    // 初期状態では読み込み中が表示されること
    expect(screen.getByText(/読み込み中/i, { selector: 'div.text-center' })).toBeInTheDocument();

    // データ取得後にリクエストが表示されること
    await waitFor(() => {
      expect(screen.queryByText(/読み込み中/i, { selector: 'div.text-center' })).not.toBeInTheDocument();
    });

    // リクエストカードが表示されていることを確認
    expect(screen.getByText('リクエスト #1')).toBeInTheDocument();
    expect(screen.getByText('リクエスト #2')).toBeInTheDocument();
    expect(screen.getByText('ユーザーID: user-1')).toBeInTheDocument();
    expect(screen.getByText('ユーザーID: user-2')).toBeInTheDocument();

    // APIが正しく呼ばれたことを確認
    expect(global.fetch).toHaveBeenCalledWith('/api/verification/requests?status=PENDING');
  });

  it('リクエストを承認できること', async () => {
    // モックデータの準備
    const mockRequests = [
      {
        id: 1,
        userId: 'user-1',
        imageId: 'image-1',
        imageUrl: 'https://example.com/image1.jpg',
        status: 'PENDING',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      },
    ];

    // GETリクエストのモック
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ requests: mockRequests }),
    });

    // PUTリクエストのモック
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 1,
        userId: 'user-1',
        imageId: 'image-1',
        status: 'APPROVED',
        reviewedBy: '1',
        reviewedAt: new Date().toISOString(),
        comment: '承認済み',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: new Date().toISOString(),
      }),
    });

    // 2回目のGETリクエストのモック（更新後）
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ requests: [] }),
    });

    // コンポーネントのレンダリング
    render(<AdminPage />);

    // データ取得後にリクエストが表示されること
    await waitFor(() => {
      expect(screen.queryByText(/読み込み中/i, { selector: 'div.text-center' })).not.toBeInTheDocument();
    });

    // 承認ボタンをクリック
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '承認' }));
    });

    // APIが正しく呼ばれたことを確認
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/verification/requests/1',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({
          action: 'approve',
          adminId: '1',
          comment: '承認済み'
        }),
      })
    );

    // 更新後のデータ取得APIが呼ばれたことを確認
    expect(global.fetch).toHaveBeenCalledTimes(4);
    expect(global.fetch).toHaveBeenLastCalledWith('/api/verification/requests?status=PENDING');
  });

  it('リクエストを拒否できること', async () => {
    // モックデータの準備
    const mockRequests = [
      {
        id: 1,
        userId: 'user-1',
        imageId: 'image-1',
        imageUrl: 'https://example.com/image1.jpg',
        status: 'PENDING',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      },
    ];

    // GETリクエストのモック
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ requests: mockRequests }),
    });

    // PUTリクエストのモック
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 1,
        userId: 'user-1',
        imageId: 'image-1',
        status: 'REJECTED',
        reviewedBy: '1',
        reviewedAt: new Date().toISOString(),
        comment: '不適切な画像のため拒否',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: new Date().toISOString(),
      }),
    });

    // 2回目のGETリクエストのモック（更新後）
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ requests: [] }),
    });

    // コンポーネントのレンダリング
    render(<AdminPage />);

    // データ取得後にリクエストが表示されること
    await waitFor(() => {
      expect(screen.queryByText(/読み込み中/i, { selector: 'div.text-center' })).not.toBeInTheDocument();
    });

    // 拒否ボタンをクリック
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '拒否' }));
    });

    // APIが正しく呼ばれたことを確認
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/verification/requests/1',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({
          action: 'reject',
          adminId: '1',
          comment: '不適切な画像のため拒否'
        }),
      })
    );

    // 更新後のデータ取得APIが呼ばれたことを確認
    expect(global.fetch).toHaveBeenCalledTimes(4);
    expect(global.fetch).toHaveBeenLastCalledWith('/api/verification/requests?status=PENDING');
  });

  it('APIエラー時にエラーメッセージを表示すること', async () => {
    // GETリクエストのモック（エラーを返す）
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      statusText: 'Internal Server Error',
    });

    // コンポーネントのレンダリング
    render(<AdminPage />);

    // エラーメッセージが表示されるまで待機
    await waitFor(() => {
      const errorElements = screen.getAllByText(/エラー/);
      expect(errorElements.length).toBeGreaterThan(0);
    });
    
    // エラーメッセージの内容を確認
    expect(screen.getByText(/本人確認リクエストの取得中にエラーが発生しました/)).toBeInTheDocument();
  });

  it('更新ボタンをクリックするとデータが再取得されること', async () => {
    // 最初のGETリクエストのモック
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ requests: [] }),
    });

    // コンポーネントのレンダリング
    render(<AdminPage />);

    // データ取得後に更新ボタンが有効になること
    await waitFor(() => {
      expect(screen.queryByText(/読み込み中/i, { selector: 'div.text-center' })).not.toBeInTheDocument();
    });

    // 2回目のGETリクエストのモック
    (global.fetch as jest.Mock).mockImplementationOnce(() => 
      new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: async () => ({ requests: [] }),
      }), 100))
    );

    // 更新ボタンをクリック
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '更新' }));
    });

    // APIが3回呼ばれたことを確認（管理者情報の取得 + 初期データ取得 + 更新時のデータ取得）
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });
  });

  it('実際のリポジトリとの結合テスト', async () => {
    // モックリポジトリの設定
    const mockRepository = new PrismaVerificationRequestRepository({} as any);
    
    // findByStatusメソッドのモック
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
    
    jest.spyOn(mockRepository, 'findByStatus').mockResolvedValue({
      ok: true,
      value: [request]
    });
    
    // fetchのモック
    (global.fetch as jest.Mock).mockImplementation(async (url) => {
      if (url === '/api/verification/requests?status=PENDING') {
        return {
          ok: true,
          json: async () => [{
            id: 1,
            userId: userId.toString(),
            imageId: imageId.toString(),
            imageUrl: 'https://example.com/image1.jpg',
            status: status.toString(),
            createdAt: createdAt.toString(),
            updatedAt: updatedAt.toString()
          }]
        };
      }
      return {
        ok: false,
        statusText: 'Not Found'
      };
    });
    
    // コンポーネントのレンダリング
    render(<AdminPage />);
    
    // データ取得後にリクエストが表示されること
    await waitFor(() => {
      expect(screen.queryByText(/読み込み中/i, { selector: 'div.text-center' })).not.toBeInTheDocument();
    });
    
    // リクエストが表示されていることを確認
    expect(screen.getByText('リクエスト #1')).toBeInTheDocument();
    expect(screen.getByText(`ユーザーID: ${userId.toString()}`)).toBeInTheDocument();
  });
}); 