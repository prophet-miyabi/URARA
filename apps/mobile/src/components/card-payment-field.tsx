import { forwardRef, useImperativeHandle } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { CardPaymentHandle, CardPaymentFieldProps } from '@/lib/stripe';
import { palette } from './ui';

// Native (iOS/Android) card payment isn't wired up yet — that needs the
// separate @stripe/stripe-react-native native SDK once this ships as an
// actual native build via EAS. The web version (card-payment-field.web.tsx)
// is the one live today since the app is currently distributed as a website.
export const CardPaymentField = forwardRef<CardPaymentHandle, CardPaymentFieldProps>(
  function CardPaymentField(_props, ref) {
    useImperativeHandle(ref, () => ({
      async confirmPayment() {
        return { success: false, error: 'このアプリ版ではカード決済に対応していません。現金払いをお選びください。' };
      },
    }));

    return (
      <View style={styles.box}>
        <Text style={styles.noticeText}>
          ※ カード決済は現在Web版のみ対応しています。現金払いをお選びください。
        </Text>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  box: {
    borderWidth: 1,
    borderColor: palette.cardBorder,
    borderRadius: 10,
    padding: 14,
    backgroundColor: palette.card,
  },
  noticeText: { color: palette.textFaint, fontSize: 11, lineHeight: 16 },
});
