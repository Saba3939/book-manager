'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { Loader2, BookOpen } from 'lucide-react';

export default function AuthCallbackPage() {
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded) {
      if (isSignedIn) {
        // 新規ユーザーの場合はウェルカム画面へ、既存ユーザーの場合はダッシュボードへ
        router.push('/auth/welcome');
      } else {
        // 認証に失敗した場合はログイン画面へ戻す
        router.push('/auth/sign-in');
      }
    }
  }, [isLoaded, isSignedIn, router]);

  return (
    <div className="min-h-screen bg-[color:var(--bg-secondary)] flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-2">
          <BookOpen className="w-8 h-8 text-[color:var(--primary)]" />
          <h1 className="text-2xl font-bold text-[color:var(--primary)]">BookManager</h1>
        </div>
        
        <div className="flex items-center justify-center space-x-2">
          <Loader2 className="w-6 h-6 animate-spin text-[color:var(--primary)]" />
          <p className="text-[color:var(--text-secondary)]">認証処理中...</p>
        </div>
        
        <p className="text-sm text-[color:var(--text-muted)]">
          しばらくお待ちください
        </p>
      </div>
    </div>
  );
}