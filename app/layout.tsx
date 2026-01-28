"use client";

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { NavHeader } from "@/components/layout/NavHeader";
import { ErrorBoundary } from "@/components/layout/ErrorBoundary";
import { useEffect, useState } from "react";
import { initTelegramWebApp } from "@/lib/telegram/webapp";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [telegramUser, setTelegramUser] = useState<any>(null);
  const [isMiniApp, setIsMiniApp] = useState(false);

  useEffect(() => {
    // Initialize Telegram Web App
    const webApp = initTelegramWebApp();
    
    if (webApp) {
      setIsMiniApp(true);
      setTelegramUser(webApp as any);
      
      // Apply Telegram theme colors
      document.documentElement.style.setProperty(
        '--tg-theme-bg-color',
        webApp.tg.backgroundColor
      );
    }
  }, []);

  return (
    <html lang="en">
      <head>
        <script src="https://telegram.org/js/telegram-web-app.js"></script>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ErrorBoundary>
        {isMiniApp && (
          <div className="telegram-header">
            Running in Telegram as {telegramUser?.firstName}
          </div>
        )}
          <NavHeader />
          <main>{children}</main>
        </ErrorBoundary>
      </body>
    </html>
  );
}
