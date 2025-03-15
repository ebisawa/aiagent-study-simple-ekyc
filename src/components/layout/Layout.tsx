import { ReactNode } from 'react';
import Header from './Header';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto p-4">
        {children}
      </main>
      <footer className="bg-neutral-100 p-4 text-center text-neutral-600">
        <div className="container mx-auto">
          &copy; {new Date().getFullYear()} 本人確認アプリ
        </div>
      </footer>
    </div>
  );
}

export default Layout; 