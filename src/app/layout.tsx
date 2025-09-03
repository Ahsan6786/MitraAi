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
      <body className={`${inter.variable} font-body antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="theme-green-dark"
          disableTransitionOnChange
          themes={['light', 'dark', 'theme-gold-dark', 'theme-pink-dark', 'theme-blue-dark', 'theme-gold-light', 'theme-pink-light', 'theme-blue-light', 'theme-green-light', 'theme-green-dark']}
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
