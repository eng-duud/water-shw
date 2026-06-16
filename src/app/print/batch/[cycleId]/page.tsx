"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface BillData {
  id: string;
  billNumber: string;
  previousReading: string;
  currentReading: string;
  consumption: string;
  workUnits: number;
  workUnitsTotal: string;
  tier1Units: string;
  tier1Cost: string;
  tier2Units: string;
  tier2Cost: string;
  totalAmount: string;
  paidAmount: string;
  notes: string | null;
  createdAt: string;
  customer: {
    accountNumber: string;
    name: string;
    phone: string | null;
    address: string | null;
  };
  billingCycle: {
    year: number;
    month: number;
  };
}

export default function BatchBillsPrint() {
  const params = useParams();
  const cycleId = params.cycleId as string;
  const [bills, setBills] = useState<BillData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!cycleId) return;
    const fetchBills = async () => {
      try {
        const response = await fetch(`/api/billing/${cycleId}`);
        if (!response.ok) throw new Error("فشل تحميل فواتير الدورة");
        const data = await response.json();
        setBills(data.bills || []);
      } catch (err) {
        console.error("Batch print fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBills();
  }, [cycleId]);

  useEffect(() => {
    if (bills.length > 0) {
      const timer = setTimeout(() => {
        window.print();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [bills]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen text-slate-500 font-medium no-print">
        جاري تجهيز دفعة الفواتير للطباعة...
      </div>
    );
  }

  if (bills.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen text-rose-500 font-bold no-print">
        لا توجد فواتير في هذه الدورة للطباعة.
      </div>
    );
  }

  return (
    <div className="space-y-8 print-container p-0">
      {/* Action panel visible only on screen (not in print output) */}
      <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-center justify-between text-amber-800 max-w-lg mx-auto no-print">
        <div className="text-xs font-semibold">
          📟 تم تجهيز ({bills.length}) فاتورة للطباعة.
        </div>
        <button
          onClick={() => window.print()}
          className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-3 py-1.5 rounded transition-colors"
        >
          🖨️ بدء الطباعة
        </button>
      </div>

      {bills.map((bill) => {
        const unpaidAmount = Number(bill.totalAmount) - Number(bill.paidAmount);
        
        return (
          <div 
            key={bill.id} 
            className="bill-page-break bg-white p-6 max-w-lg mx-auto border border-slate-200 shadow-sm rounded-lg text-slate-800 space-y-6 print:border-none print:shadow-none"
          >
            {/* Header */}
            <div className="text-center border-b-2 border-slate-800 pb-4 space-y-1">
              <h1 className="text-xl font-bold">مشروع مياه غيل الضياء - قدس المواسط</h1>
              <p className="text-xs font-semibold text-slate-600">فاتورة استهلاك المياه الشهرية</p>
            </div>

            {/* Bill Meta Data */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="font-semibold text-slate-600">رقم الفاتورة: </span>
                <span className="font-bold text-slate-900">{bill.billNumber}</span>
              </div>
              <div className="text-left">
                <span className="font-semibold text-slate-600">الدورة: </span>
                <span className="font-bold text-slate-900">{bill.billingCycle.year}/{String(bill.billingCycle.month).padStart(2, '0')}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-600">رقم الحساب: </span>
                <span className="font-bold text-slate-900">{bill.customer.accountNumber}</span>
              </div>
              <div className="text-left">
                <span className="font-semibold text-slate-600">تاريخ الإصدار: </span>
                <span className="font-bold text-slate-900">{new Date(bill.createdAt).toLocaleDateString('ar-YE')}</span>
              </div>
            </div>

            {/* Customer Information */}
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1 text-xs">
              <div>
                <span className="font-semibold text-slate-600">المشترك: </span>
                <span className="font-bold text-slate-900">{bill.customer.name}</span>
              </div>
              {bill.customer.address && (
                <div>
                  <span className="font-semibold text-slate-600">العنوان: </span>
                  <span className="text-slate-800">{bill.customer.address}</span>
                </div>
              )}
            </div>

            {/* Readings */}
            <div className="grid grid-cols-3 gap-2 border-y border-slate-200 py-3 text-center text-xs">
              <div>
                <p className="text-slate-500 font-semibold mb-1">القراءة السابقة</p>
                <p className="text-sm font-bold text-slate-800">{Number(bill.previousReading)}</p>
              </div>
              <div className="border-x border-slate-200">
                <p className="text-slate-500 font-semibold mb-1">القراءة الحالية</p>
                <p className="text-sm font-bold text-slate-800">{Number(bill.currentReading)}</p>
              </div>
              <div>
                <p className="text-slate-500 font-semibold mb-1">الاستهلاك (م٣)</p>
                <p className="text-sm font-bold text-brand-600">{Number(bill.consumption)}</p>
              </div>
            </div>

            {/* Financial Breakdown Table */}
            <div className="space-y-2 text-xs">
              <h3 className="font-bold text-slate-800 border-b border-slate-200 pb-1">تفاصيل الحساب المالي</h3>
              
              <table className="w-full text-right">
                <thead>
                  <tr className="text-slate-500 font-semibold border-b border-slate-100">
                    <th className="pb-1">البند</th>
                    <th className="pb-1">الكمية/الوحدات</th>
                    <th className="pb-1">سعر الوحدة</th>
                    <th className="pb-1 text-left">الإجمالي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  <tr>
                    <td className="py-2">رسوم ثابتة (وحدات العمل)</td>
                    <td className="py-2">{bill.workUnits} وحدة</td>
                    <td className="py-2">2,000 ريال</td>
                    <td className="py-2 text-left font-bold">{Number(bill.workUnitsTotal).toLocaleString()} ريال</td>
                  </tr>
                  {Number(bill.tier1Units) > 0 && (
                    <tr>
                      <td className="py-2">الاستهلاك: الشريحة الأولى (0 - 4 م٣)</td>
                      <td className="py-2">{Number(bill.tier1Units)} م٣</td>
                      <td className="py-2">700 ريال</td>
                      <td className="py-2 text-left font-bold">{Number(bill.tier1Cost).toLocaleString()} ريال</td>
                    </tr>
                  )}
                  {Number(bill.tier2Units) > 0 && (
                    <tr>
                      <td className="py-2">الاستهلاك: الشريحة الثانية (&gt; 4 م٣)</td>
                      <td className="py-2">{Number(bill.tier2Units)} م٣</td>
                      <td className="py-2">1,000 ريال</td>
                      <td className="py-2 text-left font-bold">{Number(bill.tier2Cost).toLocaleString()} ريال</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Grand Total */}
            <div className="border-t-2 border-slate-800 pt-4 space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-700">
                <span>إجمالي مبلغ الفاتورة الحالية:</span>
                <span className="font-bold text-slate-900">{Number(bill.totalAmount).toLocaleString()} ريال</span>
              </div>
              <div className="flex justify-between items-center text-emerald-700">
                <span>المبالغ المسددة:</span>
                <span className="font-bold">-{Number(bill.paidAmount).toLocaleString()} ريال</span>
              </div>
              <div className="flex justify-between items-center text-sm font-extrabold text-rose-700 bg-rose-50 p-2.5 rounded-lg border border-rose-100">
                <span>المبلغ المطلوب سداده (المستحق):</span>
                <span>{unpaidAmount.toLocaleString()} ريال</span>
              </div>
            </div>

            {/* Footer / Notes */}
            <div className="text-center text-[10px] text-slate-500 pt-4 border-t border-slate-100 space-y-1">
              {bill.notes && <p className="font-medium text-slate-700 mb-1">ملاحظة: {bill.notes}</p>}
              <p>الرجاء سداد الفاتورة خلال فترة أسبوع لتجنب تراكم المديونية.</p>
              <p className="font-semibold text-slate-600">نشكر تعاونكم في استدامة هذا المشروع الأهلي الهام.</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
