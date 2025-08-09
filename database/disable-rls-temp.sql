-- RLSを一時的に無効化（テスト用）
-- 本番環境では使用しないでください

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Users can only access their own books" ON books;
DROP POLICY IF EXISTS "Users can only access their own preferences" ON user_preferences;

-- RLSを無効化
ALTER TABLE books DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences DISABLE ROW LEVEL SECURITY;

-- テスト後に再度有効化する場合は以下を実行：
-- ALTER TABLE books ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
-- 
-- CREATE POLICY "Users can only access their own books" ON books
--     FOR ALL USING (user_id = auth.uid()::text);
-- 
-- CREATE POLICY "Users can only access their own preferences" ON user_preferences
--     FOR ALL USING (user_id = auth.uid()::text);