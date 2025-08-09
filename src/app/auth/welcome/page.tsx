'use client';

import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Search, Smartphone, Sparkles } from 'lucide-react';
import { useEffect } from 'react';

export default function WelcomePage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/auth/sign-in');
    }
  }, [isLoaded, isSignedIn, router]);

  const handleStartJourney = () => {
    router.push('/dashboard');
  };

  if (!isLoaded || !isSignedIn) {
    return (
      <div className="min-h-screen bg-[color:var(--bg-secondary)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[color:var(--primary)]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[color:var(--bg-secondary)] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl mx-auto">
        {/* ウェルカムヘッダー */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-[color:var(--primary)] rounded-full mb-6">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-[color:var(--text-primary)] mb-2">
            ようこそ、{user?.firstName || 'BookManager'}さん！
          </h1>
          <p className="text-xl text-[color:var(--text-secondary)]">
            BookManagerへの登録が完了しました
          </p>
        </div>

        {/* 機能紹介カード */}
        <div className="grid gap-6 mb-8">
          {/* 重複購入防止機能 */}
          <Card className="bg-[color:var(--bg-card)] border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-[color:var(--text-primary)] mb-2">
                    📚 本の重複購入を防ぐ
                  </h3>
                  <p className="text-[color:var(--text-secondary)]">
                    「この本持ってたっけ？」の悩みを解決します。本を購入する前に、既に持っているかどうかを簡単に確認できます。
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 電子書籍管理機能 */}
          <Card className="bg-[color:var(--bg-card)] border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Smartphone className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-[color:var(--text-primary)] mb-2">
                    💻 電子書籍の購入先管理
                  </h3>
                  <p className="text-[color:var(--text-secondary)]">
                    「どこで買ったっけ？」がすぐに分かります。Kindle、Kobo、BookLive!など、複数のプラットフォームで購入した本を一括管理。
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Google Books API連携 */}
          <Card className="bg-[color:var(--bg-card)] border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Search className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-[color:var(--text-primary)] mb-2">
                    🔍 Google Books API連携
                  </h3>
                  <p className="text-[color:var(--text-secondary)]">
                    本のタイトルや著者名で検索するだけで、本の詳細情報や表紙画像を自動取得。手入力の手間を大幅に削減します。
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 使い方のヒント */}
        <Card className="bg-gradient-to-r from-[color:var(--primary)]/10 to-[color:var(--accent)]/10 border-0 shadow-lg mb-8">
          <CardContent className="p-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-[color:var(--text-primary)] mb-3">
                💡 使い方のヒント
              </h3>
              <div className="grid md:grid-cols-3 gap-4 text-sm text-[color:var(--text-secondary)]">
                <div>
                  <strong className="text-[color:var(--text-primary)]">1. 本を登録</strong>
                  <br />
                  既に持っている本をまず登録しましょう
                </div>
                <div>
                  <strong className="text-[color:var(--text-primary)]">2. 購入前に確認</strong>
                  <br />
                  新しい本を買う前に検索してみましょう
                </div>
                <div>
                  <strong className="text-[color:var(--text-primary)]">3. 電子書籍も整理</strong>
                  <br />
                  プラットフォームごとに分けて管理
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* スタートボタン */}
        <div className="text-center">
          <Button 
            onClick={handleStartJourney}
            size="lg"
            className="h-14 px-12 bg-[color:var(--primary)] hover:bg-[color:var(--primary-hover)] text-white text-lg font-semibold shadow-lg"
          >
            <BookOpen className="w-6 h-6 mr-3" />
            本棚を作成する
          </Button>
          
          <p className="text-sm text-[color:var(--text-muted)] mt-4">
            いつでもアカウント設定から変更できます
          </p>
        </div>
      </div>
    </div>
  );
}