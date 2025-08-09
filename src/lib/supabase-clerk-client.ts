import { createClient } from '@supabase/supabase-js';
import { useAuth } from '@clerk/nextjs';

// Clerkネイティブ統合を使用したSupabaseクライアント（推奨方式）
export function createClerkSupabaseClient() {
  const { getToken } = useAuth();
  
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        // Clerkセッショントークンをauthorization headerに設定（推奨方式）
        fetch: async (url, options = {}) => {
          const clerkToken = await getToken();
          
          const headers = new Headers(options?.headers);
          if (clerkToken) {
            headers.set('Authorization', `Bearer ${clerkToken}`);
          }
          
          return fetch(url, {
            ...options,
            headers,
          });
        },
      },
    }
  );
}

// React Hook用のカスタムクライアント
export function useClerkSupabaseClient() {
  const { getToken } = useAuth();
  
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        fetch: async (url, options = {}) => {
          const clerkToken = await getToken();
          
          const headers = new Headers(options?.headers);
          if (clerkToken) {
            headers.set('Authorization', `Bearer ${clerkToken}`);
          }
          
          return fetch(url, {
            ...options,
            headers,
          });
        },
      },
    }
  );
}

// サーバーサイド用のSupabaseクライアント（Next.js App Router対応）
export function createClerkSupabaseClientSSR(clerkToken: string | null) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        fetch: async (url, options = {}) => {
          const headers = new Headers(options?.headers);
          if (clerkToken) {
            headers.set('Authorization', `Bearer ${clerkToken}`);
          }
          
          return fetch(url, {
            ...options,
            headers,
          });
        },
      },
    }
  );
}