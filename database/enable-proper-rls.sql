-- 適切なRLSポリシーの設定（Clerk + Supabase統合用）

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Users can only access their own books" ON books;
DROP POLICY IF EXISTS "Users can only access their own preferences" ON user_preferences;

-- RLSを有効化
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Supabase auth.uid()を使用した正しいポリシー
CREATE POLICY "Users can only access their own books" ON books
    FOR ALL USING (user_id = auth.uid()::text);

CREATE POLICY "Users can only access their own preferences" ON user_preferences  
    FOR ALL USING (user_id = auth.uid()::text);

-- 認証されていないユーザーはアクセス不可
CREATE POLICY "Require authentication for books" ON books
    FOR ALL TO authenticated USING (true);

CREATE POLICY "Require authentication for preferences" ON user_preferences
    FOR ALL TO authenticated USING (true);