import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { TENANT_ID } from '@/lib/constants';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'معرف الفاتورة مطلوب' }, { status: 400 });
    }

    const bill = await prisma.bill.findFirst({
      where: {
        id,
        tenantId: TENANT_ID,
      },
      include: {
        customer: true,
        billingCycle: true,
      },
    });

    if (!bill) {
      return NextResponse.json({ error: 'الفاتورة غير موجودة' }, { status: 404 });
    }

    return NextResponse.json(bill);
  } catch (error: any) {
    console.error('Fetch print bill error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء جلب الفاتورة' }, { status: 500 });
  }
}
