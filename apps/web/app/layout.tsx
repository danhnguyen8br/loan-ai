import type { Metadata, Viewport } from "next";
import { Afacad } from "next/font/google";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Navigation } from "@/components/navigation";
import { FloatingContact } from "@/components/floating-contact";

// Google Analytics configuration from environment variables
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const GA_STREAM_ID = process.env.NEXT_PUBLIC_GA_STREAM_ID;

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
      <body className={`${afacad.className} bg-white antialiased`}>
        <Providers>
          {children}
          <FloatingContact
            phoneNumber={process.env.NEXT_PUBLIC_CONTACT_PHONE || "0948386873"}
            zaloUrl={process.env.NEXT_PUBLIC_ZALO_URL || "https://zalo.me/0948386873"}
            whatsappNumber={process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "+84948386873"}
          />
        </Providers>
        <Analytics />
        <SpeedInsights />

        {/* Google Analytics - only load if configured */}
        {GA_MEASUREMENT_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_MEASUREMENT_ID}'${
                  GA_STREAM_ID ? `, { stream_id: '${GA_STREAM_ID}' }` : ''
                });
              `}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
