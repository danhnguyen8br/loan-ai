import type { Metadata, Viewport } from "next";
import { Afacad } from "next/font/google";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Navigation } from "@/components/navigation";

const GA_MEASUREMENT_ID = "G-QVW1QT0YM3";

const afacad = Afacad({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-afacad",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export const metadata: Metadata = {
  title: "Leadity - Giải Pháp Vay Thông Minh",
  description: "Nền tảng đề xuất vay dựa trên AI, kết nối bạn với các sản phẩm thế chấp tốt nhất từ các ngân hàng hàng đầu Việt Nam",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Leadity",
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
  params?: Promise<Record<string, string>>;
}>) {
  return (
    <html lang="vi" className={afacad.variable}>
      <head>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}', {
              stream_id: '13215373795'
            });
          `}
        </Script>
      </head>
      <body className={`${afacad.className} bg-white antialiased`}>
        <Providers>
          {children}
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
