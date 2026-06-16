"use client";

import { useEffect, useState } from "react";

interface Customer {
  id: string;
  accountNumber: string;
  name: string;
}

interface Bill {
  id: string;
  billNumber: string;
  totalAmount: string;
  paidAmount: string;
  createdAt: string;
  billingCycle: {
    year: number;
    month: number;
  };
}

interface Payment {
  id: string;
  amount: string;
  allocatedAmount: string;
  surplusAmount: string;
  surplusHandled: boolean;
  surplusNote: string | null;
  paymentMethod: string | null;
  receiptNumber: string | null;
  notes: string | null;
  createdAt: string;
  customer: {
    name: string;
  };
  allocations: Array<{
    id: string;
    amount: string;
    bill: {
      billNumber: string;
    };
  }>;
}

export default function PaymentsPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [receiptNumber, setReceiptNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Live preview state
  const [pendingBills, setPendingBills] = useState<Bill[]>([]);
  const [allocationPreview, setAllocationPreview] = useState<Array<{
    billNumber: string;
    period: string;
    amount: number;
    remains: number;
    allocated: number;
  }>>([]);
  const [surplusPreview, setSurplusPreview] = useState(0);

  // Surplus handling modal state
  const [selectedPaymentForSurplus, setSelectedPaymentForSurplus] = useState<Payment | null>(null);
  const [surplusNoteInput, setSurplusNoteInput] = useState("");
  const [savingSurplus, setSavingSurplus] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [custRes, payRes] = await Promise.all([
        fetch("/api/customers"),
        fetch("/api/payments"),
      ]);

      if (!custRes.ok || !payRes.ok) throw new Error("فشل تحميل البيانات");

      const custData = await custRes.json();
      const payData = await payRes.json();

      setCustomers(custData.filter((c: any) => c.isActive));
      setPayments(payData);
    } catch (err: any) {
      alert(err.message || "حدث خطأ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Fetch pending bills for the selected customer to do preview
  useEffect(() => {
    if (!selectedCustomerId) {
      setPendingBills([]);
      setAllocationPreview([]);
      setSurplusPreview(0);
      return;
    }

    const fetchCustomerBills = async () => {
      try {
        const res = await fetch(`/api/customers/${selectedCustomerId}`);
        if (!res.ok) return;
        const data = await res.json();
        // filter for pending or partially paid bills
        const unpaid = (data.bills || []).filter(
          (b: any) => b.status === "PENDING" || b.status === "PARTIALLY_PAID"
        ).sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()); // oldest first
        setPendingBills(unpaid);
      } catch (err) {
        console.error("Error fetching bills for preview:", err);
      }
    };

    fetchCustomerBills();
  }, [selectedCustomerId]);

  // Calculate allocation preview whenever amount or pending bills change
  useEffect(() => {
    const paymentAmt = parseFloat(amount) || 0;
    if (paymentAmt <= 0 || pendingBills.length === 0) {
      setAllocationPreview([]);
      setSurplusPreview(paymentAmt);
      return;
    }

    let remaining = paymentAmt;
    const preview: typeof allocationPreview = [];

    pendingBills.forEach((b) => {
      const unpaid = Number(b.totalAmount) - Number(b.paidAmount);
      if (unpaid <= 0) return;

      const allocated = Math.min(remaining, unpaid);
      preview.push({
        billNumber: b.billNumber,
        period: `${b.billingCycle.year}/${String(b.billingCycle.month).padStart(2, '0')}`,
        amount: Number(b.totalAmount),
        remains: unpaid,
        allocated,
      });

      remaining -= allocated;
    });

    setAllocationPreview(preview);
    setSurplusPreview(remaining);
  }, [amount, pendingBills]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId || !amount) return;

    try {
      setSubmitting(true);
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: selectedCustomerId,
          amount: parseFloat(amount),
          paymentMethod,
          receiptNumber: receiptNumber || null,
          notes: notes || null,
        }),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "فشل تسجيل الدفعة");

      alert("تم تسجيل وتحصيل الدفعة بنجاح وتوزيعها على الفواتير المستحقة!");
      
      // Reset form
      setSelectedCustomerId("");
      setAmount("");
      setReceiptNumber("");
      setNotes("");
      fetchData();
    } catch (err: any) {
      alert(err.message || "حدث خطأ");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolveSurplus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPaymentForSurplus) return;

    try {
      setSavingSurplus(true);
      const res = await fetch(`/api/payments/${selectedPaymentForSurplus.id}/surplus`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          surplusHandled: true,
          surplusNote: surplusNoteInput,
        }),
      });

      if (!res.ok) throw new Error("فشل تسوية الرصيد الزائد");

      alert("تم تسجيل تسوية الرصيد المعلق بنجاح!");
      setSelectedPaymentForSurplus(null);
      setSurplusNoteInput("");
      fetchData();
    } catch (err: any) {
      alert(err.message || "حدث خطأ");
    } finally {
      setSavingSurplus(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800">سداد الفواتير والتحصيل المالي</h2>
        <p className="text-xs text-slate-500 mt-0.5 font-medium">تسجيل المبالغ المقبوضة وتوزيعها تلقائياً على الفواتير القديمة بنظام FIFO.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Form: Capture Payment */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-2">➕ تسجيل سند قبض جديد</h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">المشترك</label>
              <select
                required
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white text-slate-700"
              >
                <option value="">-- اختر المشترك --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    [{c.accountNumber}] - {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">المبلغ المدفوع (ريال يمني)</label>
              <input
                type="number"
                required
                min={1}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-bold text-slate-700"
                placeholder="مثال: 5000"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">طريقة الدفع</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white text-slate-700"
                >
                  <option value="CASH">نقدًا (كاش)</option>
                  <option value="BANK">تحويل بنكي / محفظة</option>
                  <option value="CHECK">شيك</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">رقم السند/المرجع</label>
                <input
                  type="text"
                  value={receiptNumber}
                  onChange={(e) => setReceiptNumber(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="رقم السند الورقي"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">ملاحظات التحصيل</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 h-20 resize-none"
                placeholder="تفاصيل إضافية عن السند..."
              />
            </div>

            {/* LIVE DISTRIBUTION PREVIEW */}
            {selectedCustomerId && (
              <div className="bg-slate-50 p-4 rounded-xl space-y-3 border border-slate-200">
                <h4 className="text-xs font-bold text-slate-700">🔍 معاينة توزيع المبلغ (FIFO):</h4>
                {allocationPreview.length === 0 ? (
                  <p className="text-[11px] text-slate-500">لا يوجد فواتير مستحقة متأخرة حالياً لهذا العميل.</p>
                ) : (
                  <div className="space-y-1 text-[11px]">
                    {allocationPreview.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-slate-600 border-b border-slate-100 pb-1">
                        <span>دورة {item.period}:</span>
                        <span>تخصيص: <span className="font-bold text-brand-600">{item.allocated.toLocaleString()}</span> / {item.remains.toLocaleString()} ريال</span>
                      </div>
                    ))}
                  </div>
                )}
                
                {surplusPreview > 0 && (
                  <div className="bg-amber-100 text-amber-900 p-2.5 rounded-lg text-xs leading-relaxed font-semibold">
                    ⚠️ سيتم تسجيل مبلغ <span className="underline">{surplusPreview.toLocaleString()} ريال</span> كرصيد زائد معلق لم يتم توزيعه.
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !selectedCustomerId || !amount}
              className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm py-2.5 rounded-xl shadow-sm transition-colors disabled:opacity-50"
            >
              {submitting ? "جاري التوزيع والتسجيل..." : "سداد وتسجيل المقبوضات"}
            </button>
          </form>
        </div>

        {/* Right Panel: Payments History & Surplus Handlers */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-2">📋 سجل المقبوضات والسندات الأخيرة</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                  <th className="p-3">المشترك</th>
                  <th className="p-3">المبلغ المقبوض</th>
                  <th className="p-3">الموزع</th>
                  <th className="p-3">الرصيد المعلق</th>
                  <th className="p-3">حالة الرصيد</th>
                  <th className="p-3 text-center">إجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center p-8 text-slate-400">جاري تحميل سجل السندات...</td>
                  </tr>
                ) : payments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center p-8 text-slate-400">لا يوجد سندات تحصيل مسجلة.</td>
                  </tr>
                ) : (
                  payments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/50">
                      <td className="p-3 font-semibold text-slate-800">{p.customer.name}</td>
                      <td className="p-3 font-bold text-slate-700">{Number(p.amount).toLocaleString()} ريال</td>
                      <td className="p-3 text-emerald-600 font-semibold">{Number(p.allocatedAmount).toLocaleString()} ريال</td>
                      <td className="p-3 text-amber-600 font-semibold">{Number(p.surplusAmount).toLocaleString()} ريال</td>
                      <td className="p-3">
                        {Number(p.surplusAmount) === 0 ? (
                          <span className="text-slate-400">—</span>
                        ) : p.surplusHandled ? (
                          <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px]">تمت التسوية</span>
                        ) : (
                          <span className="bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded text-[10px] font-bold">معلق/لم يسوَّ</span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        {Number(p.surplusAmount) > 0 && !p.surplusHandled && (
                          <button
                            onClick={() => {
                              setSelectedPaymentForSurplus(p);
                              setSurplusNoteInput(p.surplusNote || "");
                            }}
                            className="bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold px-2 py-1 rounded"
                          >
                            ⚙️ تسوية الرصيد
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Surplus Resolution Modal */}
      {selectedPaymentForSurplus && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-800">تسوية رصيد زائد معلق</h3>
              <button 
                onClick={() => setSelectedPaymentForSurplus(null)}
                className="text-slate-400 hover:text-slate-600 text-xl"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleResolveSurplus} className="space-y-4">
              <div>
                <p className="text-sm text-slate-600">
                  المشترك: <span className="font-bold text-slate-800">{selectedPaymentForSurplus.customer.name}</span>
                </p>
                <p className="text-sm text-slate-600 mt-1">
                  الرصيد المعلق للقبض: <span className="font-bold text-amber-600">{Number(selectedPaymentForSurplus.surplusAmount).toLocaleString()} ريال</span>
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">تفاصيل ومبررات تسوية الرصيد (ملاحظات)</label>
                <textarea
                  required
                  value={surplusNoteInput}
                  onChange={(e) => setSurplusNoteInput(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 h-24 resize-none"
                  placeholder="كيف تم صرف أو تسوية هذا الرصيد؟ (أو خصم يدوي مبرر من الدورة التالية)"
                />
              </div>

              <div className="flex justify-end space-x-2 space-x-reverse pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedPaymentForSurplus(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={savingSurplus}
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-bold shadow-sm transition-colors disabled:opacity-50"
                >
                  {savingSurplus ? "جاري الحفظ..." : "تأكيد وإقفال التسوية"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
