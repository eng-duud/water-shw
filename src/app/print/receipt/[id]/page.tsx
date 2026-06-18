"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { numberToArabicWords } from "@/lib/num-to-words";

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
    address: string | null;
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

  const firstAlloc = receipt.allocations?.[0];
  const billTotal = firstAlloc ? Number(firstAlloc.bill.totalAmount) : 0;
  const billPaid = firstAlloc ? Number(firstAlloc.bill.paidAmount) : 0;
  const remainingAfter = Math.max(billTotal - (billPaid - receipt.allocatedAmount) - receipt.allocatedAmount, 0);
  const totalWords = numberToArabicWords(Math.round(receipt.amount));
  const formatNum = (n: number) => n.toLocaleString("en-US");

  return (
    <div className="print-container bg-white p-6 max-w-[21cm] mx-auto text-black font-sans dir-rtl">
      <div className="border-b-2 border-black pb-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 space-x-reverse">
            <img
              src="/logo.svg"
              alt="شعار المشروع"
              className="w-16 h-16 object-contain"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
            <div className="text-right">
              <h1 className="text-lg font-extrabold tracking-wide">الجمهورية اليمنية - محافظة تعز</h1>
              <h2 className="text-base font-bold mt-0.5">مشروع مياه غيل الضياء</h2>
              <p className="text-sm font-semibold text-gray-600 mt-0.5">سند قبض</p>
            </div>
          </div>
          <div className="text-left border border-black bg-gray-50 px-5 py-2 rounded">
            <p className="text-xs font-bold">رقم: {receipt.receiptNumber || receipt.id.slice(0, 8)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm border border-black p-3 mb-4 bg-gray-50/30">
        <div className="flex justify-between border-l border-gray-300 pl-2">
          <span className="text-gray-600">رقم المشترك:</span>
          <span className="font-bold">{receipt.customer.accountNumber}</span>
        </div>
        <div className="flex justify-between border-l border-gray-300 pl-2">
          <span className="text-gray-600">اسم المشترك:</span>
          <span className="font-bold">{receipt.customer.name}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">رقم العداد:</span>
          <span className="font-bold">{receipt.customer.meterNumber || "—"}</span>
        </div>
        <div className="flex justify-between border-l border-gray-300 pl-2">
          <span className="text-gray-600">طريقة الدفع:</span>
          <span className="font-bold">{PAYMENT_METHODS[receipt.paymentMethod || ''] || receipt.paymentMethod || '—'}</span>
        </div>
        <div className="flex justify-between border-l border-gray-300 pl-2">
          <span className="text-gray-600">تاريخ السند:</span>
          <span className="font-bold">{new Date(receipt.createdAt).toLocaleDateString("ar-YE")}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">المنطقة:</span>
          <span className="font-bold">{receipt.customer.address || "—"}</span>
        </div>
      </div>

      <div className="border border-black mb-4">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-100 border-b border-black">
              <th className="border-l border-black p-2 text-center font-bold text-xs">البيان</th>
              <th className="p-2 text-center font-bold text-xs">القيمة (ريال)</th>
            </tr>
          </thead>
          <tbody>
            {firstAlloc && (
              <tr className="border-b border-gray-200">
                <td className="border-l border-gray-200 p-2 pr-4">دورة الفوترة المسددة</td>
                <td className="p-2 text-center font-mono font-bold">
                  {firstAlloc.bill.billingCycle.year}/{String(firstAlloc.bill.billingCycle.month).padStart(2, '0')}
                </td>
              </tr>
            )}
            {firstAlloc && (
              <tr className="border-b border-gray-200">
                <td className="border-l border-gray-200 p-2 pr-4">رقم الفاتورة</td>
                <td className="p-2 text-center font-mono font-bold">{firstAlloc.bill.billNumber}</td>
              </tr>
            )}
            <tr className="border-b border-gray-200">
              <td className="border-l border-gray-200 p-2 pr-4">المبلغ المدفوع (الإجمالي)</td>
              <td className="p-2 text-center font-mono font-bold text-brand-600">{formatNum(receipt.amount)}</td>
            </tr>
            <tr className="border-b border-gray-200">
              <td className="border-l border-gray-200 p-2 pr-4">المبلغ الموزع على الفاتورة</td>
              <td className="p-2 text-center font-mono text-emerald-600">{formatNum(receipt.allocatedAmount)}</td>
            </tr>
            {receipt.surplusAmount > 0 && (
              <tr className="border-b border-gray-200">
                <td className="border-l border-gray-200 p-2 pr-4 text-amber-700">الرصيد الزائد (المعلق)</td>
                <td className="p-2 text-center font-mono text-amber-700">{formatNum(receipt.surplusAmount)}</td>
              </tr>
            )}
            {receipt.arrearsBefore > 0 && (
              <tr className="border-b border-gray-200">
                <td className="border-l border-gray-200 p-2 pr-4 text-rose-700">المتأخرات السابقة</td>
                <td className="p-2 text-center font-mono text-rose-700">{formatNum(receipt.arrearsBefore)}</td>
              </tr>
            )}
            <tr className="border-b border-black bg-gray-50 font-bold">
              <td className="border-l border-black p-2 pr-4 text-base">الرصيد المتبقي بعد السداد</td>
              <td className="p-2 text-center font-mono text-base text-rose-700">{formatNum(remainingAfter + receipt.surplusAmount)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="text-right text-sm font-bold border border-black p-2 mb-4 bg-gray-50/30">
        <span>المبلغ المستلم كتابةً: </span>
        <span className="border-b border-dotted border-black px-2 text-rose-700">{totalWords} ريال يمني</span>
        <span> لا غير</span>
      </div>

      {receipt.notes && (
        <div className="text-xs border border-black p-3 mb-4 bg-gray-50/30">
          <p className="font-bold mb-1">ملاحظات:</p>
          <p>{receipt.notes}</p>
        </div>
      )}

      {receipt.surplusAmount > 0 && receipt.surplusHandled && receipt.surplusNote && (
        <div className="text-xs border border-black p-3 mb-4 bg-amber-50">
          <p className="font-bold mb-1">تسوية الرصيد الزائد:</p>
          <p>{receipt.surplusNote}</p>
        </div>
      )}

      <div className="text-xs space-y-1.5 text-slate-800 leading-relaxed border border-black p-3 mb-4 bg-gray-50/30">
        <p className="font-bold text-center border-b border-gray-300 pb-1.5 mb-1.5">الضوابط والشروط</p>
        <p>1. هذا السند يُعتبر إثباتاً رسمياً لعملية السداد المذكورة أعلاه.</p>
        <p>2. يجب الاحتفاظ بهذا السند كمرجع لأي استفسارات مستقبلية.</p>
        <p>3. أي تعديل أو شطب في هذا السند يجعله لاغياً.</p>
      </div>

      <div className="flex justify-between items-center text-sm border-t-2 border-black pt-4 mb-4">
        <div className="text-center">
          <p className="font-bold mb-1">الختم</p>
          <div className="w-24 h-8 border border-dashed border-gray-400 mx-auto rounded"></div>
        </div>
        <div className="text-center">
          <p className="font-bold mb-1">توقيع المحصل</p>
          <div className="w-32 h-8 border border-dashed border-gray-400 mx-auto rounded"></div>
        </div>
        <div className="text-left text-[10px] text-gray-500">
          <p>تاريخ الطباعة: {new Date().toLocaleDateString("ar-YE")}</p>
          <p>{new Date().toLocaleTimeString("ar-YE", { hour: "2-digit", minute: "2-digit" })}</p>
        </div>
      </div>

      <div className="text-center pt-4 no-print">
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
