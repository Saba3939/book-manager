'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PlatformSelector } from '@/components/PlatformSelector';
import { 
  BookOpen,
  User,
  Calendar,
  Building,
  Hash,
  Save,
  ArrowLeft,
  AlertCircle
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface BookFormData {
  title: string;
  author: string;
  format: 'physical' | 'digital' | '';
  platform?: string;
  publishedYear?: string;
  publisher?: string;
  isbn?: string;
  description?: string;
  thumbnailUrl?: string;
  googleBooksId?: string;
}

interface BookFormProps {
  initialData?: Partial<BookFormData>;
  isEditing?: boolean;
  isLoading?: boolean;
  onSubmit: (data: BookFormData) => Promise<void> | void;
  onCancel?: () => void;
  className?: string;
}

export function BookForm({
  initialData = {},
  isEditing = false,
  isLoading = false,
  onSubmit,
  onCancel,
  className = ""
}: BookFormProps) {
  const [formData, setFormData] = useState<BookFormData>({
    title: '',
    author: '',
    format: '',
    platform: '',
    publishedYear: '',
    publisher: '',
    isbn: '',
    description: '',
    thumbnailUrl: '',
    googleBooksId: '',
    ...initialData
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showAdvanced, setShowAdvanced] = useState(false);

  // バリデーション
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'タイトルは必須です';
    }

    if (!formData.format) {
      newErrors.format = '本の形式を選択してください';
    }

    if (formData.format === 'digital' && !formData.platform) {
      newErrors.platform = '電子書籍のプラットフォームを選択してください';
    }

    if (formData.isbn && !isValidISBN(formData.isbn)) {
      newErrors.isbn = 'ISBN形式が正しくありません';
    }

    if (formData.publishedYear && (
      isNaN(Number(formData.publishedYear)) || 
      Number(formData.publishedYear) < 1000 || 
      Number(formData.publishedYear) > new Date().getFullYear()
    )) {
      newErrors.publishedYear = '正しい年を入力してください';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidISBN = (isbn: string): boolean => {
    const cleaned = isbn.replace(/[-\s]/g, '');
    return /^(97[89])?\d{10}$/.test(cleaned);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const handleInputChange = (field: keyof BookFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // エラーをクリア
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleFormatChange = (format: 'physical' | 'digital') => {
    setFormData(prev => ({ 
      ...prev, 
      format,
      platform: format === 'physical' ? '' : prev.platform 
    }));
    
    if (errors.format) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.format;
        return newErrors;
      });
    }
  };

  const handlePlatformChange = (platform: string) => {
    setFormData(prev => ({ ...prev, platform }));
    
    if (errors.platform) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.platform;
        return newErrors;
      });
    }
  };

  return (
    <div className={`max-w-2xl mx-auto ${className}`}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 基本情報 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-[color:var(--primary)]" />
              <span>基本情報</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* タイトル */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-[color:var(--text-primary)] font-medium">
                タイトル <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                type="text"
                placeholder="本のタイトルを入力"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className={errors.title ? 'border-red-500 focus:ring-red-500' : ''}
                disabled={isLoading}
              />
              {errors.title && (
                <p className="text-sm text-red-600 flex items-center space-x-1">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errors.title}</span>
                </p>
              )}
            </div>

            {/* 著者 */}
            <div className="space-y-2">
              <Label htmlFor="author" className="text-[color:var(--text-primary)] font-medium">
                著者
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[color:var(--text-muted)]" />
                <Input
                  id="author"
                  type="text"
                  placeholder="著者名を入力"
                  value={formData.author}
                  onChange={(e) => handleInputChange('author', e.target.value)}
                  className="pl-10"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* プラットフォーム選択 */}
            <PlatformSelector
              selectedFormat={formData.format}
              selectedPlatform={formData.platform}
              onFormatChange={handleFormatChange}
              onPlatformChange={handlePlatformChange}
            />

            {errors.format && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700">
                  {errors.format}
                </AlertDescription>
              </Alert>
            )}

            {errors.platform && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700">
                  {errors.platform}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* 詳細情報（オプション） */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-[color:var(--text-primary)]">
                詳細情報（オプション）
              </CardTitle>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-[color:var(--primary)]"
              >
                {showAdvanced ? '閉じる' : '詳細を入力'}
              </Button>
            </div>
          </CardHeader>

          {showAdvanced && (
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 出版年 */}
                <div className="space-y-2">
                  <Label htmlFor="publishedYear" className="text-[color:var(--text-primary)] font-medium">
                    出版年
                  </Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[color:var(--text-muted)]" />
                    <Input
                      id="publishedYear"
                      type="number"
                      placeholder="2024"
                      value={formData.publishedYear}
                      onChange={(e) => handleInputChange('publishedYear', e.target.value)}
                      className={`pl-10 ${errors.publishedYear ? 'border-red-500' : ''}`}
                      min="1000"
                      max={new Date().getFullYear()}
                      disabled={isLoading}
                    />
                  </div>
                  {errors.publishedYear && (
                    <p className="text-sm text-red-600">{errors.publishedYear}</p>
                  )}
                </div>

                {/* ISBN */}
                <div className="space-y-2">
                  <Label htmlFor="isbn" className="text-[color:var(--text-primary)] font-medium">
                    ISBN
                  </Label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[color:var(--text-muted)]" />
                    <Input
                      id="isbn"
                      type="text"
                      placeholder="978-4101010014"
                      value={formData.isbn}
                      onChange={(e) => handleInputChange('isbn', e.target.value)}
                      className={`pl-10 ${errors.isbn ? 'border-red-500' : ''}`}
                      disabled={isLoading}
                    />
                  </div>
                  {errors.isbn && (
                    <p className="text-sm text-red-600">{errors.isbn}</p>
                  )}
                </div>
              </div>

              {/* 出版社 */}
              <div className="space-y-2">
                <Label htmlFor="publisher" className="text-[color:var(--text-primary)] font-medium">
                  出版社
                </Label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[color:var(--text-muted)]" />
                  <Input
                    id="publisher"
                    type="text"
                    placeholder="出版社名"
                    value={formData.publisher}
                    onChange={(e) => handleInputChange('publisher', e.target.value)}
                    className="pl-10"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* 説明 */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-[color:var(--text-primary)] font-medium">
                  メモ・説明
                </Label>
                <Textarea
                  id="description"
                  placeholder="本についてのメモや説明を入力..."
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                  className="resize-none"
                  disabled={isLoading}
                />
              </div>
            </CardContent>
          )}
        </Card>

        {/* アクションボタン */}
        <div className="flex items-center justify-between pt-6 pb-8 sticky bottom-0 bg-white border-t border-gray-100 -mx-4 px-4 sm:mx-0 sm:px-0 sm:border-0 sm:bg-transparent sm:static">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>キャンセル</span>
          </Button>

          <Button
            type="submit"
            disabled={isLoading || !formData.title.trim() || !formData.format}
            className="flex items-center space-x-2 bg-[color:var(--primary)] hover:bg-[color:var(--primary-hover)] min-w-[120px]"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>{isEditing ? '更新中...' : '登録中...'}</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{isEditing ? '更新する' : '登録する'}</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}