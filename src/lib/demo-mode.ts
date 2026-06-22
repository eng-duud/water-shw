import { NextResponse } from 'next/server';

export const isDemoMode = () =>
  process.env.NEXT_PUBLIC_DEMO_MODE === 'true' ||
  process.env.NEXT_PUBLIC_DEMO_MODE === '1';

export function demoResponse(data?: Record<string, unknown>) {
  return NextResponse.json(
    {
      success: true,
      demo: true,
      message: 'هذا النظام للعرض فقط. لم يتم حفظ البيانات في قاعدة البيانات.',
      ...data,
    },
    { status: 200 }
  );
}
