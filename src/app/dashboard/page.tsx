'use client';

import { useUser, UserButton } from '@clerk/nextjs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BookOpen, Search, Plus, Library, Smartphone } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { useSupabaseAuth } from '@/lib/supabase-auth';
import { useClerkSupabaseClient } from '@/lib/supabase-clerk-client';
import { type UserBookStats, type BookSearchOptions } from '@/lib/book-service';
import { type BookRow } from '@/lib/supabase';
import { type Book } from '@/lib/google-books';
import { BookCard } from '@/components/BookCard';

export default function DashboardPage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Supabase認証を同期
  const { user: supabaseUser } = useSupabaseAuth();
  const supabaseClient = useClerkSupabaseClient();
  
  // 統計データの状態
  const [stats, setStats] = useState<UserBookStats>({
    totalBooks: 0,
    physicalBooks: 0,
    digitalBooks: 0,
    booksAddedThisMonth: 0
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  
  // 最近追加した本の状態
  const [recentBooks, setRecentBooks] = useState<Book[]>([]);
  const [isLoadingRecentBooks, setIsLoadingRecentBooks] = useState(true);
  
  // 検索結果の状態
  const [searchResults, setSearchResults] = useState<Book[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchError, setSearchError] = useState('');
  
  // 認証状態をコンソールで確認
  console.log('Clerk user:', user?.id);
  console.log('Clerk isLoaded:', isLoaded);
  console.log('Clerk isSignedIn:', isSignedIn);
  console.log('Supabase auth synced:', !!supabaseUser);

  // BookRowをBookに変換するヘルパー関数
  function convertBookRowToBook(row: BookRow): Book {
    return {
      id: row.id,
      googleBooksId: row.google_books_id || undefined,
      title: row.title,
      authors: row.author ? [row.author] : [],
      publishedDate: row.published_date || undefined,
      description: row.description || undefined,
      categories: row.categories ? [row.categories] : [],
      thumbnailUrl: row.thumbnail_url || undefined,
      language: row.language || 'ja',
      format: row.format,
      platform: row.platform || undefined,
      rating: row.rating || undefined,
      review: row.review || undefined,
      readStatus: row.read_status || 'unread',
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  // 統計情報を読み込み
  const loadStats = useCallback(async () => {
    if (!user || !supabaseClient) return;
    
    try {
      setIsLoadingStats(true);
      const { BookService } = await import('@/lib/book-service');
      const bookService = new BookService(user.id, supabaseClient);
      const userStats = await bookService.getUserStats();
      console.log(userStats);
      setStats(userStats);
    } catch (err) {
      console.error('統計データの読み込みに失敗:', err);
    } finally {
      setIsLoadingStats(false);
    }
  }, [user?.id]); // supabaseClientは依存関係から除外

  // 最近追加した本を読み込み
  const loadRecentBooks = useCallback(async () => {
    if (!user || !supabaseClient) return;
    
    try {
      setIsLoadingRecentBooks(true);
      const { BookService } = await import('@/lib/book-service');
      const bookService = new BookService(user.id, supabaseClient);
      const searchOptions: BookSearchOptions = {
        sortBy: 'created_at',
        sortOrder: 'desc',
        limit: 6, // 最新6冊を表示
        offset: 0,
      };
      const bookRows = await bookService.searchBooks(searchOptions);
      const convertedBooks = bookRows.map(convertBookRowToBook);
      setRecentBooks(convertedBooks);
    } catch (err) {
      console.error('最近追加した本の読み込みに失敗:', err);
    } finally {
      setIsLoadingRecentBooks(false);
    }
  }, [user?.id]); // supabaseClientは依存関係から除外

  // 初期データ読み込み
  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      loadStats();
      loadRecentBooks();
    } else if (isLoaded && !isSignedIn) {
      // ログインしていない場合はローディング状態をリセット
      setIsLoadingStats(false);
      setIsLoadingRecentBooks(false);
    }
  }, [isLoaded, isSignedIn, user?.id, loadStats, loadRecentBooks]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || !user || !supabaseClient) return;
    
    setIsSearching(true);
    setSearchError('');
    setSearchResults([]);
    
    try {
      const { BookService } = await import('@/lib/book-service');
      const bookService = new BookService(user.id, supabaseClient);
      
      // タイトルまたは著者での検索
      const searchOptions: BookSearchOptions = {
        query: searchQuery.trim(),
        sortBy: 'created_at',
        sortOrder: 'desc',
        limit: 20
      };
      
      const bookRows = await bookService.searchBooks(searchOptions);
      const convertedBooks = bookRows.map(convertBookRowToBook);
      
      setSearchResults(convertedBooks);
      setHasSearched(true);
      
      if (convertedBooks.length === 0) {
        setSearchError('検索結果が見つかりませんでした');
      }
    } catch (err) {
      console.error('検索エラー:', err);
      setSearchError('検索中にエラーが発生しました');
    } finally {
      setIsSearching(false);
    }
  };

  // 認証状態のローディング中
  if (!isLoaded) {
    return (
      <div className="min-h-screen" style={{backgroundColor: 'var(--color-background)'}}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[color:var(--primary)] mx-auto mb-4"></div>
            <p className="text-lg text-[color:var(--text-secondary)]">認証状態を確認中...</p>
          </div>
        </div>
      </div>
    );
  }

  // 未認証の場合
  if (!isSignedIn) {
    return (
      <div className="min-h-screen" style={{backgroundColor: 'var(--color-background)'}}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center max-w-md mx-auto p-8">
            <BookOpen className="w-16 h-16 text-[color:var(--primary)] mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-[color:var(--text-primary)] mb-4">
              ログインが必要です
            </h2>
            <p className="text-[color:var(--text-secondary)] mb-6">
              BookManagerを使用するにはログインしてください
            </p>
            <div className="space-y-3">
              <Link href="/auth/sign-in">
                <Button className="w-full bg-[color:var(--primary)] hover:bg-[color:var(--primary-hover)]">
                  ログイン
                </Button>
              </Link>
              <Link href="/auth/sign-up">
                <Button variant="outline" className="w-full">
                  新規登録
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{backgroundColor: 'var(--color-background)'}}>
      {/* ヘッダー */}
      <header className="shadow-md" style={{backgroundColor: 'var(--color-background)'}}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <BookOpen className="w-8 h-8 text-[color:var(--primary)]" />
              <h1 className="text-2xl font-bold text-[color:var(--primary)]">BookManager</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-[color:var(--text-secondary)]">
                こんにちは、{user?.firstName || 'ユーザー'}さん
              </span>
              <UserButton 
                appearance={{
                  elements: {
                    avatarBox: "w-8 h-8"
                  }
                }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ウェルカムセクション */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-[color:var(--text-primary)] mb-2">
            📚 あなたの本棚
          </h2>
          <p className="text-[color:var(--text-secondary)]">
            読書記録を整理して、重複購入を防ぎましょう
          </p>
        </div>

        {/* 検索バー */}
        <Card className="mb-8 shadow-lg">
          <CardContent className="p-6">
            <form onSubmit={handleSearch} className="flex space-x-4">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="購入前に重複チェック！本のタイトルや著者名で検索..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-12 text-lg"
                />
              </div>
              <Button 
                type="submit"
                size="lg"
                className="h-12 px-6 bg-[color:var(--primary)] hover:bg-[color:var(--primary-hover)] text-white"
                disabled={isSearching}
              >
                <Search className="w-5 h-5 mr-2" />
                {isSearching ? '検索中...' : '重複チェック'}
              </Button>
            </form>
            <p className="text-sm text-[color:var(--text-muted)] mt-3">
              💡 本を購入する前に検索して、重複を確認しましょう
            </p>
          </CardContent>
        </Card>

        {hasSearched && (
          <Card className="shadow-lg mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Search className="w-5 h-5" />
                <span>検索結果</span>
                {searchResults.length > 0 && (
                  <span className="text-sm font-normal text-[color:var(--text-secondary)]">
                    ({searchResults.length}件)
                  </span>
                )}
              </CardTitle>
              <CardDescription>
                「{searchQuery}」の検索結果
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isSearching ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[color:var(--primary)] mx-auto"></div>
                  <p className="mt-2 text-sm text-[color:var(--text-secondary)]">検索中...</p>
                </div>
              ) : searchError ? (
                <div className="text-center py-12 text-[color:var(--text-secondary)]">
                  <Search className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg mb-2">{searchError}</p>
                  <p className="text-sm mb-4">別のキーワードで試してみてください</p>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setHasSearched(false);
                      setSearchQuery('');
                      setSearchError('');
                    }}
                  >
                    検索をクリア
                  </Button>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="text-center py-12 text-[color:var(--text-secondary)]">
                  <Search className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg mb-2">該当する本が見つかりませんでした</p>
                  <p className="text-sm mb-4">
                    この本はまだ登録されていないようです
                  </p>
                  <div className="space-y-2">
                    <Link href="/books/add">
                      <Button className="bg-[color:var(--primary)] hover:bg-[color:var(--primary-hover)]">
                        新しく本を追加
                      </Button>
                    </Link>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setHasSearched(false);
                        setSearchQuery('');
                      }}
                    >
                      検索をクリア
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-800 text-sm">
                      ✅ <strong>{searchResults.length}件</strong>の本が見つかりました。既に所有している本です！
                    </p>
                  </div>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                    {searchResults.map((book) => (
                      <BookCard key={book.id} book={book} isOwned={true} />
                    ))}
                  </div>
                  <div className="text-center pt-4 border-t">
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setHasSearched(false);
                        setSearchQuery('');
                      }}
                    >
                      検索をクリア
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
        {/* アクションカード */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* 本を追加 */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Plus className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">本を追加</CardTitle>
                  <CardDescription>新しい本を本棚に追加</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Link href="/books/add">
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  Google Books から検索
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* 本棚を見る */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Library className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">本棚を見る</CardTitle>
                  <CardDescription>登録済みの本を一覧表示</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Link href="/books">
                <Button variant="outline" className="w-full">
                  本棚を開く
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* 電子書籍管理 */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Smartphone className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">電子書籍</CardTitle>
                  <CardDescription>プラットフォーム別に管理</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Link href="/books?format=digital">
                <Button variant="outline" className="w-full">
                  電子書籍を見る
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* 統計情報 */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-[color:var(--primary)] mb-2">
                {isLoadingStats ? '...' : stats.totalBooks}
              </div>
              <div className="text-sm text-[color:var(--text-secondary)]">総登録数</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {isLoadingStats ? '...' : stats.physicalBooks}
              </div>
              <div className="text-sm text-[color:var(--text-secondary)]">物理本</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {isLoadingStats ? '...' : stats.digitalBooks}
              </div>
              <div className="text-sm text-[color:var(--text-secondary)]">電子書籍</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">
                {isLoadingStats ? '...' : stats.booksAddedThisMonth}
              </div>
              <div className="text-sm text-[color:var(--text-secondary)]">今月追加</div>
            </CardContent>
          </Card>
        </div>

        {/* 検索結果 */}

        {/* 最近追加した本 */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BookOpen className="w-5 h-5" />
              <span>最近追加した本</span>
            </CardTitle>
            <CardDescription>
              最近あなたが追加した本の一覧
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingRecentBooks ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[color:var(--primary)] mx-auto"></div>
                <p className="mt-2 text-sm text-[color:var(--text-secondary)]">読み込み中...</p>
              </div>
            ) : recentBooks.length === 0 ? (
              <div className="text-center py-12 text-[color:var(--text-secondary)]">
                <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">まだ本が登録されていません</p>
                <p className="text-sm mb-4">最初の本を追加して、読書記録を始めましょう</p>
                <Link href="/books/add">
                  <Button className="bg-[color:var(--primary)] hover:bg-[color:var(--primary-hover)]">
                    最初の本を追加
                  </Button>
                </Link>
              </div>
            ) : (
              <div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  {recentBooks.map((book) => (
                    <BookCard key={book.id} book={book} isOwned={true} />
                  ))}
                </div>
                {recentBooks.length >= 6 && (
                  <div className="text-center pt-4 border-t">
                    <Link href="/books">
                      <Button variant="outline" className="w-full">
                        すべての本を見る →
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
