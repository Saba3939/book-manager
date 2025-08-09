# BookManager データベース設計

## 概要

BookManagerアプリのデータベースは以下の要件を満たすよう設計されています：

- **セキュリティ**: Row Level Security (RLS) によるユーザーデータの分離
- **パフォーマンス**: 適切なインデックスと全文検索対応
- **スケーラビリティ**: PostgreSQLの配列型やJSONBを活用した柔軟なスキーマ
- **データ整合性**: 制約とトリガーによる自動更新

## テーブル構成

### 1. books テーブル

本の情報を管理するメインテーブルです。

```sql
books (
    id UUID PRIMARY KEY,
    user_id TEXT NOT NULL,           -- ClerkのユーザーID
    google_books_id TEXT,            -- Google Books APIのID
    title VARCHAR(500) NOT NULL,     -- 本のタイトル
    authors TEXT[] NOT NULL,         -- 著者名（配列）
    publisher VARCHAR(300),          -- 出版社
    published_date DATE,             -- 出版日
    description TEXT,                -- 説明文
    thumbnail_url TEXT,              -- 表紙画像URL
    page_count INTEGER,              -- ページ数
    categories TEXT[],               -- カテゴリ（配列）
    format book_format NOT NULL,     -- 形式（physical/digital）
    platform VARCHAR(100),          -- プラットフォーム（電子書籍）
    isbn10 VARCHAR(10),              -- ISBN-10
    isbn13 VARCHAR(13),              -- ISBN-13
    purchase_date DATE,              -- 購入日
    purchase_price DECIMAL(10,2),    -- 購入価格
    notes TEXT,                      -- ユーザーメモ
    rating INTEGER,                  -- 評価（1-5）
    is_read BOOLEAN DEFAULT FALSE,   -- 読了フラグ
    read_date DATE,                  -- 読了日
    created_at TIMESTAMP,            -- 作成日時
    updated_at TIMESTAMP             -- 更新日時
)
```

### 2. user_preferences テーブル

ユーザーの設定を管理します。

```sql
user_preferences (
    id UUID PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL,           -- ClerkのユーザーID
    default_format book_format,             -- デフォルト形式
    default_platform VARCHAR(100),         -- デフォルトプラットフォーム
    auto_suggest_duplicates BOOLEAN,       -- 重複自動検知
    notify_new_books BOOLEAN,              -- 新刊通知
    created_at TIMESTAMP,
    updated_at TIMESTAMP
)
```

## インデックス設計

### パフォーマンス最適化

```sql
-- 主要検索パターンに対応
CREATE INDEX idx_books_user_id ON books(user_id);
CREATE INDEX idx_books_title ON books(title);
CREATE INDEX idx_books_authors ON books USING GIN(authors);
CREATE INDEX idx_books_format ON books(format);
CREATE INDEX idx_books_isbn10 ON books(isbn10);
CREATE INDEX idx_books_isbn13 ON books(isbn13);

-- 全文検索対応
CREATE INDEX idx_books_search ON books USING GIN(
    to_tsvector('japanese', title || ' ' || array_to_string(authors, ' ') || ' ' || COALESCE(description, ''))
);

-- 時系列検索
CREATE INDEX idx_books_created_at ON books(created_at DESC);
```

## セキュリティ設計

### Row Level Security (RLS)

各ユーザーは自分のデータのみアクセス可能：

```sql
-- RLS有効化
ALTER TABLE books ENABLE ROW LEVEL SECURITY;

-- ポリシー設定
CREATE POLICY "Users can only access their own books" ON books
    FOR ALL USING (user_id = current_setting('app.current_user_id', true));
```

### Clerk認証連携

```typescript
// ClerkユーザーIDを使用してSupabaseのRLSを設定
await supabase.rpc('set_config', {
  setting_name: 'app.current_user_id',
  new_value: clerkUserId
});
```

## データベース初期化手順

### 1. Supabaseプロジェクトの作成

1. [Supabase](https://supabase.com/) でアカウント作成
2. 新しいプロジェクトを作成
3. データベース接続情報を確認

### 2. スキーマの実行

```bash
# Supabase SQL Editorで schema.sql を実行
# または
supabase db push
```

### 3. 環境変数の設定

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## 使用例

### 基本的な操作

```typescript
import { BookService } from '@/lib/book-service';

// サービスの初期化
const bookService = new BookService(userId);

// 本を追加
await bookService.addBook({
  title: '鬼滅の刃 1',
  authors: ['吾峠呼世晴'],
  format: 'physical',
  // ...その他のフィールド
});

// 本を検索
const books = await bookService.searchBooks({
  query: '鬼滅',
  format: 'all',
  sortBy: 'created_at',
  limit: 20
});

// 統計情報取得
const stats = await bookService.getUserStats();
```

### 重複チェック

```typescript
// タイトルと著者で重複チェック
const duplicates = await bookService.checkDuplicate(
  '鬼滅の刃 1',
  ['吾峠呼世晴']
);

if (duplicates.length > 0) {
  console.log('この本は既に登録済みです');
}
```

## パフォーマンス考慮事項

### 1. 検索最適化

- **全文検索**: PostgreSQLのGINインデックスを使用
- **部分一致**: LIKE検索よりもto_tsvectorを推奨
- **配列検索**: GINインデックスで高速化

### 2. ページネーション

```typescript
// 大量データの効率的な取得
const books = await bookService.searchBooks({
  limit: 50,
  offset: page * 50,
  sortBy: 'created_at'
});
```

### 3. データサイズ最適化

- **画像**: サムネイルURLのみ保存、実画像は外部ストレージ
- **説明文**: 必要に応じてテキスト圧縮
- **配列データ**: PostgreSQLネイティブの配列型を活用

## バックアップとメンテナンス

### 自動バックアップ

Supabaseは自動的に日次バックアップを実行します。

### データメンテナンス

```sql
-- 古いデータの削除（例：1年以上前に削除マークされたデータ）
DELETE FROM books 
WHERE deleted_at < NOW() - INTERVAL '1 year';

-- インデックスの再構築
REINDEX INDEX CONCURRENTLY idx_books_search;

-- 統計情報の更新
ANALYZE books;
```

## 拡張計画

将来的な機能拡張に向けた設計：

1. **読書記録**: 読書進捗、メモ、引用の管理
2. **レビュー機能**: 詳細なレビューとコメント
3. **ソーシャル機能**: 友人との本の共有
4. **推薦システム**: 読書履歴に基づく本の推薦
5. **統計分析**: より詳細な読書統計とグラフ表示