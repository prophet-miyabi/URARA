const PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY;

export const isStripeConfigured = Boolean(PUBLISHABLE_KEY);

export function getStripePublishableKey(): string {
  if (!PUBLISHABLE_KEY) throw new Error('Stripe publishable key is not configured');
  return PUBLISHABLE_KEY;
}

const ADMIN_API_BASE_URL = process.env.EXPO_PUBLIC_ADMIN_API_BASE_URL ?? 'https://urara-admin.onrender.com';

export interface CreatePaymentIntentResult {
  clientSecret: string;
}

export interface CardPaymentHandle {
  confirmPayment: () => Promise<{ success: boolean; error?: string }>;
}

export interface CardPaymentFieldProps {
  amountYen: number;
  email: string;
  description: string;
  onCardCompleteChange: (complete: boolean) => void;
}

// Amount is in whole yen — JPY is a zero-decimal currency for Stripe, so no
// cents conversion is needed (unlike USD).
export async function createPaymentIntent(params: {
  amountYen: number;
  reservationEmail: string;
  description: string;
}): Promise<CreatePaymentIntentResult> {
  const res = await fetch(`${ADMIN_API_BASE_URL}/api/create-payment-intent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amountYen: params.amountYen,
      receiptEmail: params.reservationEmail,
      description: params.description,
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `決済の準備に失敗しました (${res.status})`);
  }

  return res.json();
}
