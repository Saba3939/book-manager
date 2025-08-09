'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { useClerkSupabaseClient } from '@/lib/supabase-clerk-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SearchBar } from '@/components/SearchBar';
import { BookCard } from '@/components/BookCard';
import { 
  Library, 
  Plus, 
  Grid, 
  List, 
  Filter,
  ArrowLeft,
  BookOpen,
  Smartphone,
  TrendingUp,
  Calendar,
  Star
} from 'lucide-react';
import { type BookSearchOptions, type UserBookStats, type PlatformStats } from '@/lib/book-service';
import { type BookRow } from '@/lib/supabase';
import { type Book } from '@/lib/google-books';
import Link from 'next/link';

// 表示モード
type ViewMode = 'grid' | 'list';

// ソートオプション
const sortOptions = [
  { value: 'created_at', label: '追加日（新しい順）', icon: Calendar },
  { value: 'updated_at', label: '更新日（新しい順）', icon: TrendingUp },
  { value: 'title', label: 'タイトル（あいうえお順）', icon: BookOpen },
  { value: 'rating', label: '評価（高い順）', icon: Star },
];

// フィルターオプション
const formatFilters = [
  { value: 'all', label: 'すべて', icon: '📚' },
  { value: 'physical', label: '物理本', icon: '📗' },
  { value: 'digital', label: '電子書籍', icon: '📱' },
];

