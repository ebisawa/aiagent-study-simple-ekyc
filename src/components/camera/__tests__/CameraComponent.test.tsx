import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CameraComponent from '../CameraComponent';

// react-webcamのモック
jest.mock('react-webcam', () => {
  return {
    __esModule: true,
    default: function MockWebcam(props) {
      return (
        <div data-testid="mock-webcam">
          <button 
            data-testid="mock-user-media-error-button"
            onClick={() => props.onUserMediaError && props.onUserMediaError('Camera access denied')}
          >
            Trigger Media Error
          </button>
        </div>
      );
    }
  };
});

describe('CameraComponent', () => {
  const mockOnCapture = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    render(<CameraComponent onCapture={mockOnCapture} />);
    
    expect(screen.getByText('本人確認用の写真を撮影')).toBeInTheDocument();
    expect(screen.getByTestId('mock-webcam')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '写真を撮影する' })).toBeInTheDocument();
  });

  it('disables capture button when camera is not ready', () => {
    // カメラが準備できていない状態をシミュレート
    // 注意: useStateのモックは順序に注意する必要があります
    const originalUseState = React.useState;
    jest.spyOn(React, 'useState').mockImplementation((initialState) => {
      // isCameraReadyのuseStateをモック
      if (initialState === false) {
        return [false, jest.fn()];
      }
      // その他のuseStateは元の実装を使用
      return originalUseState(initialState);
    });
    
    render(<CameraComponent onCapture={mockOnCapture} />);
    
    expect(screen.getByRole('button', { name: '写真を撮影する' })).toBeDisabled();
    
    // モックを元に戻す
    jest.restoreAllMocks();
  });

  it('enables capture button when camera is ready', () => {
    // カメラが準備できている状態をシミュレート
    // 注意: useStateのモックは順序に注意する必要があります
    const originalUseState = React.useState;
    jest.spyOn(React, 'useState').mockImplementation((initialState) => {
      // isCameraReadyのuseStateをモック
      if (initialState === false) {
        return [true, jest.fn()];
      }
      // その他のuseStateは元の実装を使用
      return originalUseState(initialState);
    });
    
    render(<CameraComponent onCapture={mockOnCapture} />);
    
    expect(screen.getByRole('button', { name: '写真を撮影する' })).toBeEnabled();
    
    // モックを元に戻す
    jest.restoreAllMocks();
  });

  it('shows error message when camera access fails', () => {
    render(<CameraComponent onCapture={mockOnCapture} />);
    
    fireEvent.click(screen.getByTestId('mock-user-media-error-button'));
    
    expect(screen.getAllByText('カメラへのアクセスができませんでした。カメラの使用許可を確認してください。')[0]).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '写真を撮影する' })).toBeDisabled();
  });

  it('captures image when button is clicked', () => {
    // カメラが準備できている状態をシミュレート
    const originalUseState = React.useState;
    jest.spyOn(React, 'useState').mockImplementation((initialState) => {
      // isCameraReadyのuseStateをモック
      if (initialState === false) {
        return [true, jest.fn()];
      }
      // その他のuseStateは元の実装を使用
      return originalUseState(initialState);
    });
    
    // webcamのgetScreenshotメソッドをモック
    const mockGetScreenshot = jest.fn().mockReturnValue('data:image/jpeg;base64,mockImageData');
    
    // useRefをモック
    jest.spyOn(React, 'useRef').mockReturnValue({
      current: {
        getScreenshot: mockGetScreenshot
      }
    });
    
    render(<CameraComponent onCapture={mockOnCapture} />);
    
    // 撮影ボタンをクリック
    const captureButton = screen.getByRole('button', { name: '写真を撮影する' });
    fireEvent.click(captureButton);
    
    expect(mockGetScreenshot).toHaveBeenCalled();
    expect(mockOnCapture).toHaveBeenCalledWith('data:image/jpeg;base64,mockImageData');
    
    // モックを元に戻す
    jest.restoreAllMocks();
  });

  it('shows error when screenshot fails', () => {
    // カメラが準備できている状態をシミュレート
    const originalUseState = React.useState;
    jest.spyOn(React, 'useState').mockImplementation((initialState) => {
      // isCameraReadyのuseStateをモック
      if (initialState === false) {
        return [true, jest.fn()];
      }
      // その他のuseStateは元の実装を使用
      return originalUseState(initialState);
    });
    
    // webcamのgetScreenshotメソッドをモック（nullを返す）
    const mockGetScreenshot = jest.fn().mockReturnValue(null);
    
    // useRefをモック
    jest.spyOn(React, 'useRef').mockReturnValue({
      current: {
        getScreenshot: mockGetScreenshot
      }
    });
    
    render(<CameraComponent onCapture={mockOnCapture} />);
    
    // 撮影ボタンをクリック
    const captureButton = screen.getByRole('button', { name: '写真を撮影する' });
    fireEvent.click(captureButton);
    
    expect(mockGetScreenshot).toHaveBeenCalled();
    expect(mockOnCapture).not.toHaveBeenCalled();
    expect(screen.getAllByText('画像の撮影に失敗しました。もう一度お試しください。')[0]).toBeInTheDocument();
    
    // モックを元に戻す
    jest.restoreAllMocks();
  });
}); 