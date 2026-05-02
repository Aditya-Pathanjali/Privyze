import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Privyze — See What The Web Hides From You",
  description: "Real-time data tracking, AI explanations, and carbon impact — all inside a secure sandbox powered by BrowserPod.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#0B0F14] text-slate-100 antialiased">{children}</body>
    </html>
  );
}
