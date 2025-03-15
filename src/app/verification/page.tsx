'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CameraComponent from '../../components/camera/CameraComponent';
import ImagePreview from '../../components/camera/ImagePreview';
import { Alert, AlertTitle, AlertDescription } from '../../components/ui/alert';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

export default function VerificationPage() {
  const router = useRouter();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [userError, setUserError] = useState<string | null>(null);

  // ユーザー情報を取得
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await fetch('/api/user/current');
        if (!response.ok) {
          throw new Error('ユーザー情報の取得に失敗しました');
        }
        const userData = await response.json();
        setUserId(userData.id);
      } catch (error) {
        setUserError('ユーザー情報の取得に失敗しました。再度お試しください。');
      }
    };

    fetchCurrentUser();
  }, []);

  const handleCapture = (imageSrc: string) => {
    setCapturedImage(imageSrc);
    setUploadError(null);
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setUploadError(null);
    setUploadSuccess(false);
  };

  const handleUpload = async () => {
    if (!capturedImage) return;
    if (!userId) {
      setUploadError('ユーザー情報が取得できていません。再度お試しください。');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      // JSONデータとして送信
      const response = await fetch('/api/verification/images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: capturedImage,
          userId: userId, // APIから取得したユーザーID
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '画像のアップロードに失敗しました');
      }

      const data = await response.json();
      
      // レスポンスの確認
      if (data.message && (data.requestId !== undefined) && data.status === 'PENDING') {
        setUploadSuccess(true);
        // 成功後の処理
        setTimeout(() => {
          router.push('/verification/complete');
        }, 2000);
      } else {
        throw new Error('予期しないレスポンス形式です');
      }
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : '画像のアップロードに失敗しました');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6 text-center">本人確認</h1>
      
      {userError && (
        <Alert variant="destructive" className="max-w-md mx-auto mb-4">
          <AlertTitle>エラー</AlertTitle>
          <AlertDescription>{userError}</AlertDescription>
        </Alert>
      )}
      
      {uploadSuccess ? (
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>アップロード完了</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="success" className="mb-4">
              <AlertTitle>成功</AlertTitle>
              <AlertDescription>
                画像が正常にアップロードされました。完了画面に移動します...
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      ) : capturedImage ? (
        <div className="space-y-4">
          <ImagePreview 
            imageSrc={capturedImage} 
            onAccept={handleUpload} 
            onRetake={handleRetake} 
          />
          
          {uploadError && (
            <Alert variant="destructive" className="max-w-md mx-auto">
              <AlertTitle>エラー</AlertTitle>
              <AlertDescription>{uploadError}</AlertDescription>
            </Alert>
          )}
          
          {isUploading && (
            <div className="text-center">
              <p className="text-neutral-600">アップロード中...</p>
            </div>
          )}
        </div>
      ) : (
        <CameraComponent onCapture={handleCapture} />
      )}
      
      <div className="mt-8 text-center">
        <Button 
          variant="outline" 
          onClick={() => router.push('/')}
          disabled={isUploading}
        >
          ホームに戻る
        </Button>
      </div>
    </div>
  );
} 