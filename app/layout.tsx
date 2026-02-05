import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "STO 경영실적 대시보드",
  description: "Financial Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
      </head>
      <body className="font-['Pretendard'] antialiased bg-gray-50">
        {children}
      </body>
    </html>
  );
}
