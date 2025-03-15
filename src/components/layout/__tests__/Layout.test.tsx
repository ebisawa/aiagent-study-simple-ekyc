import { render, screen } from '@testing-library/react';
import Layout from '../Layout';

// ヘッダーコンポーネントをモック
jest.mock('../Header', () => {
  return function MockHeader() {
    return <div data-testid="mock-header">ヘッダーコンポーネント</div>;
  };
});

describe('Layout', () => {
  it('ヘッダーが表示されること', () => {
    render(
      <Layout>
        <div>テストコンテンツ</div>
      </Layout>
    );
    
    expect(screen.getByTestId('mock-header')).toBeInTheDocument();
  });

  it('子コンポーネントが表示されること', () => {
    render(
      <Layout>
        <div data-testid="test-content">テストコンテンツ</div>
      </Layout>
    );
    
    expect(screen.getByTestId('test-content')).toBeInTheDocument();
    expect(screen.getByText('テストコンテンツ')).toBeInTheDocument();
  });

  it('フッターが表示されること', () => {
    render(
      <Layout>
        <div>テストコンテンツ</div>
      </Layout>
    );
    
    // 現在の年を取得
    const currentYear = new Date().getFullYear();
    
    // フッターテキストが現在の年を含んでいることを確認
    expect(screen.getByText(`© ${currentYear} 本人確認アプリ`)).toBeInTheDocument();
  });
}); 