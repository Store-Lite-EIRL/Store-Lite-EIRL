import { AuthProvider } from '@/features/auth';
import { MaterialWebInit } from '@/lib/material-design/MaterialWebInit';
import { ThemeProvider } from '@/shared/context/ThemeContext';
import '@fontsource/google-sans'; // Importa Google Sans (pesos 400 por defecto)
import type { Metadata } from 'next';
import { Roboto_Mono } from 'next/font/google';
import './globals.css';

const roboto_mono = Roboto_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-roboto-mono',
});

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
    <html lang="en">
      <head>
        {/* ------------------TIK TOK - pixel + events api studio */}
        {/* ------------------TIK TOK - pixel + events api studio */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block"
        />
      </head>
      <body className={`${roboto_mono.variable} antialiased`}>
        <ThemeProvider>
          <AuthProvider>
            <MaterialWebInit />
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
