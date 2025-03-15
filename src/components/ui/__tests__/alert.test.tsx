import { render, screen } from '@testing-library/react';
import { Alert, AlertTitle, AlertDescription } from '../alert';

describe('Alert', () => {
  it('基本的なアラートが正しくレンダリングされること', () => {
    render(
      <Alert>
        <AlertTitle>テストアラート</AlertTitle>
        <AlertDescription>これはテストアラートです</AlertDescription>
      </Alert>
    );
    
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('テストアラート')).toBeInTheDocument();
    expect(screen.getByText('これはテストアラートです')).toBeInTheDocument();
  });

  it('destructiveバリアントが正しく適用されること', () => {
    render(
      <Alert variant="destructive">
        <AlertTitle>エラー</AlertTitle>
        <AlertDescription>エラーが発生しました</AlertDescription>
      </Alert>
    );
    
    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('border-red-500/50');
    expect(alert).toHaveClass('text-red-500');
  });

  it('successバリアントが正しく適用されること', () => {
    render(
      <Alert variant="success">
        <AlertTitle>成功</AlertTitle>
        <AlertDescription>操作が成功しました</AlertDescription>
      </Alert>
    );
    
    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('border-green-500/50');
    expect(alert).toHaveClass('text-green-500');
  });

  it('warningバリアントが正しく適用されること', () => {
    render(
      <Alert variant="warning">
        <AlertTitle>警告</AlertTitle>
        <AlertDescription>注意が必要です</AlertDescription>
      </Alert>
    );
    
    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('border-yellow-500/50');
    expect(alert).toHaveClass('text-yellow-500');
  });

  it('カスタムクラス名が適用されること', () => {
    render(
      <Alert className="custom-alert">
        <AlertTitle className="custom-title">タイトル</AlertTitle>
        <AlertDescription className="custom-description">説明</AlertDescription>
      </Alert>
    );
    
    expect(screen.getByRole('alert')).toHaveClass('custom-alert');
    expect(screen.getByText('タイトル')).toHaveClass('custom-title');
    expect(screen.getByText('説明')).toHaveClass('custom-description');
  });
}); 