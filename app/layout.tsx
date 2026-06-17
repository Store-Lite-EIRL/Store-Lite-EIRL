import { AuthProvider } from '@/features/auth';
import { MaterialWebInit } from '@/lib/material-design/MaterialWebInit';
import { WebVitalsReporter } from '@/shared/components/WebVitalsReporter';
import { ThemeProvider } from '@/shared/context/ThemeContext';
import { CSPostHogProvider } from '@/shared/providers/PostHogProvider';
import type { Metadata } from 'next';
import { Google_Sans_Flex, Inter, Poppins, Roboto, Roboto_Mono } from 'next/font/google';
import './globals.css';

const google_sans_flex = Google_Sans_Flex({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-google-sans-flex',
});

const roboto_mono = Roboto_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-roboto-mono',
});

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-storefront-inter',
});

const roboto = Roboto({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '700'],
  variable: '--font-storefront-roboto',
});

const poppins = Poppins({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600', '700'],
  variable: '--font-storefront-poppins',
});

const themeBootScript = `
(() => {
  try {
    const classes = [
      'light',
      'light-medium-contrast',
      'light-high-contrast',
      'dark',
      'dark-medium-contrast',
      'dark-high-contrast',
    ];

    const storedTheme = localStorage.getItem('app-theme') || 'system';
    const storedScheme = localStorage.getItem('app-color-scheme') || 'default';
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const resolvedTheme = storedTheme === 'system' ? (prefersDark ? 'dark' : 'light') : storedTheme;
    const suffix =
      storedScheme === 'medium' ? '-medium-contrast' : storedScheme === 'high' ? '-high-contrast' : '';
    const nextClass = resolvedTheme + suffix;

    document.body.classList.remove(...classes);
    document.body.classList.add(nextClass);
    document.documentElement.style.colorScheme = resolvedTheme;
  } catch (error) {
    console.warn('Theme boot script failed', error);
  }
})();
`;

export const metadata: Metadata = {
  title: 'Store Lite',
  description: 'Gestiona tus negocios de forma sencilla y eficiente.',
  icons: {
    icon: '/img/icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          <WebVitalsReporter />
        {children}
      </AuthProvider>
    </ThemeProvider>
        </CSPostHogProvider >
      </body >
    </html >
  );
}
