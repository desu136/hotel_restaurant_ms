import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './lib/auth';

export default async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Define public paths that don't require authentication
  const isPublicPath = path === '/' || path === '/login' || path === '/register' || path === '/home' || path === '/orders' || path.startsWith('/menu');
  
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
      let redirectPath = '/dashboard';
      if (payload.roles.includes('SUPER_ADMIN')) {
        redirectPath = '/tenants';
      } else if (payload.roles.includes('CHEF')) {
        redirectPath = '/dashboard/kitchen';
      } else if (payload.roles.includes('WAITER')) {
        redirectPath = '/dashboard/waiter';
      } else if (payload.roles.includes('CASHIER')) {
        redirectPath = '/dashboard/cashier';
      }
      return NextResponse.redirect(new URL(redirectPath, request.url));
    }

    // Role-based access control for Super Admin routes
    if (isSuperAdminPath && !payload.roles.includes('SUPER_ADMIN')) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Role-based access control for Tenant routes
    const isChef = payload.roles.includes('CHEF');
    const isWaiter = payload.roles.includes('WAITER');
    const isCashier = payload.roles.includes('CASHIER');
    const isOwner = payload.roles.includes('HOTEL_OWNER');
    const isManager = payload.roles.some(r => ['HOTEL_MANAGER', 'RESTAURANT_MANAGER'].includes(r));

    if (path === '/dashboard') {
      if (!isOwner) {
        if (isManager) return NextResponse.redirect(new URL('/dashboard/manager/category', request.url));
        if (isChef) return NextResponse.redirect(new URL('/dashboard/kitchen', request.url));
        if (isWaiter) return NextResponse.redirect(new URL('/dashboard/waiter', request.url));
        if (isCashier) return NextResponse.redirect(new URL('/dashboard/cashier', request.url));
        return NextResponse.redirect(new URL('/dashboard/waiter', request.url));
      }
    }

    const isManagementPath = path.startsWith('/dashboard/branches') ||
                             path.startsWith('/dashboard/employees') ||
                             path.startsWith('/dashboard/roles');

    if (isManagementPath && !isOwner) {
      let redirectPath = '/dashboard/waiter';
      if (isManager) redirectPath = '/dashboard/manager/category';
      else if (isChef) redirectPath = '/dashboard/kitchen';
      else if (isCashier) redirectPath = '/dashboard/cashier';
      return NextResponse.redirect(new URL(redirectPath, request.url));
    }

    // Add useful headers for downstream requests
    const response = NextResponse.next();
    response.headers.set('x-user-id', payload.userId);
    if (payload.tenantId) {
      response.headers.set('x-tenant-id', payload.tenantId);
    }
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
