import { PrismaClient, BillStatus, CycleStatus } from '@prisma/client';
import { Decimal } from 'decimal.js';

const prisma = new PrismaClient();

const TENANT_ID = "ghayl-al-diya";

async function main() {
  console.log("بدء عملية تهيئة البيانات التجريبية (Seeding)...");

  // تنظيف البيانات السابقة لتجنب تكرار المفاتيح الفريدة
  await prisma.paymentAllocation.deleteMany({ where: { tenantId: TENANT_ID } });
  await prisma.payment.deleteMany({ where: { tenantId: TENANT_ID } });
  await prisma.bill.deleteMany({ where: { tenantId: TENANT_ID } });
  await prisma.billingCycle.deleteMany({ where: { tenantId: TENANT_ID } });
  await prisma.customer.deleteMany({ where: { tenantId: TENANT_ID } });
  await prisma.tenantSettings.deleteMany({ where: { tenantId: TENANT_ID } });
  
  // التأكد من وجود المستأجر الافتراضي أو إنشائه
  await prisma.tenant.upsert({
    where: { id: TENANT_ID },
    update: { name: "اسم مشروعك" },
    create: {
      id: TENANT_ID,
      name: "اسم مشروعك",
    }
  });

  // إنشاء إعدادات التسعير والفوترة
  await prisma.tenantSettings.create({
    data: {
      tenantId: TENANT_ID,
      workUnitPrice: new Decimal(2000),
      tier1Limit: new Decimal(4),
      tier1PricePerUnit: new Decimal(700),
      tier2PricePerUnit: new Decimal(1000),
    }
  });

  // تعريف المناطق والمشتركين التجريبيين
  const villages = ["المنطقة 1", "المنطقة 2", "المنطقة 3", "المنطقة 4"];
  const customerNames = Array.from({ length: 15 }, (_, i) => `عميل ${i + 1}`);

  console.log(`إنشاء ${customerNames.length} مشترك تجريبي...`);
  const customers = [];
  for (let i = 0; i < customerNames.length; i++) {
    const name = customerNames[i];
    const accountNumber = String(1000 + i + 1);
    const village = villages[i % villages.length];
    const initialReading = new Decimal(Math.floor(Math.random() * 100));
    const meterNumber = `M-${1000 + i + 1}`;
    const phone = `000${Math.floor(1000000 + Math.random() * 9000000)}`;

    const customer = await prisma.customer.create({
      data: {
        tenantId: TENANT_ID,
        accountNumber,
        name,
        phone,
        village,
        initialReading,
        meterNumber,
        isActive: true,
      }
    });
    customers.push(customer);
  }

  // تعريف دورات الفوترة (من يناير إلى مايو 2026)
  const cyclesData: { year: number; month: number; status: CycleStatus }[] = [
    { year: 2026, month: 1, status: 'CLOSED' },
    { year: 2026, month: 2, status: 'CLOSED' },
    { year: 2026, month: 3, status: 'CLOSED' },
    { year: 2026, month: 4, status: 'ISSUED' },
    { year: 2026, month: 5, status: 'DRAFT' },
  ];

  console.log("إنشاء دورات الفوترة التجريبية...");
  const cycles = [];
  for (const cData of cyclesData) {
    const cycle = await prisma.billingCycle.create({
      data: {
        tenantId: TENANT_ID,
        year: cData.year,
        month: cData.month,
        status: cData.status,
        issuedAt: cData.status !== 'DRAFT' ? new Date(cData.year, cData.month - 1, 28) : null,
      }
    });
    cycles.push(cycle);
  }

  // تتبع القراءة الحالية لكل عداد مشترك
  const currentReadings: Record<string, Decimal> = {};
  for (const customer of customers) {
    currentReadings[customer.id] = new Decimal(customer.initialReading);
  }

  console.log("توليد الفواتير وسندات القبض لكل دورة...");
  // توليد الفواتير والمدفوعات لكل دورة فوترة
  for (let cycleIdx = 0; cycleIdx < cycles.length; cycleIdx++) {
    const cycle = cycles[cycleIdx];

    for (let cIdx = 0; cIdx < customers.length; cIdx++) {
      const customer = customers[cIdx];
      const prevReading = currentReadings[customer.id];
      
      // كمية استهلاك عشوائية بين 2 إلى 15 متر مكعب
      const consumption = new Decimal(2 + Math.floor(Math.random() * 14));
      const currReading = prevReading.add(consumption);
      currentReadings[customer.id] = currReading;

      // احتساب تسعيرة الاستهلاك الشرائح
      const tier1Limit = new Decimal(4);
      const tier1Units = Decimal.min(consumption, tier1Limit);
      const tier2Units = Decimal.max(new Decimal(0), consumption.sub(tier1Limit));
      
      const tier1Cost = tier1Units.mul(700);
      const tier2Cost = tier2Units.mul(1000);
      
      const MINIMUM_FEE = new Decimal(1000);
      const consumptionCost = Decimal.max(tier1Cost.add(tier2Cost), MINIMUM_FEE);
      
      const serviceFee = new Decimal(500);
      const fine = new Decimal(0);
      const exemption = new Decimal(0);
      const totalAmount = consumptionCost.add(serviceFee).add(fine).sub(exemption);

      const billNumber = `B-${cycle.year}-${String(cycle.month).padStart(2, '0')}-${customer.accountNumber}`;
      
      // تحديد حالة الفاتورة والمبلغ المدفوع بناءً على حالة الدورة
      let billStatus: BillStatus = 'PENDING';
      let paidAmount = new Decimal(0);

      if (cycle.status === 'CLOSED') {
        billStatus = 'PAID';
        paidAmount = totalAmount;
      } else if (cycle.status === 'ISSUED') {
        const rand = Math.random();
        if (rand < 0.75) {
          billStatus = 'PAID';
          paidAmount = totalAmount;
        } else if (rand < 0.90) {
          billStatus = 'PARTIALLY_PAID';
          paidAmount = totalAmount.div(2).round();
        } else {
          billStatus = 'PENDING';
          paidAmount = new Decimal(0);
        }
      }

      const bill = await prisma.bill.create({
        data: {
          tenantId: TENANT_ID,
          billNumber,
          customerId: customer.id,
          billingCycleId: cycle.id,
          previousReading: prevReading,
          currentReading: currReading,
          consumption,
          workUnits: new Decimal(0),
          workUnitsTotal: new Decimal(0),
          tier1Units,
          tier1Cost,
          tier2Units,
          tier2Cost,
          serviceFee,
          fine,
          exemption,
          totalAmount,
          paidAmount,
          status: billStatus,
          createdAt: new Date(cycle.year, cycle.month - 1, 28),
        }
      });

      // إنشاء دفعة مالية وتخصيصها للفاتورة في حال تم السداد
      if (paidAmount.gt(0)) {
        const receiptNumber = `R-${cycle.year}-${String(cycle.month).padStart(2, '0')}-${customer.accountNumber}`;
        
        await prisma.$transaction(async (tx) => {
          const payment = await tx.payment.create({
            data: {
              tenantId: TENANT_ID,
              customerId: customer.id,
              amount: paidAmount,
              allocatedAmount: paidAmount,
              surplusAmount: new Decimal(0),
              paymentMethod: "نقدي",
              receiptNumber,
              notes: `سداد فاتورة شهر ${cycle.month}/${cycle.year}`,
              createdAt: new Date(cycle.year, cycle.month - 1, 29),
            }
          });

          await tx.paymentAllocation.create({
            data: {
              tenantId: TENANT_ID,
              paymentId: payment.id,
              billId: bill.id,
              amount: paidAmount,
              createdAt: new Date(cycle.year, cycle.month - 1, 29),
            }
          });
        });
      }
    }
  }

  console.log("تهيئة البيانات التجريبية تمت بنجاح تام!");
}

main()
  .catch((e) => {
    console.error("حدث خطأ أثناء التهيئة:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
