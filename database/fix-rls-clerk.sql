-- ClerkとSupabase統合用のRLSポリシー修正

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Users can only access their own books" ON books;
DROP POLICY IF EXISTS "Users can only access their own preferences" ON user_preferences;

-- RLSを有効化
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Clerk JWTトークンのuser_idを使用した正しいポリシー
-- auth.uid()ではなくClerkのuser_idを直接使用
CREATE POLICY "Users can only access their own books" ON books
    FOR ALL 
    USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can only access their own preferences" ON user_preferences
    FOR ALL 
    USING (user_id = auth.jwt() ->> 'sub');

-- 代替案：認証済みユーザーのみアクセス可能な簡易版
-- CREATE POLICY "Authenticated users can access books" ON books
--     FOR ALL TO authenticated
--     USING (true);

-- CREATE POLICY "Authenticated users can access preferences" ON user_preferences  
--     FOR ALL TO authenticated
--     USING (true);