import { env } from '@/config/env';
import { AuthProvider } from '@/features/auth';
import { MaterialWebInit } from '@/lib/material-design/MaterialWebInit';
import { WebVitalsReporter } from '@/shared/components/WebVitalsReporter';
import { ThemeProvider } from '@/shared/context/ThemeContext';
import { CSPostHogProvider } from '@/shared/providers/PostHogProvider';
import type { Metadata } from 'next';
import localFont from 'next/font/local';
import Script from 'next/script';
import './globals.css';

const google_sans_flex = localFont({
  src: './fonts/google-sans-flex.woff2',
  display: 'swap',
  variable: '--font-google-sans-flex',
  adjustFontFallback: false,
  fallback: ['system-ui', 'sans-serif'],
  weight: '1 1000',
});

const roboto_mono = localFont({
  src: './fonts/roboto-mono.woff2',
  display: 'swap',
  variable: '--font-roboto-mono',
  weight: '100 700',
});

const inter = localFont({
  src: './fonts/inter.woff2',
  display: 'swap',
  variable: '--font-storefront-inter',
  weight: '100 900',
});

const roboto = localFont({
  src: [
    { path: './fonts/roboto-400.woff2', weight: '400', style: 'normal' },
    { path: './fonts/roboto-500.woff2', weight: '500', style: 'normal' },
    { path: './fonts/roboto-700.woff2', weight: '700', style: 'normal' },
  ],
  display: 'swap',
  variable: '--font-storefront-roboto',
});

const poppins = localFont({
  src: [
    { path: './fonts/poppins-400.woff2', weight: '400', style: 'normal' },
    { path: './fonts/poppins-500.woff2', weight: '500', style: 'normal' },
    { path: './fonts/poppins-600.woff2', weight: '600', style: 'normal' },
    { path: './fonts/poppins-700.woff2', weight: '700', style: 'normal' },
  ],
  display: 'swap',
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
  metadataBase: new URL(env.nextPublicAppUrl),
  title: {
    default: 'Store Lite',
    template: '%s | Store Lite',
  },
  description: 'Gestiona tus negocios de forma sencilla y eficiente.',
  openGraph: {
    type: 'website',
    siteName: 'Store Lite',
    locale: 'es_PE',
  },
  twitter: {
    card: 'summary_large_image',
  },
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
