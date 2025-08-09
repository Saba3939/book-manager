-- Clerkネイティブ統合用のRLSポリシー（2025年推奨方式）
-- Clerk Session Tokenを使用した安全なRLS設定

-- 既存のポリシーをすべて削除
DROP POLICY IF EXISTS "Users can only access their own books" ON books;
DROP POLICY IF EXISTS "Users can only access their own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Require authentication for books" ON books;
DROP POLICY IF EXISTS "Require authentication for preferences" ON user_preferences;
DROP POLICY IF EXISTS "Authenticated users can access books" ON books;
DROP POLICY IF EXISTS "Authenticated users can access preferences" ON user_preferences;

-- RLSを有効化
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Clerk Session Token内のuser_idを使用したポリシー
-- auth.jwt()でClerkセッショントークンからuser_id（sub claim）を取得
CREATE POLICY "Users can only access their own books" ON books
    FOR ALL 
    USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can only access their own preferences" ON user_preferences
    FOR ALL 
    USING (user_id = auth.jwt() ->> 'sub');

-- 追加のセキュリティ：認証済みユーザーのみアクセス可能
CREATE POLICY "Require authentication for books access" ON books
    FOR ALL
    TO authenticated
    USING (true);

CREATE POLICY "Require authentication for preferences access" ON user_preferences
    FOR ALL
    TO authenticated
    USING (true);

-- RLSポリシーをビューにも適用
-- user_book_stats ビュー用のセキュリティ関数
CREATE OR REPLACE FUNCTION get_current_user_stats()
RETURNS TABLE (
    total_books bigint,
    physical_books bigint,
    digital_books bigint,
    read_books bigint,
    rated_books bigint,
    average_rating numeric,
    books_added_this_month bigint
)
SECURITY DEFINER
LANGUAGE sql AS $$
    SELECT 
        COUNT(*) as total_books,
        COUNT(*) FILTER (WHERE format = 'physical') as physical_books,
        COUNT(*) FILTER (WHERE format = 'digital') as digital_books,
        COUNT(*) FILTER (WHERE is_read = true) as read_books,
        COUNT(*) FILTER (WHERE rating IS NOT NULL) as rated_books,
        ROUND(AVG(rating), 2) as average_rating,
        COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as books_added_this_month
    FROM books 
    WHERE user_id = auth.jwt() ->> 'sub';
$$;

-- user_platform_stats ビュー用のセキュリティ関数
CREATE OR REPLACE FUNCTION get_current_user_platform_stats()
RETURNS TABLE (
    platform text,
    book_count bigint
)
SECURITY DEFINER
LANGUAGE sql AS $$
    SELECT 
        platform,
        COUNT(*) as book_count
    FROM books 
    WHERE format = 'digital' 
    AND platform IS NOT NULL 
    AND user_id = auth.jwt() ->> 'sub'
    GROUP BY platform
    ORDER BY book_count DESC;
$$;

-- RLSの動作確認用関数（開発時のデバッグ用）
CREATE OR REPLACE FUNCTION debug_current_user()
RETURNS TABLE (
    jwt_sub text,
    raw_jwt text
)
SECURITY DEFINER
LANGUAGE sql AS $$
    SELECT 
        auth.jwt() ->> 'sub' as jwt_sub,
        auth.jwt()::text as raw_jwt;
$$;

-- コメント
COMMENT ON POLICY "Users can only access their own books" ON books IS 'Clerkセッショントークンのsubクレームを使用したユーザー分離';
COMMENT ON POLICY "Users can only access their own preferences" ON user_preferences IS 'Clerkセッショントークンのsubクレームを使用したユーザー分離';
COMMENT ON FUNCTION get_current_user_stats() IS '現在のユーザーの統計情報を安全に取得';
COMMENT ON FUNCTION get_current_user_platform_stats() IS '現在のユーザーのプラットフォーム別統計を安全に取得';