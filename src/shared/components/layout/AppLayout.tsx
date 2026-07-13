'use client';

import { clearBusinessSessionData, useBusinessSession } from '@/hooks/useBusinessSession';
import Navbar from '@/shared/components/navigation/Navbar';
import { CircularProgress } from '@/shared/components/ui/feedback/Progress';
import '@/styles/components/layout.css';
import '@/styles/components/navbar.css';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const NAVBAR_COLLAPSED_KEY = 'navbarCollapsed';

interface AppLayoutProps {
  children: React.ReactNode;
  showNavbarByDefault?: boolean;
  navbarPlanName?: string;
  navbarBusinessId?: string;
}

export default function AppLayout({
  children,
  showNavbarByDefault = false,
  navbarPlanName,
  navbarBusinessId,
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
  const router = useRouter();

  useEffect(() => {
    setIsGlobalLoading(false);
  }, [pathname]);

  const isChatPage = pathname?.includes('/chat') || pathname?.endsWith('/chat');

  // Fresh auth cleanup (defense layers B + D): when auth callback redirects with ?fresh_auth=true
  useEffect(() => {
    if (pathname === '/list-business' && typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.has('fresh_auth')) {
        clearBusinessSessionData();
        // Clean the URL param without full reload
        window.history.replaceState({}, '', '/list-business');
      }
    }
  }, [pathname]);

  const toggleNavbar = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    localStorage.setItem(NAVBAR_COLLAPSED_KEY, String(next));
  };

  const showNavbar =
    showNavbarByDefault && pathname !== '/list-business' && !pathname?.startsWith('/auth');

  const getContentWrapperClass = () => {
    if (!showNavbar) return 'content-wrapper--hidden';
    return isCollapsed ? 'content-wrapper--collapsed' : 'content-wrapper--expanded';
  };
  const contentWrapperClass = getContentWrapperClass();

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
          <Navbar
            isCollapsed={isCollapsed}
            onToggle={toggleNavbar}
            planName={navbarPlanName}
            businessId={navbarBusinessId}
          />
        )}

        <div className={`content-wrapper ${contentWrapperClass}`}>
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
