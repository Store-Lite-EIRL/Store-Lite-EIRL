'use client';

import { useAuth } from '@/features/auth';
import { Navbar } from '@/shared/components/navigation';
import { CircularProgress } from '@/shared/components/ui/feedback/Progress';
import '@/styles/components/layout.css';
import '@/styles/components/navbar.css';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const NAVBAR_COLLAPSED_KEY = 'navbarCollapsed';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isGlobalLoading, setIsGlobalLoading] = useState(false);

  // Restore navbar state from localStorage (client-side only)
  useEffect(() => {
    const stored = localStorage.getItem(NAVBAR_COLLAPSED_KEY);
    if (stored !== null) {
      setIsCollapsed(stored === 'true');
    }
  }, []);
  const { user, signOut } = useAuth();
  const pathname = usePathname();
  const [prevPath, setPrevPath] = useState(pathname);

  if (pathname !== prevPath) {
    setPrevPath(pathname);
    setIsGlobalLoading(false);
  }
  const router = useRouter();
  const params = useParams();
  const urlSlug = params?.slug as string;

  useEffect(() => {
    // Helper to get cookie value by name - Hardened against non-literal RegExp lint
    const getCookie = (name: string) => {
      if (typeof document === 'undefined') {
        return undefined;
      }
      const cookiesArr = document.cookie.split('; ');
      const cookie = cookiesArr.find((row) => row.startsWith(`${name}=`));
      return cookie ? cookie.split('=')[1] : undefined;
    };

    const selectedSlug = localStorage.getItem('selectedBusinessSlug');
    const cookieSlug = getCookie('selected_business_slug');
    const activeSessionSlug = cookieSlug || selectedSlug;

    const isPublicPath =
      pathname === '/list-business' || pathname === '/created' || pathname.startsWith('/auth');

    // 1. If on /list-business but have an active session, force back to store
    if (pathname === '/list-business' && activeSessionSlug) {
      router.push(`/${activeSessionSlug}`);
      return;
    }

    if (isPublicPath) {
      return;
    }

    // 2. Perspective Detection:
    // If we are on a business route (urlSlug exists), we only restrict if user is trying to access ADMIN paths (storage, settings).
    const isOwner = activeSessionSlug === urlSlug;
    const isAdminPath = pathname.includes('/storage') || pathname.includes('/settings');

    if (urlSlug && isAdminPath) {
      if (!isOwner) {
        // Trying to access admin area of a store they don't own: redirect to public view
        router.push(`/${urlSlug}`);
      }
    }
  }, [urlSlug, pathname, router]);

  const toggleNavbar = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    localStorage.setItem(NAVBAR_COLLAPSED_KEY, String(next));
  };

  const handleLogout = async () => {
    setIsGlobalLoading(true);
    try {
      await signOut();
      // Clear business session on user logout
      document.cookie = 'selected_business_slug=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      localStorage.removeItem('selectedBusinessSlug');
      router.push('/auth');
    } catch (error) {
      console.error('Error signing out:', error);
      setIsGlobalLoading(false);
    }
  };

  const handleCloseStore = () => {
    setIsGlobalLoading(true);
    document.cookie = 'selected_business_slug=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    localStorage.removeItem('selectedBusinessSlug');
    router.push('/list-business');
    // We don't need to set isGlobalLoading(false) here because the navigation will unmount the layout or trigger a re-render
  };

  const isOwner =
    user &&
    params?.slug &&
    params.slug ===
      (typeof document !== 'undefined'
        ? document.cookie
            .split('; ')
            .find((row) => row.startsWith('selected_business_slug='))
            ?.split('=')[1]
        : undefined);

  const showNavbar =
    !!user &&
    !pathname.startsWith('/auth') &&
    pathname !== '/list-business' &&
    pathname !== '/created';

  /* Logic for content margin */
  let contentMargin = '0';
  if (showNavbar) {
    const baseWidth = isCollapsed
      ? 'var(--navbar-width, 80px)'
      : 'var(--navbar-expanded-width, 250px)';

    // Total margin = navbar width + float margin (left) + extra gap
    contentMargin = `calc(${baseWidth} + var(--navbar-float-margin) * 1.5)`;
  }

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {showNavbar && (
        <Navbar
          onLogout={handleLogout}
          onCloseStore={handleCloseStore}
          isCollapsed={isCollapsed}
          onToggle={toggleNavbar}
        />
      )}

      <main
        className="main-content"
        style={{
          marginLeft: contentMargin,
          flex: 1,
          padding: '.8rem',
          transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          overflowY: 'auto',
          height: '100%',
          width: '100%',
        }}
      >
        {children}
      </main>

      {isGlobalLoading && (
        <div className="loadingOverlay">
          <CircularProgress indeterminate fourColor />
          <p className="loadingText">Cerrando tienda...</p>
        </div>
      )}
    </div>
  );
}
