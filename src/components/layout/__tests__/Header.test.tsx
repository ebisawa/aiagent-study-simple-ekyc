import { render, screen } from '@testing-library/react';
import Header from '../Header';

// Next.jsのLinkコンポーネントをモック
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  };
});

describe('Header', () => {
  it('アプリ名が表示されること', () => {
    render(<Header />);
    expect(screen.getByText('本人確認アプリ')).toBeInTheDocument();
  });

  it('ナビゲーションリンクが表示されること', () => {
    render(<Header />);
    
    // 各リンクが存在することを確認
    expect(screen.getByRole('link', { name: 'ホーム' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '本人確認' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '管理画面' })).toBeInTheDocument();
  });

  it('各リンクが正しいURLを持っていること', () => {
    render(<Header />);
    
    // 各リンクのhref属性を確認
    expect(screen.getByRole('link', { name: 'ホーム' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: '本人確認' })).toHaveAttribute('href', '/verification');
    expect(screen.getByRole('link', { name: '管理画面' })).toHaveAttribute('href', '/admin');
  });
}); 