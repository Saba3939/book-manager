-- Clerk v6 + Supabase RLS統合のための適切なポリシー設定

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Users can only access their own books" ON books;
DROP POLICY IF EXISTS "Users can only access their own preferences" ON user_preferences;

-- RLSを有効化
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- booksテーブル用のRLSポリシー（Clerk JWT使用）
CREATE POLICY "Users can manage their own books via Clerk JWT"
ON books
FOR ALL
USING (
  -- Clerkから渡されるJWTのsubクレームがuser_idと一致する場合のみアクセス許可
  auth.jwt() ->> 'sub' = user_id::text
)
WITH CHECK (
  auth.jwt() ->> 'sub' = user_id::text
);

-- user_preferencesテーブル用のRLSポリシー（Clerk JWT使用）
CREATE POLICY "Users can manage their own preferences via Clerk JWT"
ON user_preferences
FOR ALL
USING (
  auth.jwt() ->> 'sub' = user_id::text
)
WITH CHECK (
  auth.jwt() ->> 'sub' = user_id::text
);

-- 確認用クエリ：RLSとポリシーの状態を表示
SELECT 
    schemaname, 
    tablename, 
    rowsecurity, 
    hasrlspolicy,
    (SELECT count(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = t.tablename) as policy_count
FROM pg_tables t
LEFT JOIN pg_class c ON c.relname = t.tablename
LEFT JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = t.schemaname
WHERE t.tablename IN ('books', 'user_preferences');

-- ポリシーの詳細を表示
SELECT schemaname, tablename, policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename IN ('books', 'user_preferences');

-- テスト用：現在のJWTクレーム確認
SELECT 
    'JWT設定完了' as status,
    auth.jwt() ->> 'sub' as clerk_user_id,
    auth.jwt() ->> 'iss' as issuer;