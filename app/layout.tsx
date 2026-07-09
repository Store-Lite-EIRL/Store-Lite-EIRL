import { AuthProvider } from '@/features/auth';
import { MaterialWebInit } from '@/lib/material-design/MaterialWebInit';
import { WebVitalsReporter } from '@/shared/components/WebVitalsReporter';
import { ThemeProvider } from '@/shared/context/ThemeContext';
import { CSPostHogProvider } from '@/shared/providers/PostHogProvider';
import type { Metadata } from 'next';
import { Google_Sans_Flex, Inter, Poppins, Roboto, Roboto_Mono } from 'next/font/google';
import Script from 'next/script';
import './globals.css';

const google_sans_flex = Google_Sans_Flex({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-google-sans-flex',
  adjustFontFallback: false,
  fallback: ['system-ui', 'sans-serif'],
  weight: 'variable',
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
    <html
      lang="es"
      suppressHydrationWarning
      className={`${google_sans_flex.variable} ${roboto_mono.variable} ${inter.variable} ${roboto.variable} ${poppins.variable}`}
    >
      <head>
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block"
        />
        {/* ⚡ Theme boot script — beforeInteractive: must be in <head> to avoid React hydration warning */}
        <Script
          id="theme-boot"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: themeBootScript }}
        />
      </head>
      <body suppressHydrationWarning className="antialiased">
        <CSPostHogProvider>
          <ThemeProvider>
            <AuthProvider>
              <MaterialWebInit />
              <WebVitalsReporter />
              {children}
            </AuthProvider>
          </ThemeProvider>
        </CSPostHogProvider>
      </body>
    </html>
  );
}
