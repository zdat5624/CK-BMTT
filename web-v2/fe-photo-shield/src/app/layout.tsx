import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import "antd/dist/reset.css";
import { SuspenseWrapper } from "@/components/SuspenseWrapper";
import { AuthProvider } from "@/contexts/AuthContext";


const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Photo Shield",
  description: "Create by LÊ THÀNH ĐẠT",
  icons: {
    icon: '/favicon.ico', // Khai báo rõ ràng loại icon và đường dẫn
    shortcut: '/favicon.ico', // Tùy chọn, cho trình duyệt cũ
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className={`${inter.variable} antialiased`}>
        <AntdRegistry>
          <SuspenseWrapper>
            <AuthProvider>
              {children}
            </AuthProvider>
          </SuspenseWrapper>
        </AntdRegistry>
      </body>
    </html>
  );
}
