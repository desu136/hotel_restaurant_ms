// Next.js MiniApp SDK Bridge Utility

export interface MiniAppUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface MiniAppLocation {
  latitude: number;
  longitude: number;
}

// Helper to check if running inside the Echat Host App WebView
export function isRunningInHostApp(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(
    (window as any).flutter_inappwebview ||
    (window as any).MiniAppBridge ||
    (window as any).MiniApp
  );
}

// Get User Profile from SDK bridge or URL parameters or LocalStorage fallback
export async function getUserProfile(): Promise<MiniAppUser | null> {
  if (typeof window === 'undefined') return null;

  // 1. Try SDK Bridge
  const MiniApp = (window as any).MiniApp;
  if (MiniApp && MiniApp.auth && typeof MiniApp.auth.getProfile === 'function') {
    try {
      const profile = await MiniApp.auth.getProfile();
      if (profile) {
        return {
          id: profile.id || profile.userId,
          name: profile.displayName || profile.name,
          email: profile.email || '',
          avatar: profile.avatarUrl || profile.avatar || '',
        };
      }
    } catch (e) {
      console.warn("Failed to get profile from SDK bridge:", e);
    }
  }

  // 2. Try URL Search Params fallback
  const urlParams = new URLSearchParams(window.location.search);
  const paramId = urlParams.get('userId');
  const paramName = urlParams.get('userName');
  if (paramId && paramName) {
    const user = {
      id: paramId,
      name: paramName,
      email: urlParams.get('userEmail') || '',
      avatar: urlParams.get('userAvatar') || '',
    };
    // Cache in localStorage
    localStorage.setItem('miniapp_cached_user', JSON.stringify(user));
    return user;
  }

  // 3. Try LocalStorage cached/mock fallback (for browser/standalone dev mode)
  const cached = localStorage.getItem('miniapp_cached_user');
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {
      // ignore
    }
  }

  // Default fallback mock user for standalone desktop testing
  return {
    id: 'guest_user_123',
    name: 'Guest Customer',
    email: 'guest@example.com'
  };
}

// Get GPS location from SDK bridge or URL parameters or browser geolocation API
export async function getUserLocation(): Promise<MiniAppLocation | null> {
  if (typeof window === 'undefined') return null;

  // 1. Try SDK Bridge
  const MiniApp = (window as any).MiniApp;
  if (
    MiniApp &&
    MiniApp.device &&
    MiniApp.device.location &&
    typeof MiniApp.device.location.getCurrentPosition === 'function'
  ) {
    try {
      const locationData = await MiniApp.device.location.getCurrentPosition();
      if (locationData && locationData.coords) {
        return {
          latitude: locationData.coords.latitude,
          longitude: locationData.coords.longitude,
        };
      }
    } catch (e) {
      console.warn("Failed to get location from SDK bridge:", e);
    }
  }

  // 2. Try URL Search Params fallback
  const urlParams = new URLSearchParams(window.location.search);
  const paramLat = urlParams.get('lat');
  const paramLng = urlParams.get('lng');
  if (paramLat && paramLng) {
    return {
      latitude: parseFloat(paramLat),
      longitude: parseFloat(paramLng),
    };
  }

  // 3. Try browser geolocation API
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        console.warn("Browser geolocation failed:", error);
        resolve(null);
      },
      { timeout: 5000 }
    );
  });
}

// Get/Set Preferred Restaurant Branch
export async function getPreferredRestaurantId(): Promise<string | null> {
  if (typeof window === 'undefined') return null;

  const MiniApp = (window as any).MiniApp;
  if (MiniApp && MiniApp.storage && typeof MiniApp.storage.getItem === 'function') {
    try {
      const val = await MiniApp.storage.getItem('preferredRestaurantId');
      if (val) return val;
    } catch (e) {
      console.warn("Failed to get storage from SDK bridge:", e);
    }
  }

  return localStorage.getItem('miniapp_preferred_restaurant_id');
}

export async function setPreferredRestaurantId(restaurantId: string): Promise<void> {
  if (typeof window === 'undefined') return;

  const MiniApp = (window as any).MiniApp;
  if (MiniApp && MiniApp.storage && typeof MiniApp.storage.setItem === 'function') {
    try {
      await MiniApp.storage.setItem('preferredRestaurantId', restaurantId);
      return;
    } catch (e) {
      console.warn("Failed to set storage in SDK bridge:", e);
    }
  }

  localStorage.setItem('miniapp_preferred_restaurant_id', restaurantId);
}
