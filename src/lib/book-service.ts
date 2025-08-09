import { type BookRow, type BookInsert, type BookUpdate } from './supabase';
import type { Book } from './google-books';
import { useUser, useAuth } from '@clerk/nextjs';
import { useClerkSupabaseClient } from './supabase-clerk-client';
import type { SupabaseClient } from '@supabase/supabase-js';

// Supabaseのエラー型
interface SupabaseError {
  message: string;
  details?: string;
  hint?: string;
  code?: string;
}

// 検索・フィルター用のオプション
export interface BookSearchOptions {
  query?: string;
  format?: 'physical' | 'digital' | 'all';
  platform?: string;
  isRead?: boolean;
  category?: string;
  sortBy?: 'created_at' | 'updated_at' | 'title' | 'published_date' | 'rating';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

// 統計情報の型
export interface UserBookStats {
  totalBooks: number;
  physicalBooks: number;
  digitalBooks: number;
  readBooks: number;
  ratedBooks: number;
  averageRating: number;
  booksAddedThisMonth: number;
}

export interface PlatformStats {
  platform: string;
  bookCount: number;
}

// BookServiceクラス
export class BookService {
  private userId: string;
  private supabase: SupabaseClient;

  constructor(userId: string, supabaseClient: SupabaseClient) {
    this.userId = userId;
    this.supabase = supabaseClient;
    console.log('BookService初期化完了 - ユーザーID:', this.userId);
  }

  // 本を追加
  async addBook(bookData: Omit<Book, 'id' | 'createdAt' | 'updatedAt'>): Promise<BookRow> {
    // 日付をPostgreSQL DATE形式に変換
    const formatDate = (dateStr?: string): string | null => {
      if (!dateStr) return null;
      try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return null;
        return date.toISOString().split('T')[0];
      } catch {
        return null;
      }
    };

    const insertData: BookInsert = {
      user_id: this.userId,
      google_books_id: bookData.googleBooksId,
      title: bookData.title,
      authors: bookData.authors,
      publisher: bookData.publisher,
      published_date: formatDate(bookData.publishedDate),
      description: bookData.description,
      thumbnail_url: bookData.thumbnailUrl,
      page_count: bookData.pageCount,
      categories: bookData.categories,
      format: bookData.format,
      platform: bookData.platform,
      isbn10: bookData.isbn10,
      isbn13: bookData.isbn13,
    };

    const { data, error } = await this.supabase
      .from('books')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      throw new Error(`本の追加に失敗しました: ${error.message}`);
    }

