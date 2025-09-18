
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Inter } from 'next/font/google'
import { ThemeProvider } from '@/components/theme-provider';

export const metadata: Metadata = {
  title: 'MitraAI',
  description: 'Your AI Mental Health Companion',
};

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-inter',
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
       <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </head>
      <body className={`${inter.variable} font-body antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="theme-green-dark"
          disableTransitionOnChange
          themes={['light', 'dark', 'theme-gold-dark', 'theme-pink-dark', 'theme-blue-dark', 'theme-gold-light', 'theme-pink-light', 'theme-blue-light', 'theme-green-light', 'theme-green-dark', 'theme-genz-dark']}
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
