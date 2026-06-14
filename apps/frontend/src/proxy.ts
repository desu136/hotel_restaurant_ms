import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './lib/auth';

export default async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Define public paths that don't require authentication
  const isPublicPath = path === '/' || path === '/login' || path === '/register';
  
  // Define Super Admin specific paths
  const isSuperAdminPath = path.startsWith('/tenants') || path.startsWith('/subscriptions');

  const token = request.cookies.get('token')?.value || '';

  // If there's no token and it's not a public path, redirect to login
  if (!isPublicPath && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If there is a token, verify it
  if (token) {
    const payload = await verifyToken(token);
    
    // If token is invalid/expired, clear it and redirect to login
    if (!payload) {
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('token');
      return response;
    }

    // Prevent authenticated users from accessing login/register page again
    if (path === '/login' || path === '/register') {
      const redirectPath = payload.roles.includes('SUPER_ADMIN') ? '/tenants' : '/dashboard';
      return NextResponse.redirect(new URL(redirectPath, request.url));
    }

    // Role-based access control for Super Admin routes
    if (isSuperAdminPath && !payload.roles.includes('SUPER_ADMIN')) {
      // Redirect unauthorized users to their dashboard
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Add useful headers for downstream requests
    const response = NextResponse.next();
    response.headers.set('x-user-id', payload.userId);
    response.headers.set('x-tenant-id', payload.tenantId);
    if (payload.branchId) {
      response.headers.set('x-branch-id', payload.branchId);
    }
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
