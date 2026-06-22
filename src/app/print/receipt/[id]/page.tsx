"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { numberToArabicWords } from "@/lib/num-to-words";
import { generatePrintFilename } from "@/lib/print-filename";

interface ReceiptData {
  id: string;
  amount: number;
  allocatedAmount: number;
  surplusAmount: number;
  surplusHandled: boolean;
  surplusNote: string | null;
  paymentMethod: string | null;
  receiptNumber: string | null;
  notes: string | null;
  createdAt: string;
  arrearsBefore: number;
  customer: {
    accountNumber: string;
    name: string;
    phone: string | null;
    village: string | null;
    meterNumber: string | null;
  };
  allocations: Array<{
    id: string;
    amount: number;
    bill: {
      billNumber: string;
      totalAmount: number;
      paidAmount: number;
      billingCycle: {
        year: number;
        month: number;
      };
    };
  }>;
}

const ARABIC_MONTHS = [
  "", "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

const PAYMENT_METHODS: Record<string, string> = {
  CASH: "نقداً (كاش)",
  BANK: "تحويل بنكي / محفظة",
  CHECK: "شيك",
};

export default function ReceiptPrint() {
  const params = useParams();
  const id = params.id as string;
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchReceipt = async () => {
      try {
        const response = await fetch(`/api/payments/${id}`);
        if (!response.ok) throw new Error("فشل تحميل سند القبض");
        const data = await response.json();
        setReceipt(data);
      } catch (err) {
        console.error("Receipt fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReceipt();
  }, [id]);

  useEffect(() => {
    if (receipt) {
      document.title = generatePrintFilename('سند قبض', receipt.customer.name);
      const timer = setTimeout(() => {
        window.print();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [receipt]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen text-slate-500 font-medium">
        جاري تجهيز سند القبض للطباعة...
      </div>
    );
  }

  if (!receipt) {
    return (
      <div className="flex justify-center items-center min-h-screen text-rose-500 font-bold">
        خطأ: سند القبض غير موجود أو تعذر جلبها.
      </div>
    );
  }

  const totalAllocated = receipt.allocations.reduce((sum, a) => sum + Number(a.amount), 0);
  const remainingAfter = receipt.allocations.reduce((sum, a) => {
    const unpaid = Number(a.bill.totalAmount) - Number(a.bill.paidAmount);
    return sum + Math.max(unpaid, 0);
  }, 0);
  const totalWords = numberToArabicWords(Math.round(receipt.amount));
  const formatNum = (n: number | null | undefined) => (n ?? 0).toLocaleString("en-US");

  return (
    <div className="print-container bg-white p-4 max-w-[21cm] mx-auto text-black font-sans dir-rtl space-y-3">
      {/* HEADER */}
      <div className="flex justify-between items-center border-b-2 border-black pb-3 relative min-h-[130px]">
        {/* Right Section: Entity Info */}
        <div className="text-right flex-1 z-10">
          <h1 className="text-base font-extrabold text-gray-900">الجمهورية اليمنية - محافظة تعز</h1>
          <h2 className="text-sm font-bold text-gray-800">مشروع مياه غيل الضياء قدس المواسط</h2>
          <p className="text-[10px] text-gray-600 font-bold mt-0.5">سند قبض رسمي</p>
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

        {/* Left Section: Receipt Number and Type */}
        <div className="text-left flex-1 flex flex-col items-end z-10">
          <div className="border-2 border-black px-2 py-0.5 rounded bg-gray-50 mb-1">
            <p className="font-black text-xs">رقم السند: {receipt.receiptNumber || receipt.id.slice(0, 8)}</p>
          </div>
          <div className="bg-emerald-100 border-2 border-emerald-800 px-3 py-0.5 rounded shadow-sm">
            <h2 className="text-[11px] font-black text-emerald-900">سند قبض</h2>
          </div>
        </div>
      </div>

      {/* CUSTOMER INFO BAR */}
      <div className="bg-gradient-to-r from-gray-50 to-white border border-black rounded-sm p-2">
        <p className="text-xs">
          <span className="text-gray-600">المشترك: </span>
          <span className="font-bold text-sm">{receipt.customer.name}</span>
          <span className="text-gray-600 mx-2">|</span>
          <span className="text-gray-600">رقم المشترك: </span>
          <span className="font-bold font-mono">{receipt.customer.accountNumber}</span>
          <span className="text-gray-600 mx-2">|</span>
          <span className="text-gray-600">الهاتف: </span>
          <span className="font-bold font-mono">{receipt.customer.phone || "—"}</span>
          <span className="text-gray-600 mx-2">|</span>
          <span className="text-gray-600">القرية: </span>
          <span className="font-bold">{receipt.customer.village || "—"}</span>
          <span className="text-gray-600 mx-2">|</span>
          <span className="text-gray-600">رقم العداد: </span>
          <span className="font-bold font-mono">{receipt.customer.meterNumber || "—"}</span>
          <span className="text-gray-600 mx-2">|</span>
          <span className="text-gray-600">طريقة الدفع: </span>
          <span className="font-bold">{PAYMENT_METHODS[receipt.paymentMethod || ''] || receipt.paymentMethod || '—'}</span>
          <span className="text-gray-600 mx-2">|</span>
          <span className="text-gray-600">التاريخ: </span>
          <span className="font-bold font-mono">{new Date(receipt.createdAt).toLocaleDateString("ar-YE")}</span>
        </p>
      </div>

      {/* BILLS TABLE - ALLOCATIONS */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border-2 border-black text-center text-[11px]">
          <thead>
            <tr className="bg-gradient-to-r from-gray-100 to-gray-50">
              <th className="border-l-2 border-black p-1.5 text-xs font-bold text-gray-700">رقم الفاتورة</th>
              <th className="border-l-2 border-black p-1.5 text-xs font-bold text-gray-700">دورة الفوترة</th>
              <th className="border-l-2 border-black p-1.5 text-xs font-bold text-gray-700">قيمة الفاتورة</th>
              <th className="border-l-2 border-black p-1.5 text-xs font-bold text-emerald-700">المسدد</th>
              <th className="p-1.5 text-xs font-bold text-gray-700">المتبقي</th>
            </tr>
          </thead>
          <tbody>
            {receipt.allocations.map((alloc) => {
              const billTotal = Number(alloc.bill.totalAmount);
              const billPaid = Number(alloc.bill.paidAmount);
              const remaining = Math.max(billTotal - billPaid, 0);
              return (
                <tr key={alloc.id} className="bg-white hover:bg-gray-50/50">
                  <td className="border-l-2 border-black p-2 font-mono font-bold text-slate-800">{alloc.bill.billNumber}</td>
                  <td className="border-l-2 border-black p-2 font-mono font-bold text-slate-700">
                    {alloc.bill.billingCycle.year}/{String(alloc.bill.billingCycle.month).padStart(2, '0')}
                  </td>
                  <td className="border-l-2 border-black p-2 font-mono font-bold text-slate-800">{formatNum(billTotal)}</td>
                  <td className="border-l-2 border-black p-2 font-mono font-bold text-emerald-700">{formatNum(Number(alloc.amount))}</td>
                  <td className="p-2 font-mono font-bold text-amber-700">{formatNum(remaining)}</td>
                </tr>
              );
            })}
            {/* Total row */}
            <tr className="bg-gray-100 font-extrabold">
              <td colSpan={3} className="border-l-2 border-black p-2 text-xs font-bold text-gray-700">الإجمالي المدفوع</td>
              <td className="border-l-2 border-black p-2 font-mono font-extrabold text-lg text-emerald-800">{formatNum(receipt.amount)}</td>
              <td className="p-2 font-mono font-bold text-gray-700">{formatNum(remainingAfter)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* SURPLUS */}
      {receipt.surplusAmount > 0 && (
        <div className="text-xs border-2 border-amber-300 p-2 bg-amber-50 rounded-sm">
          <p>
            <span className="font-bold text-amber-800">الرصيد الزائد: </span>
            <span className="font-mono font-extrabold text-amber-700">{formatNum(receipt.surplusAmount)} ريال</span>
            {receipt.surplusHandled && receipt.surplusNote && (
              <span className="text-gray-600"> — {receipt.surplusNote}</span>
            )}
            {!receipt.surplusHandled && (
              <span className="text-rose-600 font-semibold"> (معلق pending)</span>
            )}
          </p>
        </div>
      )}

      {/* AMOUNT IN WORDS */}
      <div className="text-right text-xs font-bold border-2 border-black p-2 bg-gradient-to-r from-emerald-50 to-white rounded-sm">
        <span>المبلغ المستلم كتابةً: </span>
        <span className="border-b-2 border-dotted border-black px-2 text-emerald-700 font-extrabold text-sm">{totalWords} ريال يمني</span>
        <span> لا غير</span>
      </div>

      {/* NOTES */}
      {receipt.notes && (
        <div className="text-[10px] border-2 border-black p-2 bg-gray-50 rounded-sm">
          <p className="font-bold mb-0.5">ملاحظات:</p>
          <p>{receipt.notes}</p>
        </div>
      )}

      {/* CONDITIONS */}
      <div className="text-[10px] space-y-1 text-slate-800 leading-relaxed border-2 border-black p-2.5 bg-gradient-to-r from-gray-50 to-white rounded-sm">
        <p className="font-bold text-center border-b border-gray-300 pb-1 mb-1 text-xs">⚠️ الضوابط والإرشادات</p>
        <p>• هذا السند يُعتبر إثباتاً رسمياً لعملية السداد المذكورة أعلاه.</p>
        <p>• يجب الاحتفاظ بهذا السند كمرجع لأي استفسارات مستقبلية.</p>
        <p>• أي تعديل أو شطب في هذا السند يجعله لاغياً.</p>
      </div>

      {/* FOOTER */}
      <div className="flex justify-between items-center text-[9px] text-gray-500 pt-2 border-t-2 border-black">
        <span>تاريخ الطباعة: {new Date().toLocaleDateString("ar-YE")} {new Date().toLocaleTimeString("ar-YE", { hour: "2-digit", minute: "2-digit" })}</span>
      </div>

      {/* SIGNATURES */}
      <div className="flex justify-between items-center text-xs pt-2">
        <div className="text-center">
          <p className="font-bold mb-1 text-gray-700">الختم</p>
          <div className="w-20 h-8 border-2 border-dashed border-gray-400 mx-auto rounded"></div>
        </div>
        <div className="text-center">
          <p className="font-bold mb-1 text-gray-700">توقيع المحصل</p>
          <div className="w-28 h-8 border-2 border-dashed border-gray-400 mx-auto rounded"></div>
        </div>
        <div className="text-center">
          <p className="font-bold mb-1 text-gray-700">توقيع المشترك</p>
          <div className="w-28 h-8 border-2 border-dashed border-gray-400 mx-auto rounded"></div>
        </div>
      </div>

      {/* DEMO / SUBSCRIPTION FOOTER */}
      <div className="border-t-2 border-dashed border-blue-300 pt-3 mt-2">
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-2.5">
          <p className="text-[9px] text-blue-800 font-semibold leading-relaxed text-center">
            ⚠️ هذا النظام للعرض والتجربة فقط. لمن يرغب في الحصول على هذا النظام المتكامل لإدارة فواتير المياه والفوترة ، يرجى التواصل عبر واتساب:
          </p>
          <div className="flex justify-center mt-1.5">
            <a
              href="https://wa.me/967776626456?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%20%D8%A7%D8%B1%D9%8A%D8%AF%20%D9%85%D9%86%D9%83%20%D9%87%D8%B0%D8%A7%20%D8%A7%D9%84%D9%86%D8%B8%D8%A7%D9%85%20%D8%A7%D9%84%D8%AE%D8%A7%D8%B5%20%D8%A8%D8%A5%D8%AF%D8%A7%D8%B1%D8%A9%20%D8%A7%D9%84%D9%85%D9%8A%D8%A7%D9%87%20%D9%88%D8%A7%D9%84%D9%81%D9%88%D8%AA%D8%B1%D8%A9"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center bg-green-500 hover:bg-green-600 text-white p-3 rounded-full transition-all shadow-md hover:shadow-lg hover:scale-110"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </a>
          </div>
        </div>
      </div>

      <div className="text-center pt-2 no-print">
        <button
          onClick={() => window.print()}
          className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-sm px-6 py-2.5 rounded-xl transition-colors shadow"
        >
          🖨️ طباعة
        </button>
      </div>
    </div>
  );
}
