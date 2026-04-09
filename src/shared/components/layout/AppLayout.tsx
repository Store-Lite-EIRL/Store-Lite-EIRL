'use client';

import Navbar from '@/shared/components/navigation/Navbar';
import { CircularProgress } from '@/shared/components/ui/feedback/Progress';
import { useBusinessSession } from '@/shared/hooks/useBusinessSession';
import '@/styles/components/layout.css';
import '@/styles/components/navbar.css';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const NAVBAR_COLLAPSED_KEY = 'navbarCollapsed';

interface AppLayoutProps {
  children: React.ReactNode;
  showNavbarByDefault?: boolean;
  navbarPlanName?: string;
}

export default function AppLayout({
  children,
  showNavbarByDefault = false,
  navbarPlanName,
}: AppLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Business session management - only for detecting when session is killed from another tab
  const { sessionKilledFromOtherTab, resetSessionKilledFlag } = useBusinessSession();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(NAVBAR_COLLAPSED_KEY);
      if (stored === 'true') {
        setIsCollapsed(true);
      }
    }
  }, []);
  const [isGlobalLoading, setIsGlobalLoading] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsGlobalLoading(false);
  }, [pathname]);

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
  }, [urlSlug, pathname, router]);

  const toggleNavbar = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    localStorage.setItem(NAVBAR_COLLAPSED_KEY, String(next));
  };

  const showNavbar =
    showNavbarByDefault && pathname !== '/list-business' && !pathname?.startsWith('/auth');

  // If session was killed from another tab (user closed business there), redirect to list
  useEffect(() => {
    if (sessionKilledFromOtherTab && !pathname?.startsWith('/list-business')) {
      resetSessionKilledFlag();
      router.push('/list-business');
    }
  }, [sessionKilledFromOtherTab, pathname, router, resetSessionKilledFlag]);

  return (
    <>
      <div className={`layout ${isChatPage ? 'layout--chat' : ''}`}>
        {/*
        The "styles.xxx" was incorrect because it wasn't importing CSS modules.
        Using global classes that we will define in layout.css or equivalent.
      */}

        {/* Sidebar - Desktop Only (Navbar component is actually the sidebar) */}
        {showNavbar && (
          <Navbar isCollapsed={isCollapsed} onToggle={toggleNavbar} planName={navbarPlanName} />
        )}

        <div
          className={`content-wrapper ${isCollapsed || !showNavbar ? 'content-wrapper--collapsed' : ''}`}
        >
          <main className={`main-area ${isChatPage ? 'main-area--chat' : ''}`}>{children}</main>
        </div>

        {isGlobalLoading && (
          <div className="loadingOverlay">
            <CircularProgress />
            <p className="loadingText">Cargando...</p>
          </div>
        )}
      </div>
    </>
  );
}
