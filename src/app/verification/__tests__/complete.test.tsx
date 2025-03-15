import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import VerificationCompletePage from '../complete/page';

// next/navigationのモック
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('VerificationCompletePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('完了メッセージが表示されること', () => {
    render(<VerificationCompletePage />);
    
    expect(screen.getByText('本人確認完了')).toBeInTheDocument();
    expect(screen.getByText('アップロード完了')).toBeInTheDocument();
    expect(screen.getByText('本人確認用の写真が正常にアップロードされました。')).toBeInTheDocument();
    expect(screen.getByText('審査には通常1〜2営業日かかります。結果はメールでお知らせします。')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'ホームに戻る' })).toBeInTheDocument();
  });

  it('ホームに戻るボタンをクリックするとホームページに遷移すること', () => {
    render(<VerificationCompletePage />);
    
    fireEvent.click(screen.getByRole('button', { name: 'ホームに戻る' }));
    
    expect(mockPush).toHaveBeenCalledWith('/');
  });
}); 