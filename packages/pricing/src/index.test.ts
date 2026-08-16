import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculatePrice, calculateCancellationPenalty } from './index.ts';

test('base price for 1 companion, 2 hours', () => {
  const result = calculatePrice({ companionCount: 1, durationHours: 2 });
  assert.equal(result.basePrice, 13_200);
  assert.equal(result.extensionPrice, 0);
  assert.equal(result.totalPrice, 13_200);
});

test('2 companions, 2 hours matches spec example (26,400 + travel fee)', () => {
  const result = calculatePrice({ companionCount: 2, durationHours: 2, travelFee: 3_000 });
  assert.equal(result.basePrice, 26_400);
  assert.equal(result.totalPrice, 29_400);
});

test('extension hour adds 6,600 per companion', () => {
  const result = calculatePrice({ companionCount: 2, durationHours: 3 });
  assert.equal(result.extensionHours, 1);
  assert.equal(result.extensionPrice, 13_200);
  assert.equal(result.totalPrice, 26_400 + 13_200);
});

test('rejects companion count below minimum', () => {
  assert.throws(() => calculatePrice({ companionCount: 0, durationHours: 2 }));
});

test('same-day cancellation penalty is 13,200 per companion', () => {
  assert.equal(calculateCancellationPenalty({ companionCount: 2, isSameDay: true }), 26_400);
  assert.equal(calculateCancellationPenalty({ companionCount: 2, isSameDay: false }), 0);
});
