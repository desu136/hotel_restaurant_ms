import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default function proxy(request: NextRequest) {
  // Extract path
  const path = request.nextUrl.pathname;

  // For Release 0 Foundation: Define public paths
  const isPublicPath = path === '/login' || path === '/register';

  // Placeholder: Check for token in cookies (to be implemented with auth module)
  const token = request.cookies.get('token')?.value || '';

  // If trying to access a protected route without a token, redirect to login
  if (!isPublicPath && !token) {
    // In actual implementation, we will redirect. 
    // For now, since we have no pages, just let it pass or redirect to a conceptual login
    // return NextResponse.redirect(new URL('/login', request.url));
  }

  // Multi-tenant check: Add Tenant ID header for downstream requests
  const response = NextResponse.next();
  
  // Later we verify token and extract tenant info:
  // response.headers.set('x-tenant-id', decoded.tenantId);

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
