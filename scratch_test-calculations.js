const Decimal = require('decimal.js');

const DEFAULT_PRICING = {
  workUnitPrice: 2000,
  tier1Limit: 4,
  tier1Price: 700,
  tier2Price: 1000,
};

function calculateBill(params) {
  const previous = new Decimal(params.previousReading);
  const current = new Decimal(params.currentReading);
  
  const wUnitPrice = new Decimal(params.workUnitPrice ?? DEFAULT_PRICING.workUnitPrice);
  const t1Limit = new Decimal(params.tier1Limit ?? DEFAULT_PRICING.tier1Limit);
  const t1Price = new Decimal(params.tier1Price ?? DEFAULT_PRICING.tier1Price);
  const t2Price = new Decimal(params.tier2Price ?? DEFAULT_PRICING.tier2Price);

  // Consumption = Current - Previous
  const consumption = Decimal.max(current.minus(previous), new Decimal(0));
  
  // Work units fee
  const workUnitsTotal = new Decimal(params.workUnits).times(wUnitPrice);
  
  // Tier 1 calculation: From 0 to tier1Limit (usually 4)
  const tier1Units = Decimal.min(consumption, t1Limit);
  const tier1Cost = tier1Units.times(t1Price);
  
  // Tier 2 calculation: Above tier1Limit
  const tier2Units = Decimal.max(consumption.minus(t1Limit), new Decimal(0));
  const tier2Cost = tier2Units.times(t2Price);
  
  // Total Bill
  const totalAmount = workUnitsTotal.plus(tier1Cost).plus(tier2Cost);
  
  return {
    consumption: consumption.toString(),
    workUnitsTotal: workUnitsTotal.toString(),
    tier1Units: tier1Units.toString(),
    tier1Cost: tier1Cost.toString(),
    tier2Units: tier2Units.toString(),
    tier2Cost: tier2Cost.toString(),
    totalAmount: totalAmount.toString(),
  };
}

// Test Case
const testParams = {
  workUnits: 1,
  previousReading: "34.4",
  currentReading: "47.1"
};

console.log("=== تشغيل اختبار محرك حساب الفواتير ===");
console.log("المدخلات الأساسية للاختبار:");
console.log(`- وحدات العمل للمشترك: ${testParams.workUnits}`);
console.log(`- القراءة السابقة للمشترك: ${testParams.previousReading}`);
console.log(`- القراءة الحالية للمشترك: ${testParams.currentReading}`);
console.log("---------------------------------------");

const result = calculateBill(testParams);

console.log("النتائج المحسوبة:");
console.log(`- الاستهلاك الفعلي: ${result.consumption} م٣`);
console.log(`- تكلفة وحدات العمل (ثابتة): ${result.workUnitsTotal} ريال`);
console.log(`- استهلاك الشريحة الأولى (م٣): ${result.tier1Units} م٣`);
console.log(`- تكلفة الشريحة الأولى: ${result.tier1Cost} ريال`);
console.log(`- استهلاك الشريحة الثانية (م٣): ${result.tier2Units} م٣`);
console.log(`- تكلفة الشريحة الثانية: ${result.tier2Cost} ريال`);
console.log("---------------------------------------");
console.log(`💰 المبلغ الإجمالي للفاتورة: ${result.totalAmount} ريال يمني`);

const expected = "13500";
if (result.totalAmount === expected) {
  console.log("✅ نجاح الاختبار! النتيجة مطابقة تماماً للمتوقع (13,500 ريال).");
} else {
  console.log(`❌ فشل الاختبار! القيمة المتوقعة: ${expected}، القيمة المحسوبة: ${result.totalAmount}`);
}
