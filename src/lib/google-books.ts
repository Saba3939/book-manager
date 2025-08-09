// Google Books APIのタイプ定義
export interface GoogleBooksVolume {
  id: string;
  volumeInfo: {
    title: string;
    authors?: string[];
    publisher?: string;
    publishedDate?: string;
    description?: string;
    industryIdentifiers?: Array<{
      type: string;
      identifier: string;
    }>;
    readingModes?: {
      text: boolean;
      image: boolean;
    };
    pageCount?: number;
    printType?: string;
    categories?: string[];
    averageRating?: number;
    ratingsCount?: number;
    maturityRating?: string;
    allowAnonLogging?: boolean;
    contentVersion?: string;
    panelizationSummary?: {
      containsEpubBubbles: boolean;
      containsImageBubbles: boolean;
    };
    imageLinks?: {
      smallThumbnail?: string;
      thumbnail?: string;
      small?: string;
      medium?: string;
      large?: string;
      extraLarge?: string;
    };
    language?: string;
    previewLink?: string;
    infoLink?: string;
    canonicalVolumeLink?: string;
  };
  saleInfo?: {
    country: string;
    saleability: string;
    isEbook?: boolean;
    listPrice?: {
      amount: number;
      currencyCode: string;
    };
    retailPrice?: {
      amount: number;
      currencyCode: string;
    };
    buyLink?: string;
    offers?: Array<{
      finskyOfferType: number;
      listPrice: {
        amountInMicros: number;
        currencyCode: string;
      };
      retailPrice: {
        amountInMicros: number;
        currencyCode: string;
      };
    }>;
  };
  accessInfo?: {
    country: string;
    viewability: string;
    embeddable: boolean;
    publicDomain: boolean;
    textToSpeechPermission: string;
    epub?: {
      isAvailable: boolean;
      acsTokenLink?: string;
    };
    pdf?: {
      isAvailable: boolean;
      acsTokenLink?: string;
    };
    webReaderLink?: string;
    accessViewStatus: string;
    quoteSharingAllowed: boolean;
  };
  searchInfo?: {
    textSnippet: string;
  };
}

export interface GoogleBooksResponse {
  kind: string;
  totalItems: number;
  items?: GoogleBooksVolume[];
}

// アプリケーション内で使用する本の型定義
export interface Book {
  id: string;
  googleBooksId?: string;
  title: string;
  authors: string[];
  publisher?: string;
  publishedDate?: string;
  description?: string;
  thumbnailUrl?: string;
  pageCount?: number;
  categories?: string[];
  format: 'physical' | 'digital';
  platform?: string;  // 電子書籍の場合のプラットフォーム
  isbn10?: string;
  isbn13?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Google Books APIのクライアント
class GoogleBooksAPI {
  private apiKey: string;
  private baseUrl = 'https://www.googleapis.com/books/v1';
  private cache = new Map<string, { data: GoogleBooksResponse; timestamp: number }>();
  private cacheTimeout = 5 * 60 * 1000; // 5分間キャッシュ

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  // 本を検索
  async searchBooks(
    query: string, 
    options: {
      maxResults?: number;
      startIndex?: number;
      orderBy?: 'relevance' | 'newest';
      langRestrict?: string;
    } = {}
  ): Promise<GoogleBooksResponse> {
    const {
      maxResults = 20,
      startIndex = 0,
      orderBy = 'relevance',
      langRestrict = 'ja'
    } = options;

    // キャッシュをチェック
    const cacheKey = `search:${query}:${JSON.stringify(options)}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    // クエリをエンコード
    const encodedQuery = encodeURIComponent(query);
    const url = `${this.baseUrl}/volumes?q=${encodedQuery}&maxResults=${maxResults}&startIndex=${startIndex}&orderBy=${orderBy}&langRestrict=${langRestrict}&key=${this.apiKey}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Google Books API error: ${response.status} ${response.statusText}`);
      }

      const data: GoogleBooksResponse = await response.json();
      
      // キャッシュに保存
      this.cache.set(cacheKey, { data, timestamp: Date.now() });
      
      return data;
    } catch (error) {
      console.error('Google Books API search error:', error);
      throw error;
    }
  }

  // 特定の本を取得
  async getBook(volumeId: string): Promise<GoogleBooksVolume | null> {
    const cacheKey = `book:${volumeId}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data.items?.[0] || null;
    }

    try {
      const url = `${this.baseUrl}/volumes/${volumeId}?key=${this.apiKey}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Google Books API error: ${response.status} ${response.statusText}`);
      }

