import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { TENANT_ID } from '@/lib/constants';
import { isDemoMode, demoResponse } from '@/lib/demo-mode';

const handleSurplusSchema = z.object({
  surplusHandled: z.boolean(),
  surplusNote: z.string().optional().nullable(),
});

type ContextType = {
  params: Promise<{ id: string }>;
};

export async function PUT(
  request: NextRequest,
  context: ContextType
) {
  try {
    if (isDemoMode()) {
      return demoResponse({ updated: null });
    }

    const { id } = await context.params;
    const body = await request.json();
    const parsed = handleSurplusSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'بيانات غير صالحة', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const payment = await prisma.payment.findFirst({
      where: {
        id,
        tenantId: TENANT_ID,
      },
    });

    if (!payment) {
      return NextResponse.json({ error: 'الدفعة غير موجودة' }, { status: 404 });
    }

    const updated = await prisma.payment.update({
      where: { id },
      data: {
        surplusHandled: parsed.data.surplusHandled,
        surplusNote: parsed.data.surplusNote,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Handle surplus error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء معالجة الرصيد المعلق' }, { status: 500 });
  }
}
