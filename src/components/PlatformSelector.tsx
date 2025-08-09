'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Check,
  Smartphone,
  BookOpen,
  Star
} from 'lucide-react';

interface Platform {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  isPopular?: boolean;
  marketShare?: number;
}

interface PlatformSelectorProps {
  selectedFormat: 'physical' | 'digital' | '';
  selectedPlatform?: string;
  onFormatChange: (format: 'physical' | 'digital') => void;
  onPlatformChange: (platform: string) => void;
  className?: string;
  showPopularFirst?: boolean;
}

const platforms: Platform[] = [
  {
    id: 'kindle',
    name: 'Kindle',
    icon: '📚',
    color: 'bg-orange-500',
    description: 'Amazon Kindle',
    isPopular: true,
    marketShare: 65
  },
  {
    id: 'kobo',
    name: 'Kobo',
    icon: '📖',
    color: 'bg-blue-500',
    description: '楽天Kobo',
    isPopular: true,
    marketShare: 15
  },
  {
    id: 'booklive',
    name: 'BookLive!',
    icon: '📱',
    color: 'bg-green-500',
    description: 'BookLive!',
    isPopular: true,
    marketShare: 8
  },
  {
    id: 'bookwalker',
    name: 'BookWalker',
    icon: '🚶',
    color: 'bg-purple-500',
    description: 'BOOK☆WALKER',
    marketShare: 5
  },
  {
    id: 'ebookjapan',
    name: 'ebookjapan',
    icon: '🇯🇵',
    color: 'bg-red-500',
    description: 'ebookjapan',
    marketShare: 7
  }
];

export function PlatformSelector({
  selectedFormat,
  selectedPlatform,
  onFormatChange,
  onPlatformChange,
  className = "",
  showPopularFirst = true
}: PlatformSelectorProps) {
  const [showAllPlatforms, setShowAllPlatforms] = useState(false);

  // プラットフォームをソート（人気順 or アルファベット順）
  const sortedPlatforms = showPopularFirst 
    ? [...platforms].sort((a, b) => {
        if (a.isPopular && !b.isPopular) return -1;
        if (!a.isPopular && b.isPopular) return 1;
        return (b.marketShare || 0) - (a.marketShare || 0);
      })
    : platforms;

  const popularPlatforms = sortedPlatforms.filter(p => p.isPopular);
  const otherPlatforms = sortedPlatforms.filter(p => !p.isPopular);

  const displayPlatforms = showAllPlatforms ? sortedPlatforms : popularPlatforms;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* フォーマット選択 */}
      <div>
        <h3 className="text-lg font-semibold text-[color:var(--text-primary)] mb-4">
          本の形式を選択
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {/* 物理本 */}
          <Card 
            className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
              selectedFormat === 'physical' 
                ? 'ring-2 ring-[color:var(--primary)] bg-[color:var(--primary)]/5' 
                : 'hover:bg-gray-50'
            }`}
            onClick={() => onFormatChange('physical')}
          >
            <CardContent className="p-6 text-center">
              <div className="flex flex-col items-center space-y-3">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                  selectedFormat === 'physical' 
                    ? 'bg-[color:var(--primary)] text-white' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  <BookOpen className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="font-semibold text-[color:var(--text-primary)] mb-1">
                    物理本
                  </h4>
                  <p className="text-sm text-[color:var(--text-secondary)]">
                    紙の本・書籍
                  </p>
                </div>
                {selectedFormat === 'physical' && (
                  <Check className="w-6 h-6 text-[color:var(--primary)]" />
                )}
              </div>
            </CardContent>
          </Card>

          {/* 電子書籍 */}
          <Card 
            className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
              selectedFormat === 'digital' 
                ? 'ring-2 ring-[color:var(--primary)] bg-[color:var(--primary)]/5' 
                : 'hover:bg-gray-50'
            }`}
            onClick={() => onFormatChange('digital')}
          >
            <CardContent className="p-6 text-center">
              <div className="flex flex-col items-center space-y-3">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                  selectedFormat === 'digital' 
                    ? 'bg-[color:var(--primary)] text-white' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  <Smartphone className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="font-semibold text-[color:var(--text-primary)] mb-1">
                    電子書籍
                  </h4>
                  <p className="text-sm text-[color:var(--text-secondary)]">
                    デジタル版
                  </p>
                </div>
                {selectedFormat === 'digital' && (
                  <Check className="w-6 h-6 text-[color:var(--primary)]" />
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* プラットフォーム選択（電子書籍の場合のみ表示） */}
      {selectedFormat === 'digital' && (
        <div className="animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-[color:var(--text-primary)]">
              購入プラットフォーム
            </h3>
            {showPopularFirst && (
              <Badge variant="secondary" className="text-xs">
                <Star className="w-3 h-3 mr-1" />
                人気順
              </Badge>
            )}
          </div>

          {/* プラットフォームリスト */}
          <div className="space-y-3">
            {displayPlatforms.map((platform) => (
              <Card
                key={platform.id}
                className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                  selectedPlatform === platform.id
                    ? 'ring-2 ring-[color:var(--primary)] bg-[color:var(--primary)]/5'
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => onPlatformChange(platform.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center space-x-4">
                    {/* アイコン */}
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-white text-xl ${platform.color}`}>
                      {platform.icon}
                    </div>

                    {/* プラットフォーム情報 */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-semibold text-[color:var(--text-primary)]">
                          {platform.name}
                        </h4>
                        {platform.isPopular && (
                          <Badge variant="secondary" className="text-xs">
                            <Star className="w-3 h-3 mr-1" />
                            人気
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-[color:var(--text-secondary)] mt-1">
                        {platform.description}
                      </p>
                      {platform.marketShare && (
                        <p className="text-xs text-[color:var(--text-muted)] mt-1">
                          シェア約{platform.marketShare}%
                        </p>
                      )}
                    </div>

                    {/* 選択状態 */}
                    {selectedPlatform === platform.id && (
                      <div className="w-8 h-8 rounded-full bg-[color:var(--primary)] flex items-center justify-center">
                        <Check className="w-5 h-5 text-white" />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* その他のプラットフォームを表示するボタン */}
          {!showAllPlatforms && otherPlatforms.length > 0 && (
            <div className="mt-4 text-center">
              <Button
                variant="outline"
                onClick={() => setShowAllPlatforms(true)}
                className="text-[color:var(--primary)] border-[color:var(--primary)] hover:bg-[color:var(--primary)]/5"
              >
                その他のプラットフォームを表示 ({otherPlatforms.length}個)
              </Button>
            </div>
          )}

          {/* プラットフォーム選択のヒント */}
          {!selectedPlatform && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">?</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-900 mb-1">
                      どこで購入したか覚えていませんか？
                    </p>
                    <p className="text-xs text-blue-700">
                      よく使うプラットフォームを選んでおくと、後で変更できます。
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}