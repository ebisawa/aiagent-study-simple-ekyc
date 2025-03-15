import { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';

interface CameraComponentProps {
  onCapture: (imageSrc: string) => void;
}

export function CameraComponent({ onCapture }: CameraComponentProps) {
  const webcamRef = useRef<Webcam>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUserMedia = useCallback(() => {
    setIsCameraReady(true);
    setError(null);
  }, []);

  const handleUserMediaError = useCallback((error: string | DOMException) => {
    setIsCameraReady(false);
    setError('カメラへのアクセスができませんでした。カメラの使用許可を確認してください。');
  }, []);

  const captureImage = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        onCapture(imageSrc);
      } else {
        setError('画像の撮影に失敗しました。もう一度お試しください。');
      }
    }
  }, [onCapture]);

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>本人確認用の写真を撮影</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative aspect-[3/4] w-full overflow-hidden rounded-md bg-neutral-100">
          {!error ? (
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={{
                facingMode: 'user',
                aspectRatio: 3/4,
              }}
              onUserMedia={handleUserMedia}
              onUserMediaError={handleUserMediaError}
              className="h-full w-full object-cover"
              aria-label="カメラプレビュー"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center p-4 text-center">
              <p role="alert" className="text-red-500">{error}</p>
            </div>
          )}
        </div>
        {error && (
          <p className="mt-2 text-sm text-red-500" role="alert">
            {error}
          </p>
        )}
      </CardContent>
      <CardFooter className="flex justify-center">
        <Button 
          onClick={captureImage} 
          disabled={!isCameraReady}
          className="w-full"
          aria-label="写真を撮影する"
        >
          撮影する
        </Button>
      </CardFooter>
    </Card>
  );
}

export default CameraComponent; 