import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/context/LanguageContext";
import { AuthProvider } from "@/context/AuthContext";
import { GoogleAnalytics } from "@next/third-parties/google";
import { Viewport } from "next";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#0B0514",
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import { OfflineIndicator } from "@/components/OfflineIndicator";

export const metadata: Metadata = {
  metadataBase: new URL("https://sushantghadge.com"),
  title: "Sushant Ghadge | Content Creation Masterclass",
  description: "Learn professional content creation, storytelling, video editing, and viral marketing directly from Sushant Ghadge.",
  keywords: [
    "Sushant Ghadge courses",
    "Sushant Courses",
    "Sushant helps",
    "Sushant helps creators",
    "Sushant Masterclass",
    "Masterclass by Sushant",
    "Content creation Sushant"
  ],
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icon.png', type: 'image/png' },
    ],
    apple: [
      { url: '/icon.png' },
    ],
  },
  openGraph: {
    title: "Sushant Ghadge | Content Creation Masterclass",
    description: "Master the art of viral content creation and digital entrepreneurship with Sushant Ghadge's exclusive masterclass.",
    url: "https://sushantghadge.com",
    siteName: "Sushant Ghadge Masterclass",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: '/about-profile.jpeg',
        width: 1200,
        height: 630,
        alt: 'Sushant Ghadge Masterclass',
      }
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sushant Ghadge | Content Creation Masterclass",
    description: "Learn content creation from Sushant Ghadge",
    images: ['/about-profile.jpeg'],
  },
  robots: {
    index: true,
    follow: true,
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Hind:wght@300;400;500;600;700&family=Baloo+2:wght@400;500;600;700;800&family=Poppins:wght@300;400;500;600;700;800;900&family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
        <script src="https://checkout.razorpay.com/v1/checkout.js" async></script>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Person",
              "name": "Sushant Ghadge",
              "url": "https://sushantghadge.com",
              "jobTitle": "Content Creator & Entrepreneur"
            })
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} min-h-full flex flex-col antialiased`}>
        <LanguageProvider>
          <AuthProvider>
            <OfflineIndicator />
            {children}
          </AuthProvider>
        </LanguageProvider>
      </body>
      {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
      )}
    </html>
  );
}
