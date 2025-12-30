import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Giới Thiệu Leadity - Môi Giới Khoản Vay Thế Chấp Chuyên Nghiệp",
  description:
    "Leadity là môi giới khoản vay thế chấp chuyên nghiệp tại Việt Nam. Chúng tôi kết nối bạn với 20+ ngân hàng hàng đầu để tìm gói vay phù hợp nhất. Tư vấn miễn phí, phản hồi trong 24h.",
  keywords: [
    "môi giới vay thế chấp",
    "mortgage broker Vietnam",
    "vay mua nhà",
    "tư vấn vay ngân hàng",
    "so sánh lãi suất vay",
    "leadity",
    "vay thế chấp",
    "khoản vay mua nhà",
    "tư vấn tài chính",
  ],
  openGraph: {
    title: "Giới Thiệu Leadity - Môi Giới Khoản Vay Thế Chấp",
    description:
      "Môi giới khoản vay thế chấp chuyên nghiệp, kết nối bạn với 20+ ngân hàng hàng đầu Việt Nam. Tư vấn miễn phí, phản hồi trong 24h.",
    type: "website",
    locale: "vi_VN",
    siteName: "Leadity",
  },
  twitter: {
    card: "summary_large_image",
    title: "Giới Thiệu Leadity - Môi Giới Khoản Vay Thế Chấp",
    description:
      "Môi giới khoản vay thế chấp chuyên nghiệp, kết nối bạn với 20+ ngân hàng hàng đầu Việt Nam.",
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "/about",
  },
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

