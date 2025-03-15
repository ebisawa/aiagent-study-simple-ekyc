import Link from 'next/link';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function Home() {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">本人確認アプリへようこそ</h1>
          <p className="text-xl text-neutral-600">
            簡単・安全に本人確認を行うためのアプリケーションです
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>本人確認を行う</CardTitle>
              <CardDescription>
                カメラを使用して本人確認用の写真を撮影します
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>
                本人確認プロセスでは、カメラを使用して写真を撮影し、
                システムに登録します。審査完了までしばらくお待ちください。
              </p>
            </CardContent>
            <CardFooter>
              <Link href="/verification">
                <Button className="w-full">
                  本人確認を開始する
                </Button>
              </Link>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>管理画面</CardTitle>
              <CardDescription>
                管理者向けの本人確認リクエスト管理画面
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>
                管理者は、ユーザーから送信された本人確認リクエストを
                確認し、承認または却下することができます。
              </p>
            </CardContent>
            <CardFooter>
              <Link href="/admin">
                <Button variant="outline" className="w-full">
                  管理画面へ
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
