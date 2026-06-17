import { Prisma } from '@prisma/client';
import Decimal from 'decimal.js';
import prisma from './prisma';

interface PaymentInput {
  tenantId: string;
  customerId: string;
  amount: number | string | Decimal;
  paymentMethod?: string | null;
  receiptNumber?: string | null;
  notes?: string | null;
}

export async function distributePayment(input: PaymentInput) {
  const amountDecimal = new Decimal(input.amount);
  if (amountDecimal.lessThanOrEqualTo(0)) {
    throw new Error("يجب أن يكون مبلغ السداد أكبر من الصفر.");
  }

  return await prisma.$transaction(async (tx: any) => {
    // 1. Fetch all pending or partially paid bills for this customer, oldest first
    const pendingBills = await tx.bill.findMany({
      where: {
        tenantId: input.tenantId,
        customerId: input.customerId,
        status: {
          in: ['PENDING', 'PARTIALLY_PAID'],
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // 2. Create the Payment record
    const payment = await tx.payment.create({
      data: {
        tenantId: input.tenantId,
        customerId: input.customerId,
        amount: amountDecimal,
        paymentMethod: input.paymentMethod || null,
        receiptNumber: input.receiptNumber || null,
        notes: input.notes || null,
        allocatedAmount: 0,
        surplusAmount: 0,
        surplusHandled: false,
      },
    });

    let remainingPayment = amountDecimal;
    const allocations: Array<{ billId: string; amount: Decimal }> = [];

    // 3. Allocate to pending bills sequentially
    for (const bill of pendingBills) {
      if (remainingPayment.lessThanOrEqualTo(0)) break;

      const totalBillAmount = new Decimal(bill.totalAmount);
      const currentPaid = new Decimal(bill.paidAmount);
      const unpaidAmount = totalBillAmount.minus(currentPaid);

      if (unpaidAmount.lessThanOrEqualTo(0)) continue;

      const allocateAmount = Decimal.min(remainingPayment, unpaidAmount);
      const newPaidAmount = currentPaid.plus(allocateAmount);
      
      let newStatus: 'PENDING' | 'PARTIALLY_PAID' | 'PAID' = 'PARTIALLY_PAID';
      if (newPaidAmount.equals(totalBillAmount)) {
        newStatus = 'PAID';
      }

      // Update bill
      await tx.bill.update({
        where: { id: bill.id },
        data: {
          paidAmount: newPaidAmount,
          status: newStatus,
        },
      });

      // Create allocation record
      await tx.paymentAllocation.create({
        data: {
          tenantId: input.tenantId,
          paymentId: payment.id,
          billId: bill.id,
          amount: allocateAmount,
        },
      });

      allocations.push({
        billId: bill.id,
        amount: allocateAmount,
      });

      remainingPayment = remainingPayment.minus(allocateAmount);
    }

    // 4. Handle surplus if remaining payment is greater than 0
    let finalAllocated = amountDecimal.minus(remainingPayment);
    let finalSurplus = remainingPayment;
    let isSurplusDetected = finalSurplus.greaterThan(0);

    await tx.payment.update({
      where: { id: payment.id },
      data: {
        allocatedAmount: finalAllocated,
        surplusAmount: finalSurplus,
        // If there's no surplus, it's auto-handled. Otherwise, it requires manual handling.
        surplusHandled: !isSurplusDetected,
      },
    });

    return {
      paymentId: payment.id,
      amount: amountDecimal.toNumber(),
      allocatedAmount: finalAllocated.toNumber(),
      surplusAmount: finalSurplus.toNumber(),
      surplusHandled: !isSurplusDetected,
      allocations: allocations.map(a => ({ billId: a.billId, amount: a.amount.toNumber() })),
    };
  });
}
