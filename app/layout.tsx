import ConsentBanner from '@/components/consent/ConsentBanner';
import MetaPixelProvider from '@/components/meta/MetaPixelProvider';
import { env } from '@/config/env';
import { AuthProvider } from '@/features/auth';
import { MaterialWebInit } from '@/lib/material-design/MaterialWebInit';
import { ThemeBoot } from '@/shared/components/ThemeBoot';
import { WebVitalsReporter } from '@/shared/components/WebVitalsReporter';
import { ThemeProvider } from '@/shared/context/ThemeContext';
import { CSPostHogProvider } from '@/shared/providers/PostHogProvider';
import { buildSiteJsonLd, SITE_DESCRIPTION, SITE_NAME } from '@/shared/utils/siteJsonLd';
import type { Metadata } from 'next';
import { Inter, Roboto_Mono, Sora } from 'next/font/google';
import localFont from 'next/font/local';
import './globals.css';

const sora = Sora({
  subsets: ['latin'],

  display: 'swap',
  variable: '--font-sora',
  fallback: ['system-ui', 'sans-serif'],
});

const inter = Inter({
  subsets: ['latin'],

  display: 'swap',
  variable: '--font-inter',
  fallback: ['system-ui', 'sans-serif'],
});

const roboto_mono = Roboto_Mono({
  subsets: ['latin'],

  display: 'swap',
  variable: '--font-roboto-mono',
  fallback: ['ui-monospace', 'SFMono-Regular', 'monospace'],
});

const google_sans_flex = localFont({
  src: './fonts/google-sans-flex.woff2',
  display: 'swap',
  variable: '--font-google-sans-flex',
  adjustFontFallback: false,
  fallback: ['system-ui', 'sans-serif'],
  weight: '1 1000',
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

// Site-level JSON-LD knowledge graph — built once, rendered on every page.
const siteJsonLd = buildSiteJsonLd(env.nextPublicAppUrl);

export const metadata: Metadata = {
  metadataBase: new URL(env.nextPublicAppUrl),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
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
      className={`${sora.variable} ${inter.variable} ${roboto_mono.variable} ${google_sans_flex.variable} ${poppins.variable}`}
    >
      <head>
        {/* FOUC prevention - runs before any styles */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var storedTheme = localStorage.getItem('app-theme') || 'system';
                  var storedScheme = localStorage.getItem('app-color-scheme') || 'default';
                  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  var resolvedTheme = storedTheme === 'system' ? (prefersDark ? 'dark' : 'light') : storedTheme;
                  var suffix = storedScheme === 'medium' ? '-medium-contrast' : storedScheme === 'high' ? '-high-contrast' : '';
                  document.documentElement.setAttribute('data-theme', resolvedTheme);
                  document.documentElement.style.colorScheme = resolvedTheme;
                } catch (e) {}
              })();
            `,
          }}
        />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,300..600,0..1,-25..0&display=block"
        />
        <ThemeBoot />
      </head>
      <body suppressHydrationWarning className="antialiased">
        {/* Site-level structured data: Organization + WebSite knowledge graph */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd) }}
        />
        <CSPostHogProvider>
          <ThemeProvider>
            <AuthProvider>
              <MaterialWebInit />
              <WebVitalsReporter />
              {children}
              <ConsentBanner />
              <MetaPixelProvider />
            </AuthProvider>
          </ThemeProvider>
        </CSPostHogProvider>
      </body>
    </html>
  );
}
