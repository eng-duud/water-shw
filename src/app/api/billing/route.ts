import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { TENANT_ID } from '@/lib/constants';
import { getOrCreateTenant } from '@/lib/tenant';

const createCycleSchema = z.object({
  year: z.number().int().min(2000).max(2100),
  month: z.number().int().min(1).max(12),
});

export async function GET(request: NextRequest) {
  try {
    await getOrCreateTenant(TENANT_ID);
    const cycles = await prisma.billingCycle.findMany({
      where: { tenantId: TENANT_ID },
      orderBy: [
        { year: 'desc' },
        { month: 'desc' },
      ],
      include: {
        _count: {
          select: { bills: true },
        },
      },
    });
    return NextResponse.json(cycles);
  } catch (error: any) {
    console.error('Fetch billing cycles error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء جلب دورات الفوترة' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await getOrCreateTenant(TENANT_ID);
    const body = await request.json();
    const parsed = createCycleSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'بيانات غير صالحة', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { year, month } = parsed.data;

    // Check duplicate cycle
    const existing = await prisma.billingCycle.findUnique({
      where: {
        tenantId_year_month: {
          tenantId: TENANT_ID,
          year,
          month,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: `دورة الفوترة للشهر ${month}-${year} موجودة بالفعل` },
        { status: 400 }
      );
    }

    // Create billing cycle and pre-generate draft bills for all active customers in a transaction
    const cycle = await prisma.$transaction(async (tx: any) => {
      const tenantSettings = await tx.tenantSettings.findUnique({
        where: { tenantId: TENANT_ID },
      });
      const workUnitPrice = tenantSettings?.workUnitPrice || 2000;

      // Create cycle
      const newCycle = await tx.billingCycle.create({
        data: {
          tenantId: TENANT_ID,
          year,
          month,
          status: 'DRAFT',
        },
      });

      // Get active customers
      const customers = await tx.customer.findMany({
        where: {
          tenantId: TENANT_ID,
          isActive: true,
        },
      });

      // For each customer, generate a draft bill
      for (const customer of customers) {
        // Find latest meter reading from previous cycles (ISSUED or CLOSED or even DRAFT)
        const lastBill = await tx.bill.findFirst({
          where: {
            tenantId: TENANT_ID,
            customerId: customer.id,
          },
          orderBy: {
            createdAt: 'desc',
          },
        });

        const prevReading = lastBill ? lastBill.currentReading : 0;
        const workUnits = customer.workUnits;
        const workUnitsTotal = prevReading ? 0 : 0; // Wait, we calculate these below

        // Let's formulate invoice number: INV-{year}{month_padded}-{customerAccountNumber}
        const monthPadded = String(month).padStart(2, '0');
        const billNumber = `INV-${year}${monthPadded}-${customer.accountNumber}`;

        // Initial default calculation for draft: consumption = 0
        const initialWorkUnitsTotal = Number(workUnits) * Number(workUnitPrice);

        await tx.bill.create({
          data: {
            tenantId: TENANT_ID,
            billNumber,
            customerId: customer.id,
            billingCycleId: newCycle.id,
            previousReading: prevReading,
            currentReading: prevReading, // draft default
            consumption: 0,
            workUnits,
            workUnitsTotal: initialWorkUnitsTotal,
            tier1Units: 0,
            tier1Cost: 0,
            tier2Units: 0,
            tier2Cost: 0,
            totalAmount: initialWorkUnitsTotal,
            paidAmount: 0,
            status: 'PENDING',
          },
        });
      }

      return newCycle;
    });

    return NextResponse.json(cycle, { status: 201 });
  } catch (error: any) {
    console.error('Create billing cycle error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء إنشاء دورة الفوترة' }, { status: 500 });
  }
}
