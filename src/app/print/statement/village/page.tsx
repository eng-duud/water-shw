"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { generatePrintFilename } from "@/lib/print-filename";

interface CustomerSummary {
  id: string;
  accountNumber: string;
  name: string;
  phone: string | null;
  village: string | null;
  meterNumber: string | null;
  isActive: boolean;
  totalBilled: number;
  totalPaid: number;
  currentBalance: number;
}

interface VillageStatementData {
  village: string;
  customers: CustomerSummary[];
  summary: {
    totalBilled: number;
    totalPaid: number;
    currentBalance: number;
    customersCount: number;
  };
}

function VillageStatementContent() {
  const searchParams = useSearchParams();
  const village = searchParams.get("village");
  const [data, setData] = useState<VillageStatementData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!village) return;
    const fetchStatement = async () => {
      try {
        const response = await fetch(`/api/customers/village-statement?village=${encodeURIComponent(village)}`);
        if (!response.ok) throw new Error("فشل تحميل كشف الحساب");
        const result = await response.json();
        setData(result);
      } catch (err) {
        console.error("Village statement fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStatement();
  }, [village]);

  useEffect(() => {
    if (data) {
      document.title = generatePrintFilename('كشف موحد', data.village);
      const timer = setTimeout(() => {
        window.print();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [data]);

  if (!village) {
    return (
      <div className="flex justify-center items-center min-h-screen text-rose-500 font-bold">
        خطأ: لم يتم تحديد القرية.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen text-slate-500 font-medium">
        جاري تجهيز كشف الحساب الموحد للطباعة...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex justify-center items-center min-h-screen text-rose-500 font-bold">
        خطأ: كشف الحساب الموحد غير موجود أو تعذر جلبه.
      </div>
    );
  }

  const { customers, summary } = data;
  const formatNum = (n: number | null | undefined) => (n ?? 0).toLocaleString("en-US");

  return (
    <div className="print-container bg-white p-4 max-w-[21cm] mx-auto text-black font-sans dir-rtl space-y-4">
      {/* HEADER */}
      <div className="flex justify-between items-center border-b-2 border-black pb-3 relative min-h-[130px]">
        {/* Right Section: Entity Info */}
        <div className="text-right flex-1 z-10">
          <h1 className="text-base font-extrabold text-gray-900">الجمهورية اليمنية - محافظة تعز</h1>
          <h2 className="text-sm font-bold text-gray-800">مشروع مياه غيل الضياء قدس المواسط</h2>
          <p className="text-[10px] text-gray-600 font-bold mt-0.5">كشف حساب موحد للقرية</p>
        </div>

        {/* Center Section: Prominent Logo with Water Theme */}
        <div className="flex-shrink-0 mx-6 z-20">
          <div className="relative flex items-center justify-center">
            {/* Water-themed decorative rings */}
            <div className="absolute w-36 h-36 bg-gradient-to-br from-blue-100/60 via-cyan-100/40 to-blue-50/60 rounded-full blur-xl -z-10"></div>
            <div className="absolute w-32 h-32 border-[3px] border-blue-200/40 rounded-full -z-5"></div>
            <div className="absolute w-24 h-24 border-[2px] border-cyan-300/30 rounded-full -z-5"></div>
            {/* Logo */}
            <img
              src="/logo.png"
              alt="شعار المشروع"
              className="w-28 h-28 object-contain drop-shadow-[0_4px_16px_rgba(0,0,0,0.25)]"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          </div>
        </div>

        {/* Left Section: Statement Type */}
        <div className="text-left flex-1 flex flex-col items-end z-10">
          <div className="bg-sky-100 border-2 border-sky-800 px-3 py-0.5 rounded shadow-sm">
            <h2 className="text-[11px] font-black text-sky-900">كشف حساب موحد</h2>
          </div>
          <p className="text-[9px] text-gray-700 font-bold mt-1">
            تاريخ الإصدار: {new Date().toLocaleDateString("ar-YE")}
          </p>
        </div>
      </div>

      {/* VILLAGE INFO */}
      <div className="bg-gradient-to-r from-gray-50 to-white border border-black rounded-sm p-3">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-gray-600">القرية: </span>
            <span className="font-bold text-sm">{data.village}</span>
          </div>
          <div>
            <span className="text-gray-600">عدد المشتركين: </span>
            <span className="font-bold">{summary.customersCount} مشترك</span>
          </div>
        </div>
      </div>

      {/* SUMMARY */}
      <div className="grid grid-cols-3 gap-2">
        <div className="border-2 border-black rounded-sm p-2 text-center bg-rose-50">
          <p className="text-[10px] text-gray-600">إجمالي فواتير القرية</p>
          <p className="font-mono font-extrabold text-rose-700 text-sm">{formatNum(summary.totalBilled)} ريال</p>
        </div>
        <div className="border-2 border-black rounded-sm p-2 text-center bg-emerald-50">
          <p className="text-[10px] text-gray-600">إجمالي مدفوعات القرية</p>
          <p className="font-mono font-extrabold text-emerald-700 text-sm">{formatNum(summary.totalPaid)} ريال</p>
        </div>
        <div className={`border-2 border-black rounded-sm p-2 text-center ${summary.currentBalance > 0 ? 'bg-amber-50' : 'bg-green-50'}`}>
          <p className="text-[10px] text-gray-600">الرصيد الكلي المتبقي</p>
          <p className={`font-mono font-extrabold text-sm ${summary.currentBalance > 0 ? 'text-amber-700' : 'text-green-700'}`}>
            {formatNum(Math.abs(summary.currentBalance))} ريال
          </p>
          <p className="text-[9px] text-gray-500">
            {summary.currentBalance > 0 ? '(مستحق للمشروع)' : summary.currentBalance < 0 ? '(فائض)' : '(مسدد بالكامل)'}
          </p>
        </div>
      </div>

      {/* CUSTOMERS TABLE */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border-2 border-black text-center text-[11px]">
          <thead>
            <tr className="bg-gradient-to-r from-gray-100 to-gray-50">
              <th className="border border-black p-1.5 text-xs font-bold text-gray-700">#</th>
              <th className="border border-black p-1.5 text-xs font-bold text-gray-700">رقم الحساب</th>
              <th className="border border-black p-1.5 text-xs font-bold text-gray-700">اسم المشترك</th>
              <th className="border border-black p-1.5 text-xs font-bold text-gray-700">الهاتف</th>
              <th className="border border-black p-1.5 text-xs font-bold text-gray-700">رقم العداد</th>
              <th className="border border-black p-1.5 text-xs font-bold text-rose-700">إجمالي الفواتير</th>
              <th className="border border-black p-1.5 text-xs font-bold text-emerald-700">إجمالي المدفوعات</th>
              <th className="border border-black p-1.5 text-xs font-bold text-gray-800">الرصيد الحالي</th>
              <th className="border border-black p-1.5 text-xs font-bold text-gray-700">الحالة</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c, index) => (
              <tr key={c.id} className={!c.isActive ? 'bg-slate-100/50' : ''}>
                <td className="border border-black p-1.5 font-mono text-gray-600">{index + 1}</td>
                <td className="border border-black p-1.5 font-mono font-bold">{c.accountNumber}</td>
                <td className="border border-black p-1.5 font-bold text-right px-2">{c.name}</td>
                <td className="border border-black p-1.5 font-mono">{c.phone || "—"}</td>
                <td className="border border-black p-1.5 font-mono">{c.meterNumber || "—"}</td>
                <td className="border border-black p-1.5 font-mono font-bold text-rose-700">
                  {c.totalBilled > 0 ? formatNum(c.totalBilled) : '—'}
                </td>
                <td className="border border-black p-1.5 font-mono font-bold text-emerald-700">
                  {c.totalPaid > 0 ? formatNum(c.totalPaid) : '—'}
                </td>
                <td className={`border border-black p-1.5 font-mono font-bold ${c.currentBalance > 0 ? 'text-amber-700' : 'text-green-700'}`}>
                  {formatNum(Math.abs(c.currentBalance))} {c.currentBalance > 0 ? '(م)' : c.currentBalance < 0 ? '(د)' : ''}
                </td>
                <td className="border border-black p-1.5">
                  <span className={`text-[10px] font-bold ${c.isActive ? 'text-emerald-700' : 'text-slate-400'}`}>
                    {c.isActive ? 'نشط' : 'موقف'}
                  </span>
                </td>
              </tr>
            ))}
            {/* TOTALS ROW */}
            <tr className="bg-gray-100 font-extrabold">
              <td colSpan={5} className="border border-black p-2 text-xs font-bold text-gray-700 text-right">الإجمالي الكلي</td>
              <td className="border border-black p-2 font-mono font-extrabold text-rose-800">{formatNum(summary.totalBilled)}</td>
              <td className="border border-black p-2 font-mono font-extrabold text-emerald-800">{formatNum(summary.totalPaid)}</td>
              <td className={`border border-black p-2 font-mono font-extrabold ${summary.currentBalance > 0 ? 'text-amber-800' : 'text-green-800'}`}>
                {formatNum(Math.abs(summary.currentBalance))} {summary.currentBalance > 0 ? '(مستحق)' : summary.currentBalance < 0 ? '(فائض)' : ''}
              </td>
              <td className="border border-black p-2"></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* NOTES */}
      <div className="text-[10px] space-y-1 text-slate-800 leading-relaxed border-2 border-black p-2.5 bg-gradient-to-r from-gray-50 to-white rounded-sm">
        <p className="font-bold text-center border-b border-gray-300 pb-1 mb-1 text-xs">ملاحظات الكشف الموحد</p>
        <p>• يعكس هذا الكشف الوضع المالي العام لجميع المشتركين المسجلين في قرية ({data.village}) حتى تاريخ الطباعة.</p>
        <p>• (م) تعني مدين (مستحق على المشترك لصالح المشروع) | (د) تعني دائن (رصيد للمشترك).</p>
      </div>

      {/* FOOTER */}
      <div className="flex justify-between items-center text-[9px] text-gray-500 pt-2 border-t-2 border-black">
        <span>تاريخ الطباعة: {new Date().toLocaleDateString("ar-YE")} {new Date().toLocaleTimeString("ar-YE", { hour: "2-digit", minute: "2-digit" })}</span>
      </div>

      {/* SIGNATURES */}
      <div className="flex justify-between items-center text-xs pt-2">
        <div className="text-center">
          <p className="font-bold mb-1 text-gray-700">الختم الرسمي</p>
          <div className="w-20 h-8 border-2 border-dashed border-gray-400 mx-auto rounded"></div>
        </div>
        <div className="text-center">
          <p className="font-bold mb-1 text-gray-700">المحاسب المسؤول</p>
          <div className="w-28 h-8 border-2 border-dashed border-gray-400 mx-auto rounded"></div>
        </div>
        <div className="text-center">
          <p className="font-bold mb-1 text-gray-700">إدارة المشروع</p>
          <div className="w-28 h-8 border-2 border-dashed border-gray-400 mx-auto rounded"></div>
        </div>
      </div>

      {/* DEMO / SUBSCRIPTION FOOTER */}
      <div className="border-t-2 border-dashed border-blue-300 pt-3 mt-2">
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-2.5">
          <p className="text-[9px] text-blue-800 font-semibold leading-relaxed text-center">
            ⚠️ هذا النظام للعرض والتجربة فقط. لمن يرغب في الحصول على هذا النظام المتكامل لإدارة فواتير المياه والمشروعات المماثلة، يرجى التواصل عبر واتساب:
          </p>
          <div className="flex justify-center mt-1.5">
            <a
              href="https://wa.me/967776626456?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%20%D8%A7%D8%B1%D9%8A%D8%AF%20%D9%85%D9%86%D9%83%20%D9%87%D8%B0%D8%A7%20%D8%A7%D9%84%D9%86%D8%B8%D8%A7%D9%85%20%D8%A7%D9%84%D8%AE%D8%A7%D8%B5%20%D8%A8%D8%A5%D8%AF%D8%A7%D8%B1%D8%A9%20%D8%A7%D9%84%D9%85%D9%8A%D8%A7%D8%A9%20%D8%A7%D9%88%20%D9%85%D8%A7%20%D8%B4%D8%A7%D8%A8%D9%87"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white font-bold text-xs px-4 py-2 rounded-lg transition-all shadow-md hover:shadow-lg"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              +967776626456 تواصل عبر واتساب
            </a>
          </div>
        </div>
      </div>

      <div className="text-center pt-2 no-print">
        <button
          onClick={() => window.print()}
          className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-sm px-6 py-2.5 rounded-xl transition-colors shadow"
        >
          طباعة الكشف
        </button>
      </div>
    </div>
  );
}

export default function VillageStatementPrint() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen text-slate-500 font-medium animate-pulse">جاري التحميل...</div>}>
      <VillageStatementContent />
    </Suspense>
  );
}
