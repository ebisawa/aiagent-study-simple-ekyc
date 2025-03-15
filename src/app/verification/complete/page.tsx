'use client';

import { useRouter } from 'next/navigation';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../../../components/ui/card';

export default function VerificationCompletePage() {
  const router = useRouter();

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6 text-center">本人確認完了</h1>
      
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>アップロード完了</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            本人確認用の写真が正常にアップロードされました。
          </p>
          <p className="text-sm text-neutral-500">
            審査には通常1〜2営業日かかります。結果はメールでお知らせします。
          </p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button onClick={() => router.push('/')}>
            ホームに戻る
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 