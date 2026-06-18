import { NextResponse } from 'next/server';
import { generateReceiptNumber } from '@/lib/payment-distribution';
import { TENANT_ID } from '@/lib/constants';

export async function GET() {
  try {
    const receiptNumber = await generateReceiptNumber(TENANT_ID);
    return NextResponse.json({ receiptNumber });
  } catch (error: any) {
    console.error('Generate receipt number error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء توليد رقم السند' }, { status: 500 });
  }
}
