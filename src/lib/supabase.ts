import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Supabaseクライアントの作成
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Clerkと連携するため、Supabaseのデフォルト認証を無効化
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  }
});

// データベーステーブルの型定義
export interface Database {
  public: {
    Tables: {
      books: {
        Row: {
          id: string;
          user_id: string;
          google_books_id: string | null;
          title: string;
          authors: string[];
          publisher: string | null;
          published_date: string | null;
          description: string | null;
          thumbnail_url: string | null;
          page_count: number | null;
          categories: string[] | null;
          format: 'physical' | 'digital';
          platform: string | null;
          isbn10: string | null;
          isbn13: string | null;
          purchase_date: string | null;
          purchase_price: number | null;
          notes: string | null;
          rating: number | null;
          is_read: boolean;
          read_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          google_books_id?: string | null;
          title: string;
          authors: string[];
          publisher?: string | null;
          published_date?: string | null;
          description?: string | null;
          thumbnail_url?: string | null;
          page_count?: number | null;
          categories?: string[] | null;
          format: 'physical' | 'digital';
          platform?: string | null;
          isbn10?: string | null;
          isbn13?: string | null;
          purchase_date?: string | null;
          purchase_price?: number | null;
          notes?: string | null;
          rating?: number | null;
          is_read?: boolean;
          read_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          google_books_id?: string | null;
          title?: string;
          authors?: string[];
          publisher?: string | null;
          published_date?: string | null;
          description?: string | null;
          thumbnail_url?: string | null;
          page_count?: number | null;
          categories?: string[] | null;
          format?: 'physical' | 'digital';
          platform?: string | null;
          isbn10?: string | null;
          isbn13?: string | null;
          purchase_date?: string | null;
          purchase_price?: number | null;
          notes?: string | null;
          rating?: number | null;
          is_read?: boolean;
          read_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_preferences: {
        Row: {
          id: string;
          user_id: string;
          default_format: 'physical' | 'digital';
          default_platform: string | null;
          auto_suggest_duplicates: boolean;
          notify_new_books: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          default_format?: 'physical' | 'digital';
          default_platform?: string | null;
          auto_suggest_duplicates?: boolean;
          notify_new_books?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          default_format?: 'physical' | 'digital';
          default_platform?: string | null;
          auto_suggest_duplicates?: boolean;
          notify_new_books?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      book_format: 'physical' | 'digital';
    };
  };
}

// 型安全なSupabaseクライアント
export type SupabaseClient = typeof supabase;
export type BookRow = Database['public']['Tables']['books']['Row'];
export type BookInsert = Database['public']['Tables']['books']['Insert'];
export type BookUpdate = Database['public']['Tables']['books']['Update'];
export type UserPreferencesRow = Database['public']['Tables']['user_preferences']['Row'];
export type UserPreferencesInsert = Database['public']['Tables']['user_preferences']['Insert'];
export type UserPreferencesUpdate = Database['public']['Tables']['user_preferences']['Update'];