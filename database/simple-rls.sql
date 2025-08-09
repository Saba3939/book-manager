-- シンプルなRLSポリシー（認証済みユーザーのみ）
-- 開発中の一時的な解決策

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Users can only access their own books" ON books;
DROP POLICY IF EXISTS "Users can only access their own preferences" ON user_preferences;

-- RLSを有効化
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- 認証済みユーザーは全てアクセス可能（開発用）
CREATE POLICY "Authenticated users can access books" ON books
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Authenticated users can access preferences" ON user_preferences
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

-- ログイン後にSupabaseでも確認できるように
-- SELECT auth.uid(), auth.jwt();
-- SELECT current_user, current_setting('app.current_user_id', true);