"use client";

import { isDemoMode } from "@/lib/demo-mode";

export default function DemoBanner() {
  if (!isDemoMode()) return null;

  return (
    <div className="bg-amber-500 text-white text-center py-2 px-4 text-sm font-bold shadow-md no-print">
      ⚠️ نظام تجريبي - للعرض فقط. لن يتم حفظ أي بيانات في قاعدة البيانات.
    </div>
  );
}
