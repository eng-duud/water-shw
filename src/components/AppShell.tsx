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

        {/* Subscription Footer */}
        <footer className="border-t border-slate-200 bg-white px-6 py-4 no-print">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-[11px] text-slate-500 leading-relaxed text-center sm:text-right">
              ⚠️ هذا النظام للعرض والتجربة فقط. لمن يرغب في الحصول على هذا النظام المتكامل لإدارة فواتير المياه والفوترة ، يرجى التواصل عبر واتساب:
            </p>
            <a
              href="https://wa.me/967776626456?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%20%D8%A7%D8%B1%D9%8A%D8%AF%20%D9%85%D9%86%D9%83%20%D9%87%D8%B0%D8%A7%20%D8%A7%D9%84%D9%86%D8%B8%D8%A7%D9%85%20%D8%A7%D9%84%D8%AE%D8%A7%D8%B5%20%D8%A8%D8%A5%D8%AF%D8%A7%D8%B1%D8%A9%20%D8%A7%D9%84%D9%85%D9%8A%D8%A7%D9%87%20%D9%88%D8%A7%D9%84%D9%81%D9%88%D8%AA%D8%B1%D8%A9"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center bg-green-500 hover:bg-green-600 text-white p-2.5 rounded-full transition-all shadow-md hover:shadow-lg hover:scale-110 shrink-0"
              title="تواصل عبر واتساب"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </a>
          </div>
        </footer>
      </main>
    </div>
  );
}