    return data;
  }

  // 本を更新
  async updateBook(id: string, updateData: Partial<BookUpdate>): Promise<BookRow> {
    const { data, error } = await this.supabase
      .from('books')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', this.userId)
      .select()
      .single();

    if (error) {
      throw new Error(`本の更新に失敗しました: ${error.message}`);
    }

    return data;
  }

  // 本を削除
  async deleteBook(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('books')
      .delete()
      .eq('id', id)
      .eq('user_id', this.userId);

    if (error) {
      throw new Error(`本の削除に失敗しました: ${error.message}`);
    }
  }

  // 本を取得（ID指定）
  async getBook(id: string): Promise<BookRow | null> {
    const { data, error } = await this.supabase
      .from('books')
      .select('*')
      .eq('id', id)
      .eq('user_id', this.userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = Not Found
      throw new Error(`本の取得に失敗しました: ${error.message}`);
    }

    return data;
  }

  // 本の検索・一覧取得
  async searchBooks(options: BookSearchOptions = {}): Promise<BookRow[]> {
    let query = this.supabase
      .from('books')
      .select('*')
      .eq('user_id', this.userId);

    // フィルター条件を適用
    if (options.query) {
      // trigram検索とILIKE検索を組み合わせ（日本語に最適化）
      // タイトルの類似度検索 または 著者配列での部分一致検索
      const searchTerm = options.query.trim();
      query = query.or(
        `title.ilike.%${searchTerm}%,` +
        `authors.cs.{${searchTerm}}`
      );
    }

    if (options.format && options.format !== 'all') {
      query = query.eq('format', options.format);
    }

    if (options.platform) {
      query = query.eq('platform', options.platform);
    }

    if (typeof options.isRead === 'boolean') {
      query = query.eq('is_read', options.isRead);
    }

    if (options.category) {
      query = query.contains('categories', [options.category]);
    }

    // ソート
    const sortBy = options.sortBy || 'created_at';
    const sortOrder = options.sortOrder || 'desc';
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // ページネーション
    if (options.limit) {
      query = query.limit(options.limit);
    }
    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`本の検索に失敗しました: ${error.message}`);
    }

    return data || [];
  }

  // 重複チェック
  async checkDuplicate(title: string, authors: string[]): Promise<BookRow[]> {
    const { data, error } = await this.supabase
      .from('books')
      .select('*')
      .eq('user_id', this.userId)
      .eq('title', title)
      .contains('authors', authors);

    if (error) {
      throw new Error(`重複チェックに失敗しました: ${error.message}`);
    }

    return data || [];
  }

  // ISBN による検索
  async findByISBN(isbn: string): Promise<BookRow[]> {
    const { data, error } = await this.supabase
      .from('books')
      .select('*')
      .eq('user_id', this.userId)
      .or(`isbn10.eq.${isbn},isbn13.eq.${isbn}`);

    if (error) {
      throw new Error(`ISBN検索に失敗しました: ${error.message}`);
    }

    return data || [];
  }

  // 統計情報を取得
  async getUserStats(): Promise<UserBookStats> {
    const { data, error } = await this.supabase
      .from('user_book_stats')
      .select('*')
      .eq('user_id', this.userId)
      .single();

    if (error) {
      // データがない場合はデフォルト値を返す
      return {
        totalBooks: 0,
        physicalBooks: 0,
        digitalBooks: 0,
        readBooks: 0,
        ratedBooks: 0,
        averageRating: 0,
        booksAddedThisMonth: 0,
      };
    }

    return {
      totalBooks: data.total_books || 0,
      physicalBooks: data.physical_books || 0,
      digitalBooks: data.digital_books || 0,
      readBooks: data.read_books || 0,
      ratedBooks: data.rated_books || 0,
      averageRating: data.average_rating || 0,
      booksAddedThisMonth: data.books_added_this_month || 0,
    };
  }

  // プラットフォーム別統計
  async getPlatformStats(): Promise<PlatformStats[]> {
    const { data, error } = await this.supabase
      .from('user_platform_stats')
      .select('*')
      .eq('user_id', this.userId);

    if (error) {
      throw new Error(`プラットフォーム統計の取得に失敗しました: ${error.message}`);
    }

    return (data || []).map(item => ({
      platform: item.platform,
      bookCount: item.book_count,
    }));
  }

  // 読了状態を更新
  async markAsRead(id: string, isRead: boolean, readDate?: string): Promise<BookRow> {
    return this.updateBook(id, {
      is_read: isRead,
      read_date: readDate || (isRead ? new Date().toISOString().split('T')[0] : null),
    });
  }

  // 評価を更新
  async updateRating(id: string, rating: number): Promise<BookRow> {
    if (rating < 1 || rating > 5) {
      throw new Error('評価は1-5の範囲で設定してください');
    }

    return this.updateBook(id, { rating });
  }

  // メモを更新
  async updateNotes(id: string, notes: string): Promise<BookRow> {
    return this.updateBook(id, { notes });
  }

  // バルク操作：複数の本を削除
  async deleteBooks(ids: string[]): Promise<void> {
    const { error } = await this.supabase
      .from('books')
      .delete()
      .in('id', ids)
      .eq('user_id', this.userId);

    if (error) {
      throw new Error(`本の一括削除に失敗しました: ${error.message}`);
    }
  }

  // 最近追加した本を取得
  async getRecentBooks(limit: number = 5): Promise<BookRow[]> {
    return this.searchBooks({
      sortBy: 'created_at',
      sortOrder: 'desc',
      limit,
    });
  }

  // おすすめ本（評価の高い本）を取得
  async getHighRatedBooks(limit: number = 5): Promise<BookRow[]> {
    const { data, error } = await this.supabase
      .from('books')
      .select('*')
      .eq('user_id', this.userId)
      .not('rating', 'is', null)
      .order('rating', { ascending: false })
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`評価の高い本の取得に失敗しました: ${error.message}`);
    }

    return data || [];
  }
}

// React Hook として使用するためのヘルパー
export function useBookService() {
  const { user } = useUser();
  const supabaseClient = useClerkSupabaseClient();

  if (!user) {
    throw new Error('ユーザーがログインしていません');
  }

  return new BookService(user.id, supabaseClient);
}

// BookServiceのファクトリ（Supabaseクライアントを受け取る）
export function getBookService(userId: string, supabaseClient: SupabaseClient): BookService {
  return new BookService(userId, supabaseClient);
}