import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ImagePreview from '../ImagePreview';

describe('ImagePreview', () => {
  const mockImageSrc = 'data:image/jpeg;base64,mockedImageData';
  const mockOnAccept = jest.fn();
  const mockOnRetake = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    render(
      <ImagePreview 
        imageSrc={mockImageSrc} 
        onAccept={mockOnAccept} 
        onRetake={mockOnRetake} 
      />
    );
    
    expect(screen.getByText('撮影した写真を確認')).toBeInTheDocument();
    expect(screen.getByAltText('撮影した写真')).toBeInTheDocument();
    expect(screen.getByAltText('撮影した写真')).toHaveAttribute('src', mockImageSrc);
    expect(screen.getByRole('button', { name: '写真を撮り直す' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'この写真を使用する' })).toBeInTheDocument();
    expect(screen.getByText('画像をクリックすると拡大表示できます')).toBeInTheDocument();
  });

  it('calls onRetake when retake button is clicked', () => {
    render(
      <ImagePreview 
        imageSrc={mockImageSrc} 
        onAccept={mockOnAccept} 
        onRetake={mockOnRetake} 
      />
    );
    
    fireEvent.click(screen.getByRole('button', { name: '写真を撮り直す' }));
    
    expect(mockOnRetake).toHaveBeenCalledTimes(1);
    expect(mockOnAccept).not.toHaveBeenCalled();
  });

  it('calls onAccept when accept button is clicked', () => {
    render(
      <ImagePreview 
        imageSrc={mockImageSrc} 
        onAccept={mockOnAccept} 
        onRetake={mockOnRetake} 
      />
    );
    
    fireEvent.click(screen.getByRole('button', { name: 'この写真を使用する' }));
    
    expect(mockOnAccept).toHaveBeenCalledTimes(1);
    expect(mockOnRetake).not.toHaveBeenCalled();
  });

  it('toggles zoom when image is clicked', () => {
    render(
      <ImagePreview 
        imageSrc={mockImageSrc} 
        onAccept={mockOnAccept} 
        onRetake={mockOnRetake} 
      />
    );
    
    // 初期状態では拡大表示されていない
    expect(screen.getByAltText('撮影した写真')).toHaveAttribute('aria-label', '画像を拡大表示');
    
    // 画像をクリックして拡大表示
    fireEvent.click(screen.getByAltText('撮影した写真'));
    
    // 拡大表示された状態
    expect(screen.getByAltText('撮影した写真')).toHaveAttribute('aria-label', '画像を縮小表示');
    expect(screen.getByRole('button', { name: '閉じる' })).toBeInTheDocument();
    
    // 閉じるボタンをクリック
    fireEvent.click(screen.getByRole('button', { name: '閉じる' }));
    
    // 元の状態に戻る
    expect(screen.getByAltText('撮影した写真')).toHaveAttribute('aria-label', '画像を拡大表示');
  });

  it('supports keyboard navigation for zoom', () => {
    render(
      <ImagePreview 
        imageSrc={mockImageSrc} 
        onAccept={mockOnAccept} 
        onRetake={mockOnRetake} 
      />
    );
    
    const image = screen.getByAltText('撮影した写真');
    
    // Enterキーで拡大表示
    fireEvent.keyDown(image, { key: 'Enter' });
    expect(image).toHaveAttribute('aria-label', '画像を縮小表示');
    
    // Escapeキーで元に戻す
    fireEvent.keyDown(image, { key: 'Escape' });
    expect(image).toHaveAttribute('aria-label', '画像を拡大表示');
    
    // スペースキーで拡大表示
    fireEvent.keyDown(image, { key: ' ' });
    expect(image).toHaveAttribute('aria-label', '画像を縮小表示');
  });
}); 