'use client';

import { useAuth } from '@/features/auth';
import Navbar from '@/shared/components/navigation/Navbar';
import { CircularProgress } from '@/shared/components/ui/feedback/Progress';
import '@/styles/components/layout.css';
import '@/styles/components/navbar.css';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const NAVBAR_COLLAPSED_KEY = 'navbarCollapsed';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(NAVBAR_COLLAPSED_KEY);
      if (stored === 'true') {
        setIsCollapsed(true);
      }
    }
  }, []);
  const [isGlobalLoading, setIsGlobalLoading] = useState(false);

  const { signOut, session } = useAuth();
  const pathname = usePathname();
  const [prevPath, setPrevPath] = useState(pathname);

  if (pathname !== prevPath) {
    setPrevPath(pathname);
    setIsGlobalLoading(false);
  }

  const router = useRouter();
  const params = useParams();
  const urlSlug = params?.slug as string;

  const isChatPage = pathname?.includes('/chat') || pathname?.endsWith('/chat');

  useEffect(() => {
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

    if (pathname === '/list-business' && activeSessionSlug) {
      router.push(`/${activeSessionSlug}`);
      return;
    }

    if (isPublicPath) {
      return;
    }

    const isOwner = activeSessionSlug === urlSlug;
    const isAdminPath = pathname.includes('/storage') || pathname.includes('/settings');

    if (urlSlug && isAdminPath) {
      if (!isOwner) {
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
  };

  return (
    <div className={`layout ${isChatPage ? 'layout--chat' : ''}`}>
      {/*
        The "styles.xxx" was incorrect because it wasn't importing CSS modules.
        Using global classes that we will define in layout.css or equivalent.
      */}

      {/* Sidebar - Desktop Only (Navbar component is actually the sidebar) */}
      {session && (
        <Navbar
          isCollapsed={isCollapsed}
          onToggle={toggleNavbar}
          onLogout={handleLogout}
          onCloseStore={handleCloseStore}
        />
      )}

      <div className={`content-wrapper ${isCollapsed ? 'content-wrapper--collapsed' : ''}`}>
        <main className={`main-area ${isChatPage ? 'main-area--chat' : ''}`}>{children}</main>
      </div>

      {isGlobalLoading && (
        <div className="loadingOverlay">
          <CircularProgress />
          <p className="loadingText">Cargando...</p>
        </div>
      )}
    </div>
  );
}
