import Decimal from 'decimal.js';
import { DEFAULT_PRICING } from './constants';

interface BillingParams {
  workUnits: number;
  previousReading: Decimal | number | string;
  currentReading: Decimal | number | string;
  workUnitPrice?: Decimal | number | string;
  tier1Limit?: Decimal | number | string;
  tier1Price?: Decimal | number | string;
  tier2Price?: Decimal | number | string;
}

interface BillingResult {
  consumption: Decimal;
  workUnitsTotal: Decimal;
  tier1Units: Decimal;
  tier1Cost: Decimal;
  tier2Units: Decimal;
  tier2Cost: Decimal;
  totalAmount: Decimal;
}

export function calculateBill(params: BillingParams): BillingResult {
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
    consumption,
    workUnitsTotal,
    tier1Units,
    tier1Cost,
    tier2Units,
    tier2Cost,
    totalAmount,
  };
}
