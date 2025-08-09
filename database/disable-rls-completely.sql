-- RLSを完全に無効化（開発専用）

-- 既存のポリシーを全て削除
DROP POLICY IF EXISTS "Users can only access their own books" ON books;
DROP POLICY IF EXISTS "Users can only access their own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Authenticated users can access books" ON books;
DROP POLICY IF EXISTS "Authenticated users can access preferences" ON user_preferences;

-- RLSを無効化
ALTER TABLE books DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences DISABLE ROW LEVEL SECURITY;

-- 確認用
SELECT schemaname, tablename, rowsecurity, hasrlspolicy 
FROM pg_tables t
LEFT JOIN pg_class c ON c.relname = t.tablename
LEFT JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = t.schemaname
WHERE t.tablename IN ('books', 'user_preferences');

-- テスト用のシンプルなクエリ
SELECT 'RLS無効化完了' as status;