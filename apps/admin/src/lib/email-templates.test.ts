import { test } from "node:test";
import assert from "node:assert/strict";
import { renderReservationCancelledEmail } from "./email-templates.ts";

const base = {
  fullName: "山田 太郎",
  reservationId: "0f3c9a52-1111-4222-8333-444455556666",
  locationName: "甲府 居酒屋テスト",
  requestedDatetimeLabel: "2026年10月20日(火) 19:00",
  guestCount: 4,
  companionCount: 2,
};

test("declined before confirmation reads as 'could not accept'", () => {
  const html = renderReservationCancelledEmail({ ...base, wasConfirmed: false });
  assert.match(html, /ご予約をお受けできませんでした/);
  assert.doesNotMatch(html, /ご予約キャンセルのご案内/);
  assert.match(html, /山田 太郎 様/);
  assert.match(html, /0f3c9a52-1111-4222-8333-444455556666/);
  assert.match(html, /\/booking"/);
});

test("cancelling a confirmed reservation reads as a cancellation notice", () => {
  const html = renderReservationCancelledEmail({ ...base, wasConfirmed: true });
  assert.match(html, /ご予約キャンセルのご案内/);
  assert.doesNotMatch(html, /お受けすることができませんでした/);
});

test("operator message is shown and HTML-escaped; blank message is omitted", () => {
  const withMessage = renderReservationCancelledEmail({
    ...base,
    wasConfirmed: false,
    message: "当日は満員のため <b>別日</b> をご検討ください",
  });
  assert.match(withMessage, /URARAからのメッセージ/);
  assert.match(withMessage, /&lt;b&gt;別日&lt;\/b&gt;/);
  assert.doesNotMatch(withMessage, /<b>別日<\/b>/);

  const blank = renderReservationCancelledEmail({ ...base, wasConfirmed: false, message: "   " });
  assert.doesNotMatch(blank, /URARAからのメッセージ/);
});
