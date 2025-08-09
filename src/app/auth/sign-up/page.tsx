'use client';

import { useState } from 'react';
import { useSignUp } from '@clerk/nextjs';
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

export default function SignUpPage() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState('');

  // Googleサインアップ
  const handleGoogleSignUp = async () => {
    if (!isLoaded) return;

    try {
      setIsLoading(true);
      setError('');
      
      await signUp.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: '/auth/callback',
        redirectUrlComplete: '/auth/welcome'
      });
    } catch (err: any) {
      setError(err.errors?.[0]?.message || 'Googleサインアップに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  // メール/パスワードサインアップ
  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    // バリデーション
    if (password !== confirmPassword) {
      setError('パスワードが一致しません');
      return;
    }

    if (password.length < 8) {
      setError('パスワードは8文字以上で入力してください');
      return;
    }

    if (!agreeToTerms) {
      setError('利用規約に同意してください');
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      await signUp.create({
        emailAddress: email,
        password,
      });

      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setPendingVerification(true);
    } catch (err: any) {
      const errorMessages: { [key: string]: string } = {
        'form_identifier_exists': 'このメールアドレスは既に登録されています',
        'form_password_pwned': 'このパスワードは安全ではありません。別のパスワードを使用してください',
        'form_password_too_common': 'このパスワードは一般的すぎます。より複雑なパスワードを使用してください',
      };
      
      const errorCode = err.errors?.[0]?.code;
      setError(errorMessages[errorCode] || err.errors?.[0]?.message || 'アカウント作成に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  // 確認コードの検証
  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    try {
      setIsLoading(true);
      setError('');

      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (completeSignUp.status === 'complete') {
        await setActive({ session: completeSignUp.createdSessionId });
        router.push('/auth/welcome');
      } else {
        setError('確認に失敗しました');
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.message || '確認コードが正しくありません');
    } finally {
      setIsLoading(false);
    }
  };

  // 確認コード待ちの画面
  if (pendingVerification) {
    return (
      <div className="min-h-screen bg-[color:var(--bg-secondary)] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <BookOpen className="w-8 h-8 text-[color:var(--primary)] mr-2" />
              <h1 className="text-3xl font-bold text-[color:var(--primary)]">BookManager</h1>
            </div>
            <p className="text-[color:var(--text-secondary)]">メールアドレスの確認</p>
          </div>

          <Card className="bg-[color:var(--bg-card)] border-0 shadow-lg">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-2xl text-center text-[color:var(--text-primary)]">
                📧 確認コードを入力
              </CardTitle>
              <CardDescription className="text-center text-[color:var(--text-secondary)]">
                {email} に送信された6桁のコードを入力してください
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

              <form onSubmit={handleVerifyEmail} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="code" className="text-[color:var(--text-primary)]">
                    確認コード
                  </Label>
                  <Input
                    id="code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="123456"
                    className="h-11 border-2 focus:border-[color:var(--primary)] text-center text-lg tracking-widest"
                    maxLength={6}
                    required
                  />
                </div>

                <Button 
                  type="submit"
                  className="w-full h-12 bg-[color:var(--primary)] hover:bg-[color:var(--primary-hover)] text-white font-medium"
                  disabled={isLoading || !isLoaded || code.length !== 6}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      確認中...
                    </>
                  ) : (
                    'メールアドレスを確認'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[color:var(--bg-secondary)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <BookOpen className="w-8 h-8 text-[color:var(--primary)] mr-2" />
            <h1 className="text-3xl font-bold text-[color:var(--primary)]">BookManager</h1>
          </div>
          <p className="text-[color:var(--text-secondary)]">読書記録を始めましょう</p>
        </div>

        <Card className="bg-[color:var(--bg-card)] border-0 shadow-lg">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl text-center text-[color:var(--text-primary)]">
              📚 アカウント作成
            </CardTitle>
            <CardDescription className="text-center text-[color:var(--text-secondary)]">
              あなた専用の本棚を作成
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

            {/* Googleサインアップボタン */}
            <Button 
              variant="outline" 
              className="w-full h-12 border-2 hover:bg-[color:var(--accent-light)]/10 transition-colors"
              onClick={handleGoogleSignUp}
              disabled={isLoading || !isLoaded}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <Mail className="w-5 h-5 mr-2" />
              )}
              Googleで登録
            </Button>

            <div className="relative">
              <Separator />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="bg-[color:var(--bg-card)] px-2 text-[color:var(--text-muted)] text-sm">または</span>
              </div>
            </div>

            {/* メール/パスワードフォーム */}
            <form onSubmit={handleEmailSignUp} className="space-y-4">
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
                  パスワード（8文字以上）
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 border-2 focus:border-[color:var(--primary)]"
                  minLength={8}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-[color:var(--text-primary)]">
                  パスワード確認
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-11 border-2 focus:border-[color:var(--primary)]"
                  required
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="terms"
                  checked={agreeToTerms}
                  onCheckedChange={(checked) => setAgreeToTerms(checked as boolean)}
                />
                <Label htmlFor="terms" className="text-sm text-[color:var(--text-secondary)]">
                  <Link href="/terms" className="text-[color:var(--primary)] hover:underline">
                    利用規約
                  </Link>
                  に同意します
                </Label>
              </div>

              <Button 
                type="submit"
                className="w-full h-12 bg-[color:var(--primary)] hover:bg-[color:var(--primary-hover)] text-white font-medium"
                disabled={isLoading || !isLoaded || !email || !password || !confirmPassword || !agreeToTerms}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    作成中...
                  </>
                ) : (
                  'アカウント作成'
                )}
              </Button>
            </form>

            {/* リンク */}
            <div className="text-center">
              <div className="text-sm text-[color:var(--text-secondary)]">
                すでにアカウントをお持ちの方は{' '}
                <Link 
                  href="/auth/sign-in" 
                  className="text-[color:var(--primary)] hover:underline font-medium"
                >
                  ログイン
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}