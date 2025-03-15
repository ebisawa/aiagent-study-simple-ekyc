import { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';

interface ImagePreviewProps {
  imageSrc: string;
  onAccept: () => void;
  onRetake: () => void;
}

export function ImagePreview({ imageSrc, onAccept, onRetake }: ImagePreviewProps) {
  const [isZoomed, setIsZoomed] = useState(false);

  const toggleZoom = () => {
    setIsZoomed(!isZoomed);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>撮影した写真を確認</CardTitle>
      </CardHeader>
      <CardContent>
        <div 
          className={`relative overflow-hidden rounded-md bg-neutral-100 ${
            isZoomed ? 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4' : 'aspect-[3/4] w-full'
          }`}
        >
          <img 
            src={imageSrc} 
            alt="撮影した写真" 
            className={`${isZoomed ? 'max-h-full max-w-full object-contain' : 'h-full w-full object-cover'}`}
            onClick={toggleZoom}
            role="button"
            tabIndex={0}
            aria-label={isZoomed ? "画像を縮小表示" : "画像を拡大表示"}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                toggleZoom();
              }
              if (e.key === 'Escape' && isZoomed) {
                setIsZoomed(false);
              }
            }}
          />
          {isZoomed && (
            <Button
              className="absolute top-4 right-4"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                setIsZoomed(false);
              }}
              aria-label="閉じる"
            >
              閉じる
            </Button>
          )}
        </div>
        <p className="mt-2 text-sm text-center text-neutral-500">
          画像をクリックすると拡大表示できます
        </p>
      </CardContent>
      <CardFooter className="flex justify-between gap-4">
        <Button 
          onClick={onRetake} 
          variant="outline"
          className="flex-1"
          aria-label="写真を撮り直す"
        >
          撮り直す
        </Button>
        <Button 
          onClick={onAccept}
          className="flex-1"
          aria-label="この写真を使用する"
        >
          この写真を使用する
        </Button>
      </CardFooter>
    </Card>
  );
}

export default ImagePreview; 