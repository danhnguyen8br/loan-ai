import type { Metadata, Viewport } from "next";
import { Afacad } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Navigation } from "@/components/navigation";

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
        </Providers>
      </body>
    </html>
  );
}
