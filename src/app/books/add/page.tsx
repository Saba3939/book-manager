'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SearchBar } from '@/components/SearchBar';
import { BookCard } from '@/components/BookCard';
import { 
  Search, 
  Plus, 
  BookOpen, 
  Smartphone, 
  ArrowLeft, 
  Loader2,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { getGoogleBooksAPI, convertGoogleBooksVolumeToBook, type GoogleBooksVolume, type Book } from '@/lib/google-books';
import { useBookService } from '@/lib/book-service';
import Link from 'next/link';

// プラットフォームオプション
const digitalPlatforms = [
  { id: 'kindle', name: 'Kindle', icon: '📚' },
  { id: 'kobo', name: 'Kobo', icon: '📖' },
  { id: 'booklive', name: 'BookLive!', icon: '📱' },
  { id: 'bookwalker', name: 'BookWalker', icon: '🎭' },
  { id: 'ebookjapan', name: 'ebookjapan', icon: '🎌' },
  { id: 'other', name: 'その他', icon: '📄' },
];

export default function AddBookPage() {
  const { user } = useUser();
  const router = useRouter();
  const bookService = useBookService();

  // 検索関連の状態
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GoogleBooksVolume[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  // 追加フォーム関連の状態
  const [showManualForm, setShowManualForm] = useState(false);
  const [selectedBook, setSelectedBook] = useState<GoogleBooksVolume | null>(null);
  const [bookFormat, setBookFormat] = useState<'physical' | 'digital'>('physical');
  const [selectedPlatform, setSelectedPlatform] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState('');

  // 手動入力フォームの状態
  const [manualForm, setManualForm] = useState({
    title: '',
    authors: '',
    publisher: '',
    publishedDate: '',
    description: '',
    isbn: '',
    pageCount: '',
  });

  // 重複チェックの状態
  const [duplicates, setDuplicates] = useState<any[]>([]);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);

  // Google Books検索
  const handleSearch = async (query: string) => {
    if (!query.trim()) return;

    setIsSearching(true);
    setSearchError('');
    setSearchResults([]);

    try {
      const api = getGoogleBooksAPI();
      const results = await api.searchBooks(query, {
        maxResults: 20,
        langRestrict: 'ja'
      });

      setSearchResults(results.items || []);
      if (!results.items || results.items.length === 0) {
        setSearchError('検索結果が見つかりませんでした。手動で追加してみてください。');
      }
    } catch (error) {
      setSearchError('検索中にエラーが発生しました。しばらく待ってから再試行してください。');
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // 本を選択して追加フォームを表示
  const handleSelectBook = async (volume: GoogleBooksVolume) => {
    setSelectedBook(volume);
    setAddError('');
    setAddSuccess('');

    // 重複チェック
    try {
      const bookData = convertGoogleBooksVolumeToBook(volume, bookFormat, selectedPlatform);
      const existingBooks = await bookService.checkDuplicate(bookData.title, bookData.authors);
      
      if (existingBooks.length > 0) {
        setDuplicates(existingBooks);
        setShowDuplicateWarning(true);
      } else {
        setShowDuplicateWarning(false);
      }
    } catch (error) {
      console.error('Duplicate check error:', error);
    }
  };

  // 本を追加
  const handleAddBook = async (forceAdd: boolean = false) => {
    if (!selectedBook && !showManualForm) return;

    if (!forceAdd && showDuplicateWarning && duplicates.length > 0) {
      return; // 重複警告が表示されている場合は強制追加フラグが必要
    }

    setIsAdding(true);
    setAddError('');

    try {
      let bookData: Omit<Book, 'id' | 'createdAt' | 'updatedAt'>;

      if (selectedBook) {
        // Google Books APIから選択した本
        bookData = convertGoogleBooksVolumeToBook(selectedBook, bookFormat, selectedPlatform);
      } else {
        // 手動入力フォーム
        const authorsArray = manualForm.authors.split(',').map(a => a.trim()).filter(a => a);
        bookData = {
          title: manualForm.title,
          authors: authorsArray.length > 0 ? authorsArray : ['不明な著者'],
          publisher: manualForm.publisher || undefined,
          publishedDate: manualForm.publishedDate || undefined,
          description: manualForm.description || undefined,
          pageCount: manualForm.pageCount ? parseInt(manualForm.pageCount) : undefined,
          format: bookFormat,
          platform: bookFormat === 'digital' ? selectedPlatform : undefined,
          isbn13: manualForm.isbn || undefined,
          categories: undefined,
          thumbnailUrl: undefined,
          googleBooksId: undefined,
          isbn10: undefined,
        };
      }

      await bookService.addBook(bookData);
      setAddSuccess('本が正常に追加されました！');
      
      // 成功後にリセット
      setTimeout(() => {
        router.push('/books');
      }, 2000);

    } catch (error) {
      setAddError(error instanceof Error ? error.message : '本の追加に失敗しました');
    } finally {
      setIsAdding(false);
    }
  };

  // 手動入力フォームのリセット
  const resetManualForm = () => {
    setManualForm({
      title: '',
      authors: '',
      publisher: '',
      publishedDate: '',
      description: '',
      isbn: '',
      pageCount: '',
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[color:var(--bg-secondary)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[color:var(--primary)]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[color:var(--bg-secondary)]">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Link href="/dashboard" className="flex items-center mr-4">
              <ArrowLeft className="w-5 h-5 text-[color:var(--text-secondary)] hover:text-[color:var(--primary)]" />
            </Link>
            <div className="flex items-center space-x-3">
              <Plus className="w-8 h-8 text-[color:var(--primary)]" />
              <h1 className="text-2xl font-bold text-[color:var(--text-primary)]">本を追加</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 成功・エラーメッセージ */}
        {addSuccess && (
          <Alert className="mb-6 border-[color:var(--success)] bg-green-50">
            <CheckCircle className="w-4 h-4 text-[color:var(--success)]" />
            <AlertDescription className="text-[color:var(--success)]">
              {addSuccess}
            </AlertDescription>
          </Alert>
        )}

        {addError && (
          <Alert className="mb-6 border-[color:var(--error)] bg-red-50">
            <AlertTriangle className="w-4 h-4 text-[color:var(--error)]" />
            <AlertDescription className="text-[color:var(--error)]">
              {addError}
            </AlertDescription>
          </Alert>
        )}

        {/* 検索セクション */}
        {!selectedBook && !showManualForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Search className="w-5 h-5" />
                <span>本を検索</span>
              </CardTitle>
              <CardDescription>
                Google Books APIで本を検索して追加できます
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SearchBar
                onSearch={handleSearch}
                placeholder="本のタイトルや著者名、ISBNで検索..."
                showVoiceInput={false}
                showFilters={false}
                isLoading={isSearching}
              />
              
              {searchError && (
                <Alert className="mt-4 border-[color:var(--warning)] bg-yellow-50">
                  <AlertTriangle className="w-4 h-4 text-[color:var(--warning)]" />
                  <AlertDescription className="text-[color:var(--warning)]">
                    {searchError}
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex justify-center mt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowManualForm(true)}
                  className="flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>手動で追加</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 検索結果 */}
        {searchResults.length > 0 && !selectedBook && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>検索結果</CardTitle>
              <CardDescription>
                追加したい本をクリックしてください
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {searchResults.map((volume) => {
                  const bookData = convertGoogleBooksVolumeToBook(volume);
                  const book: Book = {
                    id: volume.id,
                    ...bookData,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                  };
                  
                  return (
                    <div
                      key={volume.id}
                      className="cursor-pointer"
                      onClick={() => handleSelectBook(volume)}
                    >
                      <BookCard 
                        book={book}
                        isOwned={false}
                        isCompact={true}
                        className="hover:shadow-lg transition-shadow"
                      />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 本の追加フォーム */}
        {(selectedBook || showManualForm) && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{showManualForm ? '手動で本を追加' : '本の詳細設定'}</span>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setSelectedBook(null);
                    setShowManualForm(false);
                    setShowDuplicateWarning(false);
                    resetManualForm();
                  }}
                >
                  キャンセル
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 重複警告 */}
              {showDuplicateWarning && duplicates.length > 0 && (
                <Alert className="border-[color:var(--warning)] bg-yellow-50">
                  <AlertTriangle className="w-4 h-4 text-[color:var(--warning)]" />
                  <AlertDescription>
                    <div className="text-[color:var(--warning)] mb-2">
                      同じタイトルの本が既に登録されています：
                    </div>
                    <ul className="text-sm text-[color:var(--text-secondary)] space-y-1">
                      {duplicates.map((dup, index) => (
                        <li key={index}>
                          • {dup.title} ({dup.format === 'digital' ? dup.platform : '物理本'})
                        </li>
                      ))}
                    </ul>
                    <div className="mt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddBook(true)}
                        disabled={isAdding}
                        className="mr-2"
                      >
                        それでも追加
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowDuplicateWarning(false)}
                      >
                        キャンセル
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* 手動入力フォーム */}
              {showManualForm && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">タイトル *</Label>
                    <Input
                      id="title"
                      value={manualForm.title}
                      onChange={(e) => setManualForm({ ...manualForm, title: e.target.value })}
                      placeholder="本のタイトルを入力"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="authors">著者</Label>
                    <Input
                      id="authors"
                      value={manualForm.authors}
                      onChange={(e) => setManualForm({ ...manualForm, authors: e.target.value })}
                      placeholder="著者名（複数の場合はカンマ区切り）"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="publisher">出版社</Label>
                      <Input
                        id="publisher"
                        value={manualForm.publisher}
                        onChange={(e) => setManualForm({ ...manualForm, publisher: e.target.value })}
                        placeholder="出版社名"
                      />
                    </div>

                    <div>
                      <Label htmlFor="publishedDate">出版日</Label>
                      <Input
                        id="publishedDate"
                        type="date"
                        value={manualForm.publishedDate}
                        onChange={(e) => setManualForm({ ...manualForm, publishedDate: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="isbn">ISBN</Label>
                      <Input
                        id="isbn"
                        value={manualForm.isbn}
                        onChange={(e) => setManualForm({ ...manualForm, isbn: e.target.value })}
                        placeholder="ISBN-10 or ISBN-13"
                      />
                    </div>

                    <div>
                      <Label htmlFor="pageCount">ページ数</Label>
                      <Input
                        id="pageCount"
                        type="number"
                        value={manualForm.pageCount}
                        onChange={(e) => setManualForm({ ...manualForm, pageCount: e.target.value })}
                        placeholder="ページ数"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">説明</Label>
                    <Textarea
                      id="description"
                      value={manualForm.description}
                      onChange={(e) => setManualForm({ ...manualForm, description: e.target.value })}
                      placeholder="本の説明や内容"
                      rows={3}
                    />
                  </div>
                </div>
              )}

              {/* 形式選択 */}
              <div>
                <Label>本の形式 *</Label>
                <div className="flex space-x-4 mt-2">
                  <button
                    onClick={() => setBookFormat('physical')}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg border-2 transition-colors ${
                      bookFormat === 'physical'
                        ? 'border-[color:var(--primary)] bg-[color:var(--primary)]/10 text-[color:var(--primary)]'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <BookOpen className="w-5 h-5" />
                    <span>物理本</span>
                  </button>
                  <button
                    onClick={() => setBookFormat('digital')}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg border-2 transition-colors ${
                      bookFormat === 'digital'
                        ? 'border-[color:var(--primary)] bg-[color:var(--primary)]/10 text-[color:var(--primary)]'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Smartphone className="w-5 h-5" />
                    <span>電子書籍</span>
                  </button>
                </div>
              </div>

              {/* プラットフォーム選択（電子書籍の場合のみ） */}
              {bookFormat === 'digital' && (
                <div>
                  <Label>プラットフォーム *</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                    {digitalPlatforms.map((platform) => (
                      <button
                        key={platform.id}
                        onClick={() => setSelectedPlatform(platform.id)}
                        className={`flex items-center space-x-2 px-3 py-2 rounded-lg border-2 transition-colors ${
                          selectedPlatform === platform.id
                            ? 'border-[color:var(--primary)] bg-[color:var(--primary)]/10 text-[color:var(--primary)]'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <span>{platform.icon}</span>
                        <span className="text-sm">{platform.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 追加ボタン */}
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedBook(null);
                    setShowManualForm(false);
                    setShowDuplicateWarning(false);
                    resetManualForm();
                  }}
                >
                  キャンセル
                </Button>
                <Button
                  onClick={() => handleAddBook()}
                  disabled={
                    isAdding || 
                    (showManualForm && !manualForm.title.trim()) ||
                    (bookFormat === 'digital' && !selectedPlatform) ||
                    (showDuplicateWarning && duplicates.length > 0)
                  }
                  className="bg-[color:var(--primary)] hover:bg-[color:var(--primary-hover)]"
                >
                  {isAdding ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      追加中...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      本棚に追加
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}