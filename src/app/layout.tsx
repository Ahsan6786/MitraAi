import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Inter } from 'next/font/google'
import { ThemeProvider } from '@/components/theme-provider';
import Script from 'next/script';

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
          themes={['light', 'dark', 'theme-gold-dark', 'theme-pink-dark', 'theme-blue-dark', 'theme-gold-light', 'theme-pink-light', 'theme-blue-light', 'theme-green-light', 'theme-green-dark', 'theme-genz-dark']}
        >
          {children}
          <Toaster />
        </ThemeProvider>
        
        {/* <!--Start of Tawk.to Script--> */}
        <Script id="tawk-to-script" strategy="lazyOnload">
          {`
            var Tawk_API = Tawk_API || {};
            Tawk_API.onLoad = function(){
                Tawk_API.customStyle = {
                    visibility : {
                        desktop : {
                            xOffset : '20px',
                            yOffset : '80px',
                            position : 'br'
                        },
                        mobile : {
                            xOffset : '10px',
                            yOffset : '80px',
                            position : 'br'
                        }
                    }
                };
            };
            var Tawk_LoadStart = new Date();
            (function(){
            var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
            s1.async=true;
            s1.src='https://embed.tawk.to/68c4809b67c586192c677ae3/default';
            s1.charset='UTF-8';
            s1.setAttribute('crossorigin','*');
            s0.parentNode.insertBefore(s1,s0);
            })();
          `}
        </Script>
        {/* <!--End of Tawk.to Script--> */}
      </body>
    </html>
  );
}
