import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// 認証が必要なルートを定義
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/books(.*)',
  '/profile(.*)'
])

// 公開ルート（認証不要）を定義
const isPublicRoute = createRouteMatcher([
  '/',
  '/auth/sign-in',
  '/auth/sign-up',
  '/auth/callback',
  '/terms',
  '/privacy'
])

export default clerkMiddleware((auth, req) => {
  // 保護されたルートでは認証を必須にする
  if (isProtectedRoute(req)) {
    auth.protect()
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}