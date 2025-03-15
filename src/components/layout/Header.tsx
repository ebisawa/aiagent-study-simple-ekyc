import Link from 'next/link';

export function Header() {
  return (
    <header className="bg-neutral-900 text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-xl font-bold">
          本人確認アプリ
        </Link>
        <nav>
          <ul className="flex space-x-4">
            <li>
              <Link href="/" className="hover:text-neutral-300">
                ホーム
              </Link>
            </li>
            <li>
              <Link href="/verification" className="hover:text-neutral-300">
                本人確認
              </Link>
            </li>
            <li>
              <Link href="/admin" className="hover:text-neutral-300">
                管理画面
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}

export default Header; 