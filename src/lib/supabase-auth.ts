import { useUser, useAuth } from '@clerk/nextjs';
import { useClerkSupabaseClient } from './supabase-clerk-client';
import { useEffect } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';

// Clerk認証済みSupabaseクライアントを取得
export function getAuthenticatedSupabaseClient(): SupabaseClient | null {
  try {
    // useClerkSupabaseClientはReact Hookなのでコンポーネント内でのみ使用可能
    return useClerkSupabaseClient();
  } catch (error) {
    console.error('Supabaseクライアントの取得に失敗:', error);
    return null;
  }
}

// Clerk認証状態とSupabaseクライアントを提供するHook
export function useSupabaseAuth() {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const supabaseClient = useClerkSupabaseClient();

  useEffect(() => {
    const testAuth = async () => {
      if (isLoaded && user) {
        try {
          console.log('Clerk認証ユーザー:', user.id);
          
          // Clerkトークンの取得をテスト
          const token = await getToken();
          if (token) {
            console.log('Clerkトークン取得成功 - Supabase RLS有効');
          } else {
            console.warn('Clerkトークンが取得できません - Clerk認証を確認してください');
          }
        } catch (error) {
          console.error('Clerk認証テストに失敗:', error);
        }
      } else if (isLoaded && !user) {
        console.log('ユーザーがログアウトしました');
      }
    };

    testAuth();
  }, [user, isLoaded, getToken]);

  return { 
    user, 
    isLoaded, 
    supabaseClient,
    isAuthenticated: isLoaded && !!user
  };
}

// Clerk認証のテスト関数
export async function testClerkAuth(supabaseClient: SupabaseClient, userId: string): Promise<boolean> {
  try {
    // 簡単なクエリでRLSをテスト
    const { data, error } = await supabaseClient
      .from('books')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('Clerk認証テスト失敗:', error);
      return false;
    }
    
    console.log('Clerk認証テスト成功 - RLS有効');
    return true;
  } catch (error) {
    console.error('Clerk認証テストでエラー:', error);
    return false;
  }
}

// ユーザーの初期設定を作成（認証済みクライアント使用）
export async function createUserPreferences(
  supabaseClient: SupabaseClient,
  userId: string, 
  preferences?: {
    defaultFormat?: 'physical' | 'digital';
    defaultPlatform?: string;
    autoSuggestDuplicates?: boolean;
    notifyNewBooks?: boolean;
  }
) {
  const defaultPreferences = {
    user_id: userId,
    default_format: preferences?.defaultFormat || 'physical',
    default_platform: preferences?.defaultPlatform,
    auto_suggest_duplicates: preferences?.autoSuggestDuplicates ?? true,
    notify_new_books: preferences?.notifyNewBooks ?? false,
  };

  const { data, error } = await supabaseClient
    .from('user_preferences')
    .upsert(defaultPreferences, { onConflict: 'user_id' })
    .select()
    .single();

  if (error) {
    console.error('ユーザー設定の作成に失敗:', error);
    throw error;
  }

  return data;
}

// ユーザーの設定を取得（認証済みクライアント使用）
export async function getUserPreferences(supabaseClient: SupabaseClient, userId: string) {
  const { data, error } = await supabaseClient
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code === 'PGRST116') {
    // 設定が存在しない場合はデフォルト設定を作成
    return await createUserPreferences(supabaseClient, userId);
  } else if (error) {
    console.error('ユーザー設定の取得に失敗:', error);
    throw error;
  }

  return data;
}

// ユーザー設定を更新（認証済みクライアント使用）
export async function updateUserPreferences(
  supabaseClient: SupabaseClient,
  userId: string, 
  updates: {
    defaultFormat?: 'physical' | 'digital';
    defaultPlatform?: string;
    autoSuggestDuplicates?: boolean;
    notifyNewBooks?: boolean;
  }
) {
  const updateData = {
    default_format: updates.defaultFormat,
    default_platform: updates.defaultPlatform,
    auto_suggest_duplicates: updates.autoSuggestDuplicates,
    notify_new_books: updates.notifyNewBooks,
  };

  // undefinedのプロパティを除去
  const cleanedData = Object.fromEntries(
    Object.entries(updateData).filter(([_, value]) => value !== undefined)
  );

  const { data, error } = await supabaseClient
    .from('user_preferences')
    .update(cleanedData)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('ユーザー設定の更新に失敗:', error);
    throw error;
  }

  return data;
}