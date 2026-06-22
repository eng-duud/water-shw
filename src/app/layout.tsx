import type { Metadata } from "next";
import "./globals.css";
import AppShell from "@/components/AppShell";
import DemoBanner from "@/components/DemoBanner";

export const metadata: Metadata = {
  title: "نظام إدارة فواتير المياه - خدمة فوترة إلكترونية",
  description: "نظام متكامل لإدارة قراءات العدادات والفوترة الإلكترونية وتحصيل فواتير المياه",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body className="antialiased bg-slate-50 text-slate-800">
        <DemoBanner />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
