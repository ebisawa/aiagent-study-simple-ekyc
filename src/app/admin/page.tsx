'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

// 本人確認リクエストの型定義
interface VerificationRequest {
  id: number;
  userId: string;
  imageId: string;
  imageUrl: string;
  status: string;
  reviewedBy?: string;
  reviewedAt?: string;
  comment?: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminPage() {
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [adminId, setAdminId] = useState<string | null>(null);

  // 管理者情報を取得
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await fetch('/api/user/current');
        if (!response.ok) {
          throw new Error('管理者情報の取得に失敗しました');
        }
        const userData = await response.json();
        setAdminId(userData.id);
      } catch (err) {
        setError('管理者情報の取得に失敗しました。再度お試しください。');
      }
    };

    fetchCurrentUser();
  }, []);

  // データ取得関数
  const fetchRequests = async () => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      // PENDINGステータスのリクエストを取得
      const response = await fetch(`/api/verification/requests?status=PENDING`);
      
      if (!response.ok) {
        throw new Error(`APIエラー: ${response.statusText}`);
      }
      
      const data = await response.json();
      // APIレスポンスが配列でない場合の処理を追加
      if (Array.isArray(data)) {
        setRequests(data);
      } else if (data && data.requests && Array.isArray(data.requests)) {
        // APIがrequestsプロパティに配列を格納している場合
        setRequests(data.requests);
      } else {
        // どちらでもない場合は空配列をセット
        setRequests([]);
        console.error('予期しないAPIレスポンス形式:', data);
      }
    } catch (err) {
      setError('本人確認リクエストの取得中にエラーが発生しました');
      setRequests([]); // エラー時は空配列をセット
    } finally {
      setIsLoading(false);
    }
  };

  // 初回レンダリング時にデータを取得
  useEffect(() => {
    fetchRequests();
  }, []);

  // リクエスト処理の共通関数
  const processRequest = async (id: number, action: 'approve' | 'reject', comment: string) => {
    setProcessingId(id);
    setError(null);
    setSuccessMessage(null);
    
    if (!adminId) {
      setError('管理者情報が取得できていません。再度お試しください。');
      setProcessingId(null);
      return false;
    }

    try {
      const response = await fetch(`/api/verification/requests/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          adminId: adminId, // 現在のログインユーザーID
          comment
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `APIエラー: ${response.statusText}`);
      }
      
      setSuccessMessage(`リクエストが${action === 'approve' ? '承認' : '拒否'}されました`);
      // リストを更新
      fetchRequests();
      
      return true;
    } catch (err: any) {
      setError(`${action === 'approve' ? '承認' : '拒否'}処理中にエラーが発生しました: ${err.message}`);
      return false;
    } finally {
      setProcessingId(null);
    }
  };

  // 承認処理
  const handleApprove = async (id: number) => {
    return processRequest(id, 'approve', '承認済み');
  };

  // 拒否処理
  const handleReject = async (id: number) => {
    return processRequest(id, 'reject', '不適切な画像のため拒否');
  };

  // リトライ処理
  const handleRetry = () => {
    fetchRequests();
  };

  // ステータスのテキスト表示
  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING':
        return '審査待ち';
      case 'APPROVED':
        return '承認済み';
      case 'REJECTED':
        return '拒否';
      default:
        return status;
    }
  };

  // ステータスに応じたクラス
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">本人確認リクエスト管理</h1>
          <Button onClick={handleRetry} disabled={isLoading}>
            {isLoading ? '読み込み中...' : '更新'}
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4" aria-label="エラー">
            <AlertTitle>エラー</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {successMessage && (
          <Alert className="mb-4 bg-green-50 text-green-800 border-green-200" aria-label="成功">
            <AlertTitle>成功</AlertTitle>
            <AlertDescription>{successMessage}</AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="text-center py-8">読み込み中...</div>
        ) : requests.length === 0 ? (
          <div className="text-center py-8">審査待ちの本人確認リクエストはありません</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {requests.map((request) => (
              <Card key={request.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">リクエスト #{request.id}</CardTitle>
                      <p className="text-sm text-neutral-500">
                        ユーザーID: {request.userId}
                      </p>
                      <p className="text-sm text-neutral-500">
                        提出日時: {new Date(request.createdAt).toLocaleString('ja-JP')}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusClass(request.status)}`}>
                      {getStatusText(request.status)}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <div className="aspect-[3/4] bg-neutral-100 rounded-md overflow-hidden">
                      {request.imageUrl ? (
                        <img 
                          src={request.imageUrl} 
                          alt="本人確認画像" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-neutral-400">
                          画像なし
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => handleApprove(request.id)}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      disabled={processingId === request.id}
                    >
                      {processingId === request.id ? '処理中...' : '承認'}
                    </Button>
                    <Button
                      onClick={() => handleReject(request.id)}
                      variant="outline"
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                      disabled={processingId === request.id}
                    >
                      {processingId === request.id ? '処理中...' : '拒否'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
} 