'use client';

import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Search, Smartphone, Users, Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.push('/dashboard');
    }
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[color:var(--bg-secondary)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[color:var(--primary)]"></div>
      </div>
    );
  }

  if (isSignedIn) {
    return null; // リダイレクト中
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[color:var(--bg-primary)] to-[color:var(--bg-secondary)]">
      {/* ヘッダー */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-50">
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <BookOpen className="w-8 h-8 text-[color:var(--primary)]" />
              <h1 className="text-2xl font-bold text-[color:var(--primary)]">BookManager</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link href="/auth/sign-in">
                <Button variant="ghost" className="text-[color:var(--text-secondary)]">
                  ログイン
                </Button>
              </Link>
              <Link href="/auth/sign-up">
                <Button className="bg-[color:var(--primary)] hover:bg-[color:var(--primary-hover)]">
                  無料で始める
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* ヒーローセクション */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-[color:var(--primary)] rounded-full mb-8">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          
          <h2 className="text-5xl font-bold text-[color:var(--text-primary)] mb-6">
            「この本持ってたっけ？」<br />
            <span className="text-[color:var(--primary)]">もう迷わない</span>
          </h2>
          
          <p className="text-xl text-[color:var(--text-secondary)] mb-8 max-w-2xl mx-auto">
            本の重複購入を防ぎ、電子書籍の購入先を一括管理。<br />
            あなたの読書ライフをもっとスマートに。
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/auth/sign-up">
              <Button 
                size="lg" 
                className="h-14 px-8 bg-[color:var(--primary)] hover:bg-[color:var(--primary-hover)] text-lg font-semibold shadow-lg"
              >
                <BookOpen className="w-6 h-6 mr-3" />
                無料で始める
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            
            <Link href="/auth/sign-in">
              <Button 
                variant="outline" 
                size="lg" 
                className="h-14 px-8 text-lg border-2 border-[color:var(--primary)] text-[color:var(--primary)] hover:bg-[color:var(--primary)]/10"
              >
                ログインはこちら
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 機能紹介セクション */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-[color:var(--text-primary)] mb-4">
              解決する2つの大きな悩み
            </h3>
            <p className="text-[color:var(--text-secondary)] text-lg">
              本好きなら誰もが経験する、あの困った瞬間を解決します
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-16">
            {/* 重複購入防止 */}
            <Card className="shadow-xl border-0">
              <CardContent className="p-8">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <Search className="w-8 h-8 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="text-2xl font-bold text-[color:var(--text-primary)]">重複購入防止</h4>
                    <p className="text-[color:var(--text-secondary)]">「この本持ってたっけ？」</p>
                  </div>
                </div>
                <p className="text-[color:var(--text-secondary)] text-lg leading-relaxed">
                  書店で気になる本を見つけた時、スマホで簡単に検索。既に持っているかどうかを瞬時に確認できます。
                  無駄な出費を防いで、新しい本との出会いにお金を使いましょう。
                </p>
              </CardContent>
            </Card>

            {/* 電子書籍管理 */}
            <Card className="shadow-xl border-0">
              <CardContent className="p-8">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <Smartphone className="w-8 h-8 text-green-600" />
                  </div>
                  <div>
                    <h4 className="text-2xl font-bold text-[color:var(--text-primary)]">電子書籍管理</h4>
                    <p className="text-[color:var(--text-secondary)]">「どこで買ったっけ？」</p>
                  </div>
                </div>
                <p className="text-[color:var(--text-secondary)] text-lg leading-relaxed">
                  Kindle、Kobo、BookLive!など、複数のプラットフォームで購入した電子書籍を一括管理。
                  続きを読みたい時に、どこで買ったかをすぐに確認できます。
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* 特徴セクション */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-[color:var(--bg-secondary)]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-[color:var(--text-primary)] mb-4">
              BookManagerの特徴
            </h3>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center shadow-lg">
              <CardContent className="p-6">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-8 h-8 text-orange-600" />
                </div>
                <h4 className="text-xl font-semibold text-[color:var(--text-primary)] mb-3">
                  Google Books連携
                </h4>
                <p className="text-[color:var(--text-secondary)]">
                  タイトルや著者名で検索するだけで、本の詳細情報を自動取得。手入力の手間を大幅削減。
                </p>
              </CardContent>
            </Card>

            <Card className="text-center shadow-lg">
              <CardContent className="p-6">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-purple-600" />
                </div>
                <h4 className="text-xl font-semibold text-[color:var(--text-primary)] mb-3">
                  シンプル設計
                </h4>
                <p className="text-[color:var(--text-secondary)]">
                  必要最小限の機能に絞った直感的なUI。誰でも簡単に使い始められます。
                </p>
              </CardContent>
            </Card>

            <Card className="text-center shadow-lg">
              <CardContent className="p-6">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-red-600" />
                </div>
                <h4 className="text-xl font-semibold text-[color:var(--text-primary)] mb-3">
                  完全無料
                </h4>
                <p className="text-[color:var(--text-secondary)]">
                  すべての機能を無料で利用可能。あなたの読書体験向上に貢献します。
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA セクション */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-[color:var(--primary)] to-[color:var(--accent)]">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-4xl font-bold text-white mb-6">
            今すぐ始めて、無駄な出費とサヨナラ
          </h3>
          <p className="text-xl text-white/90 mb-8">
            たった1分で設定完了。あなたの読書ライフを変える最初の一歩を踏み出しましょう。
          </p>
          
          <Link href="/auth/sign-up">
            <Button 
              size="lg" 
              className="h-16 px-12 bg-white text-[color:var(--primary)] hover:bg-gray-100 text-xl font-bold shadow-2xl"
            >
              <BookOpen className="w-8 h-8 mr-4" />
              無料でBookManagerを始める
              <ArrowRight className="w-6 h-6 ml-4" />
            </Button>
          </Link>
          
          <p className="text-white/70 text-sm mt-4">
            クレジットカード不要・いつでも退会可能
          </p>
        </div>
      </section>

      {/* フッター */}
      <footer className="bg-[color:var(--secondary)] text-white py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-6 md:mb-0">
              <BookOpen className="w-8 h-8" />
              <span className="text-2xl font-bold">BookManager</span>
            </div>
            
            <div className="flex space-x-8">
              <Link href="/terms" className="text-white/70 hover:text-white transition-colors">
                利用規約
              </Link>
              <Link href="/privacy" className="text-white/70 hover:text-white transition-colors">
                プライバシーポリシー
              </Link>
              <Link href="/support" className="text-white/70 hover:text-white transition-colors">
                お問い合わせ
              </Link>
            </div>
          </div>
          
          <div className="border-t border-white/20 mt-8 pt-8 text-center">
            <p className="text-white/60">
              © 2024 BookManager. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