// BookRowをBookに変換するヘルパー関数
function convertBookRowToBook(row: BookRow): Book {
  return {
    id: row.id,
    googleBooksId: row.google_books_id || undefined,
    title: row.title,
    authors: row.authors,
    publisher: row.publisher || undefined,
    publishedDate: row.published_date || undefined,
    description: row.description || undefined,
    thumbnailUrl: row.thumbnail_url || undefined,
    pageCount: row.page_count || undefined,
    categories: row.categories || undefined,
    format: row.format,
    platform: row.platform || undefined,
    isbn10: row.isbn10 || undefined,
    isbn13: row.isbn13 || undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export default function BooksPage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const supabaseClient = useClerkSupabaseClient();

  // 状態管理
  const [books, setBooks] = useState<Book[]>([]);
  const [stats, setStats] = useState<UserBookStats | null>(null);
  const [platformStats, setPlatformStats] = useState<PlatformStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // 表示・フィルター設定
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFormat, setSelectedFormat] = useState('all');
  const [selectedPlatform, setSelectedPlatform] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // ページネーション
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const itemsPerPage = 20;

  // 本の一覧を読み込み
  const loadBooks = useCallback(async (page: number = 0, append: boolean = false) => {
    if (!user || !supabaseClient) return;
    
    try {
      setIsLoading(!append); // 追加読み込みの場合はローディング表示しない

      const { BookService } = await import('@/lib/book-service');
      const bookService = new BookService(user.id, supabaseClient);

      const searchOptions: BookSearchOptions = {
        query: searchQuery || undefined,
        format: selectedFormat === 'all' ? 'all' : (selectedFormat as 'physical' | 'digital'),
        platform: selectedPlatform || undefined,
        sortBy: sortBy as any,
        sortOrder: sortOrder,
        limit: itemsPerPage,
        offset: page * itemsPerPage,
      };

      const bookRows = await bookService.searchBooks(searchOptions);
      const convertedBooks = bookRows.map(convertBookRowToBook);

      if (append) {
        setBooks(prev => [...prev, ...convertedBooks]);
      } else {
        setBooks(convertedBooks);
        setCurrentPage(0);
      }

      setHasMore(convertedBooks.length === itemsPerPage);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : '本の読み込みに失敗しました');
      console.error('Load books error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, searchQuery, selectedFormat, selectedPlatform, sortBy, sortOrder]);

  // 統計情報を読み込み
  const loadStats = useCallback(async () => {
    if (!user || !supabaseClient) return;
    
    try {
      const { BookService } = await import('@/lib/book-service');
      const bookService = new BookService(user.id, supabaseClient);
      
      const [userStats, platStats] = await Promise.all([
        bookService.getUserStats(),
        bookService.getPlatformStats(),
      ]);
      setStats(userStats);
      setPlatformStats(platStats);
    } catch (err) {
      console.error('Load stats error:', err);
    }
  }, [user?.id]);

  // 初期データ読み込み
  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      loadBooks();
      loadStats();
    } else if (isLoaded && !isSignedIn) {
      setIsLoading(false);
    }
  }, [isLoaded, isSignedIn, user?.id, loadBooks, loadStats]);

  // 検索
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(0);
  };

  // フィルター変更
  const handleFilterChange = (filterId: string) => {
    if (formatFilters.some(f => f.value === filterId)) {
      setSelectedFormat(filterId);
    } else {
      setSelectedPlatform(filterId === selectedPlatform ? '' : filterId);
    }
    setCurrentPage(0);
  };

  // もっと読み込む
  const loadMore = () => {
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    loadBooks(nextPage, true);
  };

  // 本を削除
  const handleDeleteBook = async (bookId: string) => {
    if (!confirm('この本を削除しますか？') || !user || !supabaseClient) return;

    try {
      const { BookService } = await import('@/lib/book-service');
      const bookService = new BookService(user.id, supabaseClient);
      
      await bookService.deleteBook(bookId);
      setBooks(prev => prev.filter(book => book.id !== bookId));
      loadStats(); // 統計情報を更新
    } catch (err) {
      alert(err instanceof Error ? err.message : '削除に失敗しました');
    }
  };

  // 本を編集（今回は簡単な読了状態の切り替えのみ）
  const handleEditBook = async (book: Book) => {
    // 今回は簡単な実装として、読了状態の切り替えのみ
    // 実際のアプリではより詳細な編集画面を作成
    const newReadStatus = !book.isRead;
    
    try {
      // BookRowのis_readフィールドを更新
      // 注意: BookRowにはis_readがあるが、Book型には定義されていないため、
      // 実際の実装では型定義を統一する必要があります
      alert('編集機能は今後実装予定です');
    } catch (err) {
      alert(err instanceof Error ? err.message : '更新に失敗しました');
    }
  };

  // 認証状態のローディング中
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[color:var(--bg-secondary)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[color:var(--primary)] mx-auto mb-4"></div>
          <p className="text-lg text-[color:var(--text-secondary)]">認証状態を確認中...</p>
        </div>
      </div>
    );
  }

  // 未認証の場合
  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-[color:var(--bg-secondary)] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <Library className="w-16 h-16 text-[color:var(--primary)] mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-[color:var(--text-primary)] mb-4">
            ログインが必要です
          </h2>
          <p className="text-[color:var(--text-secondary)] mb-6">
            本棚を閲覧するにはログインしてください
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
    );
  }

  return (
    <div className="min-h-screen bg-[color:var(--bg-secondary)]">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="flex items-center mr-4">
                <ArrowLeft className="w-5 h-5 text-[color:var(--text-secondary)] hover:text-[color:var(--primary)]" />
              </Link>
              <div className="flex items-center space-x-3">
                <Library className="w-8 h-8 text-[color:var(--primary)]" />
                <h1 className="text-2xl font-bold text-[color:var(--text-primary)]">本棚</h1>
              </div>
            </div>
            
            <Link href="/books/add">
              <Button className="bg-[color:var(--primary)] hover:bg-[color:var(--primary-hover)]">
                <Plus className="w-4 h-4 mr-2" />
                本を追加
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 統計情報 */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-[color:var(--primary)] mb-1">
                  {stats.totalBooks}
                </div>
                <div className="text-sm text-[color:var(--text-secondary)]">総登録数</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600 mb-1">
                  {stats.physicalBooks}
                </div>
                <div className="text-sm text-[color:var(--text-secondary)]">物理本</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600 mb-1">
                  {stats.digitalBooks}
                </div>
                <div className="text-sm text-[color:var(--text-secondary)]">電子書籍</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-600 mb-1">
                  {stats.booksAddedThisMonth}
                </div>
                <div className="text-sm text-[color:var(--text-secondary)]">今月追加</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 検索・フィルター */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <SearchBar
              onSearch={handleSearch}
              onFilter={handleFilterChange}
              placeholder="本のタイトルや著者名で検索..."
              showFilters={true}
              isLoading={isLoading}
            />

            {/* プラットフォームフィルター（電子書籍がある場合のみ） */}
            {platformStats.length > 0 && (
              <div className="flex items-center space-x-2 mt-4 overflow-x-auto pb-2">
                <div className="flex items-center space-x-1 text-sm text-[color:var(--text-muted)] whitespace-nowrap">
                  <Smartphone className="w-4 h-4" />
                  <span>プラットフォーム:</span>
                </div>
                
                <Badge
                  variant={selectedPlatform === '' ? "default" : "outline"}
                  className={`cursor-pointer transition-all duration-200 whitespace-nowrap ${
                    selectedPlatform === '' ? 'bg-[color:var(--primary)] text-white' : 'hover:bg-gray-100'
                  }`}
                  onClick={() => setSelectedPlatform('')}
                >
                  すべて
                </Badge>

                {platformStats.map((platform) => (
                  <Badge
                    key={platform.platform}
                    variant={selectedPlatform === platform.platform ? "default" : "outline"}
                    className={`cursor-pointer transition-all duration-200 whitespace-nowrap ${
                      selectedPlatform === platform.platform 
                        ? 'bg-[color:var(--primary)] text-white' 
                        : 'hover:bg-gray-100'
                    }`}
                    onClick={() => setSelectedPlatform(platform.platform)}
                  >
                    {platform.platform} ({platform.bookCount})
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ツールバー */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-[color:var(--text-secondary)]">
              {books.length}件の本が見つかりました
            </span>
          </div>

          <div className="flex items-center space-x-4">
            {/* ソート選択 */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-sm border rounded-lg px-3 py-2 bg-white"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {/* 表示モード切り替え */}
            <div className="flex items-center border rounded-lg">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-r-none"
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-l-none"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* エラー表示 */}
        {error && (
          <Card className="mb-6 border-[color:var(--error)] bg-red-50">
            <CardContent className="p-4">
              <p className="text-[color:var(--error)]">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* 本の一覧 */}
        {books.length > 0 ? (
          <>
            <div className={`${
              viewMode === 'grid' 
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
                : 'space-y-4'
            }`}>
              {books.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  isOwned={true}
                  isCompact={viewMode === 'list'}
                  onEdit={handleEditBook}
                  onDelete={handleDeleteBook}
                />
              ))}
            </div>

            {/* もっと読み込むボタン */}
            {hasMore && (
              <div className="text-center mt-8">
                <Button
                  variant="outline"
                  onClick={loadMore}
                  disabled={isLoading}
                >
                  {isLoading ? '読み込み中...' : 'もっと読み込む'}
                </Button>
              </div>
            )}
          </>
        ) : isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[color:var(--primary)] mx-auto mb-4"></div>
            <p className="text-[color:var(--text-secondary)]">本を読み込み中...</p>
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <BookOpen className="w-16 h-16 mx-auto mb-4 text-[color:var(--text-muted)]" />
              <h3 className="text-lg font-medium text-[color:var(--text-primary)] mb-2">
                {searchQuery ? '検索結果がありません' : '本が登録されていません'}
              </h3>
              <p className="text-[color:var(--text-secondary)] mb-4">
                {searchQuery 
                  ? '検索条件を変更してみてください' 
                  : '最初の本を追加して、読書記録を始めましょう'
                }
              </p>
              <Link href="/books/add">
                <Button className="bg-[color:var(--primary)] hover:bg-[color:var(--primary-hover)]">
                  <Plus className="w-4 h-4 mr-2" />
                  本を追加
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}