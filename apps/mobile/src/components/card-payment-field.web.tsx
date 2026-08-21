import { forwardRef, useImperativeHandle, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { loadStripe, type Stripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import {
  isStripeConfigured,
  getStripePublishableKey,
  createPaymentIntent,
  type CardPaymentHandle,
  type CardPaymentFieldProps,
} from '@/lib/stripe';
import { palette } from './ui';

let stripePromise: Promise<Stripe | null> | null = null;
function getStripePromise() {
  if (!stripePromise) stripePromise = loadStripe(getStripePublishableKey());
  return stripePromise;
}

export const CardPaymentField = forwardRef<CardPaymentHandle, CardPaymentFieldProps>(
  function CardPaymentField(props, ref) {
    if (!isStripeConfigured) {
      return (
        <View style={styles.box}>
          <Text style={styles.noticeText}>
            ※ Stripeの決済キー未設定のため、現在カード決済はご利用いただけません。現金払いをお選びください。
          </Text>
        </View>
      );
    }

    return (
      <Elements stripe={getStripePromise()}>
        <InnerCardField ref={ref} {...props} />
      </Elements>
    );
  }
);

const InnerCardField = forwardRef<CardPaymentHandle, CardPaymentFieldProps>(function InnerCardField(
  { amountYen, email, description, onCardCompleteChange },
  ref
) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);

  useImperativeHandle(ref, () => ({
    async confirmPayment() {
      if (!stripe || !elements) return { success: false, error: '決済の準備ができていません' };
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) return { success: false, error: 'カード情報が入力されていません' };

      setError(null);
      try {
        const { clientSecret } = await createPaymentIntent({ amountYen, reservationEmail: email, description });
        const result = await stripe.confirmCardPayment(clientSecret, {
          payment_method: { card: cardElement, billing_details: { email } },
        });
        if (result.error) {
          const message = result.error.message ?? '決済に失敗しました';
          setError(message);
          return { success: false, error: message };
        }
        return { success: true };
      } catch (err) {
        const message = err instanceof Error ? err.message : '決済に失敗しました';
        setError(message);
        return { success: false, error: message };
      }
    },
  }));

  return (
    <View style={styles.box}>
      <CardElement
        options={{
          style: {
            base: {
              color: palette.text,
              fontSize: '15px',
              '::placeholder': { color: palette.textFaint },
            },
            invalid: { color: palette.danger },
          },
        }}
        onChange={(e) => onCardCompleteChange(e.complete)}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
});

const styles = StyleSheet.create({
  box: {
    borderWidth: 1,
    borderColor: palette.cardBorder,
    borderRadius: 10,
    padding: 14,
    backgroundColor: palette.card,
  },
  noticeText: { color: palette.textFaint, fontSize: 11, lineHeight: 16 },
  errorText: { color: palette.danger, fontSize: 12, marginTop: 8 },
});
