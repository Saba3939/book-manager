'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Book, Smartphone, MoreVertical, Edit, Trash2, ExternalLink } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import type { Book as BookType } from '@/lib/google-books';

interface BookCardProps {
  book: BookType;
  isOwned?: boolean;
  isCompact?: boolean;
  onEdit?: (book: BookType) => void;
  onDelete?: (bookId: string) => void;
  onAdd?: (book: BookType) => void;
  className?: string;
}

// プラットフォームの色とアイコンを定義
const platformConfig = {
  kindle: { color: 'bg-orange-100 text-orange-800', icon: '📚' },
  kobo: { color: 'bg-blue-100 text-blue-800', icon: '📖' },
  booklive: { color: 'bg-green-100 text-green-800', icon: '📱' },
  bookwalker: { color: 'bg-purple-100 text-purple-800', icon: '🎭' },
  ebookjapan: { color: 'bg-yellow-100 text-yellow-800', icon: '🎌' },
  physical: { color: 'bg-gray-100 text-gray-800', icon: '📗' },
  default: { color: 'bg-gray-100 text-gray-800', icon: '📄' },
};

export function BookCard({ 
  book, 
  isOwned = false, 
  isCompact = false, 
  onEdit, 
  onDelete, 
  onAdd,
  className = '' 
}: BookCardProps) {
  const [imageError, setImageError] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // プラットフォーム設定を取得
  const platformKey = book.format === 'digital' && book.platform 
    ? book.platform.toLowerCase() 
    : book.format === 'physical' 
      ? 'physical' 
      : 'default';
  const platformStyle = platformConfig[platformKey as keyof typeof platformConfig] || platformConfig.default;

  // 著者名を文字列に変換
  const authorsText = Array.isArray(book.authors) ? book.authors.join(', ') : book.authors;

  // 説明文を短縮
  const shortDescription = book.description 
    ? book.description.length > 100 
      ? book.description.substring(0, 100) + '...'
      : book.description
    : null;

  // コンパクト表示
  if (isCompact) {
    return (
      <Card className={`hover:shadow-md transition-shadow ${className}`}>
        <CardContent className="p-4">
          <div className="flex space-x-3">
            {/* サムネイル */}
            <div className="flex-shrink-0 w-12 h-16 bg-gray-100 rounded overflow-hidden">
              {book.thumbnailUrl && !imageError ? (
                <Image
                  src={book.thumbnailUrl}
                  alt={book.title}
                  width={48}
                  height={64}
                  className="w-full h-full object-cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <Book className="w-6 h-6" />
                </div>
              )}
            </div>

            {/* 情報 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-sm text-[color:var(--text-primary)] truncate">
                    {book.title}
                  </h3>
                  <p className="text-xs text-[color:var(--text-secondary)] truncate">
                    {authorsText}
                  </p>
                  
                  {/* ステータスバッジ */}
                  <div className="flex items-center space-x-2 mt-1">
                    {isOwned && (
                      <Badge variant="secondary" className="text-xs whitespace-nowrap bg-[color:var(--success)]/10 text-[color:var(--success)]">
                        所有済み
                      </Badge>
                    )}
                    <Badge variant="outline" className={`text-xs whitespace-nowrap ${platformStyle.color}`}>
                      {platformStyle.icon} {book.format === 'digital' ? book.platform : '物理本'}
                    </Badge>
                  </div>
                </div>

                {/* アクションメニュー */}
                {(onEdit || onDelete) && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {onEdit && (
                        <DropdownMenuItem onClick={() => onEdit(book)}>
                          <Edit className="w-4 h-4 mr-2" />
                          編集
                        </DropdownMenuItem>
                      )}
                      {onDelete && (
                        <DropdownMenuItem 
                          onClick={() => onDelete(book.id)} 
                          className="text-[color:var(--error)]"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          削除
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 通常表示
  return (
    <Card className={`hover:shadow-lg transition-all duration-200 ${className}`}>
      <CardContent className="p-6">
        <div className="flex space-x-4">
          {/* サムネイル */}
          <div className="flex-shrink-0">
            <div className="w-20 h-28 bg-gray-100 rounded-lg overflow-hidden shadow-sm">
              {book.thumbnailUrl && !imageError ? (
                <Image
                  src={book.thumbnailUrl}
                  alt={book.title}
                  width={80}
                  height={112}
                  className="w-full h-full object-cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <Book className="w-8 h-8" />
                </div>
              )}
            </div>
          </div>

          {/* メイン情報 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-3">
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-lg text-[color:var(--text-primary)] mb-1 line-clamp-2">
                  {book.title}
                </h3>
                <p className="text-[color:var(--text-secondary)] mb-2">
                  {authorsText}
                </p>
                
                {/* メタデータ */}
                <div className="flex flex-wrap items-center gap-2 text-sm text-[color:var(--text-muted)]">
                  {book.publisher && (
                    <span>{book.publisher}</span>
                  )}
                  {book.publishedDate && (
                    <span>• {new Date(book.publishedDate).getFullYear()}年</span>
                  )}
                  {book.pageCount && (
                    <span>• {book.pageCount}ページ</span>
                  )}
                </div>
              </div>

              {/* アクションメニュー */}
              {(onEdit || onDelete) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {onEdit && (
                      <DropdownMenuItem onClick={() => onEdit(book)}>
                        <Edit className="w-4 h-4 mr-2" />
                        編集
                      </DropdownMenuItem>
                    )}
                    {book.googleBooksId && (
                      <DropdownMenuItem asChild>
                        <Link 
                          href={`https://books.google.co.jp/books?id=${book.googleBooksId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Google Booksで確認
                        </Link>
                      </DropdownMenuItem>
                    )}
                    {onDelete && (
                      <DropdownMenuItem 
                        onClick={() => onDelete(book.id)} 
                        className="text-[color:var(--error)]"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        削除
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {/* ステータスとプラットフォーム */}
            <div className="flex items-center space-x-2 mb-3">
              {isOwned && (
                <Badge className="bg-[color:var(--success)] text-white whitespace-nowrap">
                  ✓ 所有済み
                </Badge>
              )}
              <Badge variant="outline" className={`whitespace-nowrap ${platformStyle.color}`}>
                {book.format === 'digital' ? (
                  <>
                    <Smartphone className="w-3 h-3 mr-1" />
                    {book.platform}
                  </>
                ) : (
                  <>
                    <Book className="w-3 h-3 mr-1" />
                    物理本
                  </>
                )}
              </Badge>
            </div>

            {/* 説明文 */}
            {shortDescription && (
              <div className="mb-4">
                <p className="text-sm text-[color:var(--text-secondary)] leading-relaxed">
                  {isExpanded ? book.description : shortDescription}
                </p>
                {book.description && book.description.length > 100 && (
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-xs text-[color:var(--primary)] hover:underline mt-1"
                  >
                    {isExpanded ? '閉じる' : '続きを読む'}
                  </button>
                )}
              </div>
            )}

            {/* アクションボタン */}
            <div className="flex space-x-2">
              {!isOwned && onAdd && (
                <Button 
                  onClick={() => onAdd(book)}
                  size="sm"
                  className="bg-[color:var(--primary)] hover:bg-[color:var(--primary-hover)]"
                >
                  <Book className="w-4 h-4 mr-1" />
                  本棚に追加
                </Button>
              )}
              
              {isOwned && onEdit && (
                <Button 
                  onClick={() => onEdit(book)}
                  variant="outline" 
                  size="sm"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  編集
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
