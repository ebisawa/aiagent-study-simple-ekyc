import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import VerificationPage from '../page';

// next/navigationのモック
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// カメラコンポーネントのモック
jest.mock('../../../components/camera/CameraComponent', () => {
  return function MockCameraComponent({ onCapture }: { onCapture: (imageSrc: string) => void }) {
    return (
      <div data-testid="mock-camera">
        <button 
          data-testid="capture-button" 
          onClick={() => onCapture('data:image/jpeg;base64,mockImageData')}
        >
          撮影する
        </button>
      </div>
    );
  };
});

// プレビューコンポーネントのモック
jest.mock('../../../components/camera/ImagePreview', () => {
  return function MockImagePreview({ 
    imageSrc, 
    onAccept, 
    onRetake 
  }: { 
    imageSrc: string; 
    onAccept: () => void; 
    onRetake: () => void 
  }) {
    return (
      <div data-testid="mock-preview">
        <img src={imageSrc} alt="プレビュー" data-testid="preview-image" />
        <button data-testid="accept-button" onClick={onAccept}>この写真を使用する</button>
        <button data-testid="retake-button" onClick={onRetake}>撮り直す</button>
      </div>
    );
  };
});

describe('VerificationPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // fetchのモックをリセット
    global.fetch = jest.fn();
    
    // ユーザー情報取得のモックを設定（デフォルト）
    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (url === '/api/user/current') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ id: 123, name: 'テストユーザー' }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });
  });

  it('初期状態ではカメラコンポーネントが表示されること', async () => {
    render(<VerificationPage />);
    
    // ユーザー情報の取得を待つ
    await waitFor(() => {
      expect(screen.getByTestId('mock-camera')).toBeInTheDocument();
    });
    
    expect(screen.getByText('本人確認')).toBeInTheDocument();
    expect(screen.getByText('ホームに戻る')).toBeInTheDocument();
  });

  it('撮影ボタンをクリックするとプレビューコンポーネントが表示されること', async () => {
    render(<VerificationPage />);
    
    // ユーザー情報の取得を待つ
    await waitFor(() => {
      expect(screen.getByTestId('mock-camera')).toBeInTheDocument();
    });
    
    // 撮影ボタンをクリック
    fireEvent.click(screen.getByTestId('capture-button'));
    
    // プレビューコンポーネントが表示されること
    expect(screen.getByTestId('mock-preview')).toBeInTheDocument();
    expect(screen.getByTestId('preview-image')).toHaveAttribute('src', 'data:image/jpeg;base64,mockImageData');
  });

  it('撮り直すボタンをクリックするとカメラコンポーネントに戻ること', async () => {
    render(<VerificationPage />);
    
    // ユーザー情報の取得を待つ
    await waitFor(() => {
      expect(screen.getByTestId('mock-camera')).toBeInTheDocument();
    });
    
    // 撮影ボタンをクリック
    fireEvent.click(screen.getByTestId('capture-button'));
    
    // 撮り直すボタンをクリック
    fireEvent.click(screen.getByTestId('retake-button'));
    
    // カメラコンポーネントが表示されること
    expect(screen.getByTestId('mock-camera')).toBeInTheDocument();
  });

  it('アップロード成功時に成功メッセージが表示されること', async () => {
    // 画像アップロードのモックを設定
    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (url === '/api/user/current') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ id: 123, name: 'テストユーザー' }),
        });
      }
      if (url === '/api/verification/images') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ 
            message: '本人確認用画像が送信されました', 
            requestId: 456, 
            status: 'PENDING' 
          }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });
    
    render(<VerificationPage />);
    
    // ユーザー情報の取得を待つ
    await waitFor(() => {
      expect(screen.getByTestId('mock-camera')).toBeInTheDocument();
    });
    
    // 撮影ボタンをクリック
    fireEvent.click(screen.getByTestId('capture-button'));
    
    // アップロードボタンをクリック
    await act(async () => {
      fireEvent.click(screen.getByTestId('accept-button'));
    });
    
    // 成功メッセージが表示されるまで待機
    await waitFor(() => {
      expect(screen.getByText('アップロード完了')).toBeInTheDocument();
    });
    
    // 成功メッセージの内容を確認
    expect(screen.getByText('画像が正常にアップロードされました。完了画面に移動します...')).toBeInTheDocument();
    
    // fetchが正しく呼ばれたことを確認
    expect(global.fetch).toHaveBeenCalledWith('/api/verification/images', expect.any(Object));
  });

  it('アップロード失敗時にエラーメッセージが表示されること', async () => {
    // ユーザー情報取得は成功するが、画像アップロードは失敗するモックを設定
    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (url === '/api/user/current') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ id: 123, name: 'テストユーザー' }),
        });
      }
      if (url === '/api/verification/images') {
        return Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ error: '画像のアップロードに失敗しました' }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });
    
    render(<VerificationPage />);
    
    // ユーザー情報の取得を待つ
    await waitFor(() => {
      expect(screen.getByTestId('mock-camera')).toBeInTheDocument();
    });
    
    // 撮影ボタンをクリック
    fireEvent.click(screen.getByTestId('capture-button'));
    
    // アップロードボタンをクリック
    await act(async () => {
      fireEvent.click(screen.getByTestId('accept-button'));
    });
    
    // エラーメッセージが表示されるまで待機
    await waitFor(() => {
      expect(screen.getByText('エラー')).toBeInTheDocument();
    });
    
    // エラーメッセージの内容を確認
    expect(screen.getByText('画像のアップロードに失敗しました')).toBeInTheDocument();
  });
}); 