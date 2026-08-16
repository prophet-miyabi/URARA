export interface PricingRules {
  baseHours: number;
  basePricePerPerson: number;
  extensionHourPricePerPerson: number;
  sameDayCancellationPenaltyPerPerson: number;
  minCompanionCount: number;
}

export const DEFAULT_PRICING_RULES: PricingRules = {
  baseHours: 2,
  basePricePerPerson: 13_200,
  extensionHourPricePerPerson: 6_600,
  sameDayCancellationPenaltyPerPerson: 13_200,
  minCompanionCount: 1,
};

export interface PriceInput {
  companionCount: number;
  durationHours: number;
  travelFee?: number;
  rules?: PricingRules;
}

export interface PriceBreakdown {
  companionCount: number;
  durationHours: number;
  extensionHours: number;
  basePrice: number;
  extensionPrice: number;
  travelFee: number;
  totalPrice: number;
}

export function calculatePrice(input: PriceInput): PriceBreakdown {
  const rules = input.rules ?? DEFAULT_PRICING_RULES;
  const { companionCount, durationHours } = input;
  const travelFee = input.travelFee ?? 0;

  if (companionCount < rules.minCompanionCount) {
    throw new Error(`companionCount must be at least ${rules.minCompanionCount}`);
  }
  if (durationHours < rules.baseHours) {
    throw new Error(`durationHours must be at least ${rules.baseHours}`);
  }

  const extensionHours = durationHours - rules.baseHours;
  const basePrice = rules.basePricePerPerson * companionCount;
  const extensionPrice = rules.extensionHourPricePerPerson * extensionHours * companionCount;
  const totalPrice = basePrice + extensionPrice + travelFee;

  return {
    companionCount,
    durationHours,
    extensionHours,
    basePrice,
    extensionPrice,
    travelFee,
    totalPrice,
  };
}

export interface CancellationPenaltyInput {
  companionCount: number;
  isSameDay: boolean;
  rules?: PricingRules;
}

export function calculateCancellationPenalty(input: CancellationPenaltyInput): number {
  const rules = input.rules ?? DEFAULT_PRICING_RULES;
  if (!input.isSameDay) return 0;
  return rules.sameDayCancellationPenaltyPerPerson * input.companionCount;
}

export function formatYen(amount: number): string {
  return `¥${amount.toLocaleString('ja-JP')}`;
}
