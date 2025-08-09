'use client';

import { useState } from 'react';
import { useSignIn } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BookOpen, Mail, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function SignInPage() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Googleログイン
  const handleGoogleSignIn = async () => {
    if (!isLoaded) return;

    try {
      setIsLoading(true);
      setError('');
      
      await signIn.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: '/auth/callback',
        redirectUrlComplete: '/dashboard'
      });
    } catch (err: any) {
      setError(err.errors?.[0]?.message || 'Googleログインに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  // メール/パスワードログイン
  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    try {
      setIsLoading(true);
      setError('');

      const result = await signIn.create({
        identifier: email,
        password,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        router.push('/dashboard');
      } else {
        setError('ログインに失敗しました');
      }
    } catch (err: any) {
      const errorMessages: { [key: string]: string } = {
        'form_identifier_not_found': 'このメールアドレスは登録されていません',
        'form_password_incorrect': 'パスワードが正しくありません',
        'too_many_requests': 'しばらく時間をおいて再試行してください',
      };
      
      const errorCode = err.errors?.[0]?.code;
      setError(errorMessages[errorCode] || err.errors?.[0]?.message || 'ログインに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[color:var(--bg-secondary)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <BookOpen className="w-8 h-8 text-[color:var(--primary)] mr-2" />
            <h1 className="text-3xl font-bold text-[color:var(--primary)]">BookManager</h1>
          </div>
          <p className="text-[color:var(--text-secondary)]">あなたの読書ライフを整理しましょう</p>
        </div>

        <Card className="bg-[color:var(--bg-card)] border-0 shadow-lg">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl text-center text-[color:var(--text-primary)]">
              📖 本棚へようこそ
            </CardTitle>
            <CardDescription className="text-center text-[color:var(--text-secondary)]">
              ログインして読書記録を管理
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {error && (
              <Alert className="border-[color:var(--error)] bg-red-50">
                <AlertDescription className="text-[color:var(--error)]">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {/* Googleログインボタン */}
            <Button 
              variant="outline" 
              className="w-full h-12 border-2 hover:bg-[color:var(--accent-light)]/10 transition-colors"
              onClick={handleGoogleSignIn}
              disabled={isLoading || !isLoaded}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <Mail className="w-5 h-5 mr-2" />
              )}
              Googleでログイン
            </Button>

            <div className="relative">
              <Separator />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="bg-[color:var(--bg-card)] px-2 text-[color:var(--text-muted)] text-sm">または</span>
              </div>
            </div>

            {/* メール/パスワードフォーム */}
            <form onSubmit={handleEmailSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[color:var(--text-primary)]">
                  メールアドレス
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your-email@example.com"
                  className="h-11 border-2 focus:border-[color:var(--primary)]"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-[color:var(--text-primary)]">
                  パスワード
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 border-2 focus:border-[color:var(--primary)]"
                  required
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                />
                <Label htmlFor="remember" className="text-sm text-[color:var(--text-secondary)]">
                  ログイン状態を保持
                </Label>
              </div>

              <Button 
                type="submit"
                className="w-full h-12 bg-[color:var(--primary)] hover:bg-[color:var(--primary-hover)] text-white font-medium"
                disabled={isLoading || !isLoaded || !email || !password}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    認証中...
                  </>
                ) : (
                  'ログイン'
                )}
              </Button>
            </form>

            {/* リンク */}
            <div className="space-y-3 text-center">
              <Link 
                href="/auth/forgot-password" 
                className="text-sm text-[color:var(--primary)] hover:underline"
              >
                パスワードをお忘れですか？
              </Link>
              
              <div className="text-sm text-[color:var(--text-secondary)]">
                アカウントをお持ちでない方は{' '}
                <Link 
                  href="/auth/sign-up" 
                  className="text-[color:var(--primary)] hover:underline font-medium"
                >
                  新規登録はこちら
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}