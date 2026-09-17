import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './lib/auth';
import { cookiePath, withBasePath } from './lib/base-path';

function redirectTo(path: string, request: NextRequest) {
  return NextResponse.redirect(new URL(withBasePath(path), request.url));
}

export default async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Define public paths that don't require authentication
  const isPublicPath = path === '/' || path === '/login' || path === '/register' || path === '/forgot-password' || path === '/home' || path === '/orders' || path.startsWith('/menu');
  
  // Define Super Admin specific paths
  const isSuperAdminPath = path.startsWith('/tenants') || path.startsWith('/subscriptions');

  const token = request.cookies.get('token')?.value || '';

  // If there's no token and it's not a public path, redirect to login
  if (!isPublicPath && !token) {
    return redirectTo('/login', request);
  }

  // If there is a token, verify it
  if (token) {
    const payload = await verifyToken(token);
    
    // If token is invalid/expired, clear it and redirect to login
    if (!payload) {
      const response = redirectTo('/login', request);
      response.cookies.set('token', '', { path: cookiePath(), maxAge: 0 });
      return response;
    }

    // Prevent authenticated users from accessing login/register page again
    if (path === '/login' || path === '/register' || path === '/forgot-password') {
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
      return redirectTo(redirectPath, request);
    }

    // Role-based access control for Super Admin routes
    if (isSuperAdminPath && !payload.roles.includes('SUPER_ADMIN')) {
      return redirectTo('/dashboard', request);
    }

    // Role-based access control for Tenant routes
    const isChef = payload.roles.includes('CHEF');
    const isWaiter = payload.roles.includes('WAITER');
    const isCashier = payload.roles.includes('CASHIER');
    const isOwner = payload.roles.includes('HOTEL_OWNER');
    const isManager = payload.roles.some(r => ['HOTEL_MANAGER', 'RESTAURANT_MANAGER'].includes(r));

    if (path === '/dashboard') {
      if (!isOwner) {
        if (isManager) return redirectTo('/dashboard/manager/category', request);
        if (isChef) return redirectTo('/dashboard/kitchen', request);
        if (isWaiter) return redirectTo('/dashboard/waiter', request);
        if (isCashier) return redirectTo('/dashboard/cashier', request);
        return redirectTo('/dashboard/waiter', request);
      }
    }

    const isManagementPath = path.startsWith('/dashboard/branches') ||
                             path.startsWith('/dashboard/manager/branches') ||
                             path.startsWith('/dashboard/restaurants') ||
                             path.startsWith('/dashboard/employees') ||
                             path.startsWith('/dashboard/roles');

    if (isManagementPath && !isOwner) {
      let redirectPath = '/dashboard/waiter';
      if (isManager) redirectPath = '/dashboard/manager/category';
      else if (isChef) redirectPath = '/dashboard/kitchen';
      else if (isCashier) redirectPath = '/dashboard/cashier';
      return redirectTo(redirectPath, request);
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
    '/((?!api|_next/static|_next/image|favicon.ico|icon.png|apple-icon.png|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)).*)',
  ],
};
