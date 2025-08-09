-- 日本語全文検索設定のエラーを修正するSQL

-- 既存の検索インデックスをドロップ（存在する場合）
DROP INDEX IF EXISTS idx_books_search;

-- 全文検索インデックスの代わりに、より実用的なインデックスを作成
-- タイトルの部分一致検索用（trigram拡張使用）
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_books_title_trgm ON books USING GIN(title gin_trgm_ops);

-- 著者配列検索用のGINインデックス（既存のものを確認）
CREATE INDEX IF NOT EXISTS idx_books_authors_gin ON books USING GIN(authors);

-- インデックスが正常に作成されたか確認
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'books' 
AND indexname IN ('idx_books_title_trgm', 'idx_books_authors_gin');