      const data: GoogleBooksVolume = await response.json();
      
      // キャッシュに保存
      this.cache.set(cacheKey, { 
        data: { kind: 'books#volumes', totalItems: 1, items: [data] }, 
        timestamp: Date.now() 
      });
      
      return data;
    } catch (error) {
      console.error('Google Books API get book error:', error);
      throw error;
    }
  }

  // ISBNで検索
  async searchByISBN(isbn: string): Promise<GoogleBooksResponse> {
    return this.searchBooks(`isbn:${isbn}`);
  }

  // タイトルと著者で検索
  async searchByTitleAndAuthor(title: string, author?: string): Promise<GoogleBooksResponse> {
    let query = `intitle:${title}`;
    if (author) {
      query += `+inauthor:${author}`;
    }
    return this.searchBooks(query);
  }

  // キャッシュをクリア
  clearCache(): void {
    this.cache.clear();
  }
}

// Google BooksのボリュームをアプリケーションのBook型に変換
export function convertGoogleBooksVolumeToBook(
  volume: GoogleBooksVolume,
  format: 'physical' | 'digital' = 'physical',
  platform?: string
): Omit<Book, 'id' | 'createdAt' | 'updatedAt'> {
  const volumeInfo = volume.volumeInfo;
  
  // ISBNを取得
  const isbn10 = volumeInfo.industryIdentifiers?.find(id => id.type === 'ISBN_10')?.identifier;
  const isbn13 = volumeInfo.industryIdentifiers?.find(id => id.type === 'ISBN_13')?.identifier;

  // サムネイル画像のURLを取得（優先順位: large > medium > thumbnail > smallThumbnail）
  const thumbnailUrl = volumeInfo.imageLinks?.large ||
                      volumeInfo.imageLinks?.medium ||
                      volumeInfo.imageLinks?.thumbnail ||
                      volumeInfo.imageLinks?.smallThumbnail;

  return {
    googleBooksId: volume.id,
    title: volumeInfo.title || '不明なタイトル',
    authors: volumeInfo.authors || ['不明な著者'],
    publisher: volumeInfo.publisher,
    publishedDate: volumeInfo.publishedDate,
    description: volumeInfo.description,
    thumbnailUrl: thumbnailUrl?.replace('http:', 'https:'), // HTTPSに変換
    pageCount: volumeInfo.pageCount,
    categories: volumeInfo.categories,
    format,
    platform: format === 'digital' ? platform : undefined,
    isbn10,
    isbn13,
  };
}

// シングルトンインスタンス
let googleBooksAPI: GoogleBooksAPI | null = null;

export function getGoogleBooksAPI(): GoogleBooksAPI {
  if (!googleBooksAPI) {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_BOOKS_API_KEY;
    if (!apiKey) {
      throw new Error('Google Books API key is not configured. Please set NEXT_PUBLIC_GOOGLE_BOOKS_API_KEY environment variable.');
    }
    googleBooksAPI = new GoogleBooksAPI(apiKey);
  }
  return googleBooksAPI;
}

// 検索クエリをサニタイズ
export function sanitizeSearchQuery(query: string): string {
  return query
    .trim()
    .replace(/[^\w\s\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g, '') // 日本語文字と英数字のみ許可
    .replace(/\s+/g, ' '); // 複数の空白を1つにまとめる
}

// 検索候補を生成
export function generateSearchSuggestions(query: string): string[] {
  const suggestions: string[] = [];
  const trimmedQuery = query.trim();
  
  if (trimmedQuery.length < 2) {
    return suggestions;
  }

  // 基本的な検索候補
  suggestions.push(trimmedQuery);
  
  // 著者名での検索候補
  if (trimmedQuery.includes(' ')) {
    const parts = trimmedQuery.split(' ');
    if (parts.length === 2) {
      suggestions.push(`inauthor:${parts[1]} intitle:${parts[0]}`);
      suggestions.push(`inauthor:${parts[0]} intitle:${parts[1]}`);
    }
  }

  // カテゴリでの検索
  const commonCategories = ['小説', '漫画', 'ビジネス', '技術書', '自己啓発', '歴史', '科学'];
  const matchedCategory = commonCategories.find(cat => 
    trimmedQuery.includes(cat)
  );
  if (matchedCategory) {
    suggestions.push(`subject:${matchedCategory}`);
  }

  return suggestions.slice(0, 5); // 最大5つまで
}