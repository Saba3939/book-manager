'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Search, X, Mic, History, Filter } from 'lucide-react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  onFilter?: (filter: string) => void;
  placeholder?: string;
  defaultValue?: string;
  showVoiceInput?: boolean;
  showFilters?: boolean;
  isLoading?: boolean;
  className?: string;
}

// クイックフィルターの定義
const quickFilters = [
  { id: 'all', label: 'すべて', icon: '📚' },
  { id: 'owned', label: '所有済み', icon: '✅' },
  { id: 'physical', label: '物理本', icon: '📗' },
  { id: 'digital', label: '電子書籍', icon: '📱' },
  { id: 'fiction', label: '小説', icon: '📖' },
  { id: 'manga', label: '漫画', icon: '🎭' },
  { id: 'business', label: 'ビジネス', icon: '💼' },
  { id: 'tech', label: '技術書', icon: '💻' },
];

export function SearchBar({
  onSearch,
  onFilter,
  placeholder = "本のタイトルや著者名で検索...",
  defaultValue = "",
  showVoiceInput = false,
  showFilters = false,
  isLoading = false,
  className = ""
}: SearchBarProps) {
  const [query, setQuery] = useState(defaultValue);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // 検索履歴をローカルストレージから読み込み
  useEffect(() => {
    const savedHistory = localStorage.getItem('book-search-history');
    if (savedHistory) {
      try {
        setSearchHistory(JSON.parse(savedHistory));
      } catch (error) {
        console.error('Failed to parse search history:', error);
      }
    }
  }, []);

  // クエリに基づいて検索候補を生成
  useEffect(() => {
    if (query.trim().length > 1) {
      const trimmedQuery = query.trim().toLowerCase();
      const historySuggestions = searchHistory
        .filter(item => item.toLowerCase().includes(trimmedQuery))
        .slice(0, 3);

      // 基本的な検索候補を生成
      const basicSuggestions = [];
      if (trimmedQuery.includes(' ')) {
        const parts = trimmedQuery.split(' ');
        if (parts.length === 2) {
          basicSuggestions.push(`"${parts.join(' ')}"`); // 完全一致
          basicSuggestions.push(`著者: ${parts[0]} タイトル: ${parts[1]}`);
          basicSuggestions.push(`著者: ${parts[1]} タイトル: ${parts[0]}`);
        }
      }

      const allSuggestions = [
        ...new Set([...historySuggestions, ...basicSuggestions])
      ].slice(0, 5);

      setSuggestions(allSuggestions);
    } else {
      setSuggestions([]);
    }
  }, [query, searchHistory]);

  // 検索実行
  const handleSearch = (searchQuery: string = query) => {
    if (!searchQuery.trim()) return;

    const trimmedQuery = searchQuery.trim();
    
    // 検索履歴を更新
    const newHistory = [trimmedQuery, ...searchHistory.filter(item => item !== trimmedQuery)].slice(0, 10);
    setSearchHistory(newHistory);
    localStorage.setItem('book-search-history', JSON.stringify(newHistory));
    
    // 検索実行
    onSearch(trimmedQuery);
    setShowSuggestions(false);
    
    // モバイルでのキーボードを隠す
    if (inputRef.current) {
      inputRef.current.blur();
    }
  };

  // フィルター変更
  const handleFilterChange = (filterId: string) => {
    setSelectedFilter(filterId);
    if (onFilter) {
      onFilter(filterId);
    }
  };

  // 音声入力（実装は簡素化）
  const handleVoiceInput = () => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.lang = 'ja-JP';
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setQuery(transcript);
        handleSearch(transcript);
      };
      recognition.start();
    } else {
      alert('音声入力はサポートされていません');
    }
  };

  // クリア
  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // 外部クリックで候補を閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`}>
      {/* メイン検索バー */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[color:var(--text-muted)] w-5 h-5" />
          
          <Input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearch();
              } else if (e.key === 'Escape') {
                setShowSuggestions(false);
              }
            }}
            onFocus={() => setShowSuggestions(true)}
            placeholder={placeholder}
            className={`
              pl-10 pr-20 !h-12 min-h-12 text-base 
              ${showSuggestions ? 'rounded-b-none !border-b-0' : ''}
            `}
            disabled={isLoading}
          />

          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
            {query && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="h-8 w-8 p-0 hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
            
            {showVoiceInput && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleVoiceInput}
                className="h-8 w-8 p-0 hover:bg-gray-100"
              >
                <Mic className="w-4 h-4" />
              </Button>
            )}
            
            <Button
              type="button"
              onClick={() => handleSearch()}
              size="sm"
              disabled={isLoading || !query.trim()}
              className="h-8 px-3 bg-[color:var(--primary)] hover:bg-[color:var(--primary-hover)] text-white"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                '検索'
              )}
            </Button>
          </div>
        </div>

        {/* 検索候補 */}
        {showSuggestions && (suggestions.length > 0 || searchHistory.length > 0) && (
          <Card 
            ref={suggestionsRef}
            className="absolute top-full left-0 right-0 z-50 mt-0 border-2 border-t-0 border-[color:var(--primary)] rounded-t-none shadow-lg"
          >
            <CardContent className="p-0">
              {/* 検索候補 */}
              {suggestions.length > 0 && (
                <div className="border-b border-gray-100 last:border-b-0">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setQuery(suggestion);
                        handleSearch(suggestion);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center space-x-3 transition-colors"
                    >
                      <Search className="w-4 h-4 text-[color:var(--text-muted)] flex-shrink-0" />
                      <span className="text-sm text-[color:var(--text-primary)] truncate">
                        {suggestion}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* 検索履歴 */}
              {searchHistory.length > 0 && query.trim().length <= 1 && (
                <div className=" border-b border-gray-100 last:border-b-0">
                  <div className="px-4 py-2 text-xs font-medium text-[color:var(--text-muted)] bg-gray-50 flex items-center">
                    <History className="w-3 h-3 mr-2" />
                    最近の検索
                  </div>
                  {searchHistory.slice(0, 5).map((item, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setQuery(item);
                        handleSearch(item);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center space-x-3 transition-colors"
                    >
                      <History className="w-4 h-4 text-[color:var(--text-muted)] flex-shrink-0" />
                      <span className="text-sm text-[color:var(--text-secondary)] truncate">
                        {item}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* クイックフィルター */}
      {showFilters && (
        <div className="flex items-center space-x-2 mt-4 overflow-x-auto pb-2">
          <div className="flex items-center space-x-1 text-sm text-[color:var(--text-muted)] whitespace-nowrap">
            <Filter className="w-4 h-4" />
            <span>フィルター:</span>
          </div>
          
          {quickFilters.map((filter) => (
            <Badge
              key={filter.id}
              variant={selectedFilter === filter.id ? "default" : "outline"}
              className={`
                cursor-pointer transition-all duration-200 whitespace-nowrap
                ${selectedFilter === filter.id 
                  ? 'bg-[color:var(--primary)] text-white' 
                  : 'hover:bg-gray-100'
                }
              `}
              onClick={() => handleFilterChange(filter.id)}
            >
              <span className="mr-1">{filter.icon}</span>
              {filter.label}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
