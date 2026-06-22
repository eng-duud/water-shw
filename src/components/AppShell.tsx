"use client";

import Link from "next/link";
import { isDemoMode } from "@/lib/demo-mode";

export default function AppShell({ children }: { children: React.ReactNode }) {

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      {/* Navigation Sidebar */}
      <aside className="no-print w-full md:w-64 glass-panel text-white flex flex-col shrink-0">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-bold tracking-wide text-brand-100">نظام إدارة الفوترة</h1>
          <p className="text-xs text-slate-400 mt-1">خدمة قراءة العدادات والفوترة والتحصيل</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <Link
            href="/"
            className="flex items-center space-x-3 space-x-reverse px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors text-slate-200 hover:text-white"
          >
            <span>📊</span>
            <span className="font-medium">لوحة التحكم</span>
          </Link>

          <Link
            href="/customers"
            className="flex items-center space-x-3 space-x-reverse px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors text-slate-200 hover:text-white"
          >
            <span>👥</span>
            <span className="font-medium">إدارة المشتركين</span>
          </Link>

          <Link
            href="/billing"
            className="flex items-center space-x-3 space-x-reverse px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors text-slate-200 hover:text-white"
          >
            <span>💧</span>
            <span className="font-medium">قراءة العدادات والفوترة</span>
          </Link>

          <Link
            href="/payments"
            className="flex items-center space-x-3 space-x-reverse px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors text-slate-200 hover:text-white"
          >
            <span>💵</span>
            <span className="font-medium">سداد الفواتير والتحصيل</span>
          </Link>
        </nav>

        <div className="px-4 pb-4 text-center text-xs text-slate-500 no-print">
          نظام الفوترة © 2026
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        {/* Header Bar */}
        <header className="no-print bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 shrink-0 shadow-sm">
          <div className="flex items-center space-x-3 space-x-reverse">
            <span className="text-xl">🚰</span>
            <span className="font-semibold text-slate-800">نظام إدارة وتحصيل فواتير المياه</span>
          </div>
          <div className="flex items-center space-x-2 space-x-reverse">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
              isDemoMode()
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}>
              {isDemoMode() ? 'نظام تجريبي - للعرض فقط' : 'متصل بقاعدة البيانات'}
            </span>
          </div>
        </header>

        {/* Children Pages */}
        <div className="flex-1 p-6 md:p-8">{children}</div>
      </main>
    </div>
  );
}
