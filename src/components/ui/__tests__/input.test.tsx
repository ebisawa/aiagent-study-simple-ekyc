import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '../input';

describe('Input', () => {
  it('正しくレンダリングされること', () => {
    render(<Input placeholder="テスト入力" />);
    
    const input = screen.getByPlaceholderText('テスト入力');
    expect(input).toBeInTheDocument();
  });

  it('typeプロパティが正しく適用されること', () => {
    render(<Input type="password" placeholder="パスワード" />);
    
    const input = screen.getByPlaceholderText('パスワード');
    expect(input).toHaveAttribute('type', 'password');
  });

  it('disabledプロパティが正しく適用されること', () => {
    render(<Input disabled placeholder="無効な入力" />);
    
    const input = screen.getByPlaceholderText('無効な入力');
    expect(input).toBeDisabled();
  });

  it('ユーザー入力を受け付けること', async () => {
    const user = userEvent.setup();
    render(<Input placeholder="テキストを入力" />);
    
    const input = screen.getByPlaceholderText('テキストを入力');
    await user.type(input, 'テスト文字列');
    
    expect(input).toHaveValue('テスト文字列');
  });

  it('カスタムクラス名が適用されること', () => {
    render(<Input className="custom-class" placeholder="カスタムクラス" />);
    
    const input = screen.getByPlaceholderText('カスタムクラス');
    expect(input).toHaveClass('custom-class');
  });
}); 