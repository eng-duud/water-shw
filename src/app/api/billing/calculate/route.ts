import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { calculateBill } from '@/lib/billing';
import prisma from '@/lib/prisma';
import { TENANT_ID } from '@/lib/constants';

const calculateRequestSchema = z.object({
  workUnits: z.number().int().min(0),
  previousReading: z.number().min(0),
  currentReading: z.number().min(0),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = calculateRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'بيانات غير صالحة', details: parsed.error.format() },
        { status: 400 }
      );
    }

    // Get live prices from DB Settings (or fallback to defaults inside calculateBill)
    const settings = await prisma.tenantSettings.findUnique({
      where: { tenantId: TENANT_ID },
    });

    const calc = calculateBill({
      workUnits: parsed.data.workUnits,
      previousReading: parsed.data.previousReading,
      currentReading: parsed.data.currentReading,
      workUnitPrice: settings?.workUnitPrice,
      tier1Limit: settings?.tier1Limit,
      tier1Price: settings?.tier1PricePerUnit,
      tier2Price: settings?.tier2PricePerUnit,
    });

    return NextResponse.json({
      consumption: calc.consumption.toNumber(),
      workUnitsTotal: calc.workUnitsTotal.toNumber(),
      tier1Units: calc.tier1Units.toNumber(),
      tier1Cost: calc.tier1Cost.toNumber(),
      tier2Units: calc.tier2Units.toNumber(),
      tier2Cost: calc.tier2Cost.toNumber(),
      totalAmount: calc.totalAmount.toNumber(),
    });
  } catch (error: any) {
    console.error('Real-time calculate error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء إجراء الحساب' }, { status: 500 });
  }
}
