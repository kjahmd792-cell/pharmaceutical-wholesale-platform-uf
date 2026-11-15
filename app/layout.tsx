import type { Metadata, Viewport } from 'next'
import './globals.css'
import './auth.css'

export const metadata: Metadata = {
  title: 'الشاعر | تجربة منصة التوريد الدوائي',
  description: 'عرض تجريبي لمنصة موحدة لإدارة الطلبات والمخزون والصيدليات والتوصيل لشركة واحدة.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light',
  userScalable: true,
  maximumScale: 5,
  themeColor: '#f4f7f6',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ar" dir="rtl" data-scroll-behavior="smooth">
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
