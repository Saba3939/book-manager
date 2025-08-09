-- BookManager データベーススキーマ
-- Supabaseで実行するSQL

-- 拡張機能を有効化
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- カスタム型の定義
CREATE TYPE book_format AS ENUM ('physical', 'digital');

-- booksテーブル
CREATE TABLE IF NOT EXISTS books (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL, -- ClerkのユーザーID
    google_books_id TEXT, -- Google Books APIのvolume ID
    title VARCHAR(500) NOT NULL,
    authors TEXT[] NOT NULL DEFAULT '{}', -- 著者名の配列
    publisher VARCHAR(300),
    published_date DATE,
    description TEXT,
    thumbnail_url TEXT,
    page_count INTEGER,
    categories TEXT[], -- ジャンルの配列
    format book_format NOT NULL,
    platform VARCHAR(100), -- 電子書籍のプラットフォーム（digital の場合のみ）
    isbn10 VARCHAR(10),
    isbn13 VARCHAR(13),
    purchase_date DATE,
    purchase_price DECIMAL(10, 2), -- 購入価格
    notes TEXT, -- ユーザーのメモ
    rating INTEGER CHECK (rating >= 1 AND rating <= 5), -- 1-5の評価
    is_read BOOLEAN DEFAULT FALSE, -- 読了フラグ
    read_date DATE, -- 読了日
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- インデックス用の制約
    CONSTRAINT valid_isbn10 CHECK (isbn10 IS NULL OR length(isbn10) = 10),
    CONSTRAINT valid_isbn13 CHECK (isbn13 IS NULL OR length(isbn13) = 13),
    CONSTRAINT valid_platform CHECK (
        (format = 'digital' AND platform IS NOT NULL) OR 
        (format = 'physical' AND platform IS NULL)
    )
);

-- ユーザー設定テーブル
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT UNIQUE NOT NULL, -- ClerkのユーザーID
    default_format book_format DEFAULT 'physical',
    default_platform VARCHAR(100), -- デフォルトの電子書籍プラットフォーム
    auto_suggest_duplicates BOOLEAN DEFAULT TRUE,
    notify_new_books BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_books_user_id ON books(user_id);
CREATE INDEX IF NOT EXISTS idx_books_title ON books(title);
CREATE INDEX IF NOT EXISTS idx_books_authors ON books USING GIN(authors);
CREATE INDEX IF NOT EXISTS idx_books_format ON books(format);
CREATE INDEX IF NOT EXISTS idx_books_platform ON books(platform);
CREATE INDEX IF NOT EXISTS idx_books_isbn10 ON books(isbn10);
CREATE INDEX IF NOT EXISTS idx_books_isbn13 ON books(isbn13);
CREATE INDEX IF NOT EXISTS idx_books_google_books_id ON books(google_books_id);
CREATE INDEX IF NOT EXISTS idx_books_created_at ON books(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_books_updated_at ON books(updated_at DESC);

-- 拡張機能を有効化（trigram検索用）
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- タイトルの部分一致検索用（trigram使用 - 日本語に効果的）
CREATE INDEX IF NOT EXISTS idx_books_title_trgm ON books USING GIN(title gin_trgm_ops);

-- RLS (Row Level Security) ポリシーの有効化
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のデータのみアクセス可能
CREATE POLICY "Users can only access their own books" ON books
    FOR ALL USING (user_id = current_setting('app.current_user_id', true));

CREATE POLICY "Users can only access their own preferences" ON user_preferences
    FOR ALL USING (user_id = current_setting('app.current_user_id', true));

-- updated_at を自動更新するトリガー関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- トリガーの作成
CREATE TRIGGER update_books_updated_at
    BEFORE UPDATE ON books
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 統計情報を取得するビュー
CREATE OR REPLACE VIEW user_book_stats AS
SELECT 
    user_id,
    COUNT(*) as total_books,
    COUNT(*) FILTER (WHERE format = 'physical') as physical_books,
    COUNT(*) FILTER (WHERE format = 'digital') as digital_books,
    COUNT(*) FILTER (WHERE is_read = true) as read_books,
    COUNT(*) FILTER (WHERE rating IS NOT NULL) as rated_books,
    ROUND(AVG(rating), 2) as average_rating,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as books_added_this_month
FROM books 
GROUP BY user_id;

-- プラットフォーム別統計ビュー
CREATE OR REPLACE VIEW user_platform_stats AS
SELECT 
    user_id,
    platform,
    COUNT(*) as book_count
FROM books 
WHERE format = 'digital' AND platform IS NOT NULL
GROUP BY user_id, platform
ORDER BY user_id, book_count DESC;

-- 重複検知のためのビュー
CREATE OR REPLACE VIEW potential_duplicates AS
SELECT 
    user_id,
    title,
    authors,
    COUNT(*) as duplicate_count,
    array_agg(id) as book_ids
FROM books
GROUP BY user_id, title, authors
HAVING COUNT(*) > 1;

-- サンプルデータの挿入（開発用）
-- 実際の運用では削除してください
INSERT INTO user_preferences (user_id, default_format, default_platform) VALUES
('sample_user_1', 'digital', 'kindle'),
('sample_user_2', 'physical', NULL)
ON CONFLICT (user_id) DO NOTHING;

-- RPC関数: 設定値を設定する
CREATE OR REPLACE FUNCTION set_config(setting_name text, new_value text)
RETURNS void AS $$
BEGIN
    PERFORM set_config(setting_name, new_value, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC関数: 現在の設定値を取得する  
CREATE OR REPLACE FUNCTION current_setting(setting_name text)
RETURNS text AS $$
BEGIN
    RETURN current_setting(setting_name, true);
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- コメント追加
COMMENT ON TABLE books IS '本の情報を管理するメインテーブル';
COMMENT ON TABLE user_preferences IS 'ユーザーの設定情報';
COMMENT ON COLUMN books.user_id IS 'Clerkから取得するユーザーID';
COMMENT ON COLUMN books.google_books_id IS 'Google Books APIのvolume ID';
COMMENT ON COLUMN books.format IS '本の形式: physical（物理本） or digital（電子書籍）';
COMMENT ON COLUMN books.platform IS '電子書籍のプラットフォーム（digitalの場合のみ）';
COMMENT ON COLUMN books.authors IS '著者名の配列（複数著者対応）';
COMMENT ON COLUMN books.categories IS 'ジャンル/カテゴリの配列';