import { test } from "node:test";
import assert from "node:assert/strict";
import { describeWhen, jstDayKey, jstMonthKey } from "./jst.ts";

// 2026-10-15 23:30 JST（= 世界標準時では同日の14:30）。日付をまたぐ判定の基準にする。
const NOW = Date.parse("2026-10-15T23:30:00+09:00");

test("day key uses Japan time, not UTC", () => {
  // 世界標準時では10/15だが、日本時間ではもう10/16。
  assert.equal(jstDayKey("2026-10-15T15:30:00Z"), "2026-10-16");
  assert.equal(jstDayKey("2026-10-15T14:59:00Z"), "2026-10-15");
});

test("month key rolls over at midnight JST", () => {
  assert.equal(jstMonthKey("2026-10-31T14:59:00Z"), "2026-10");
  assert.equal(jstMonthKey("2026-10-31T15:00:00Z"), "2026-11");
});

test("describes imminent bookings in minutes", () => {
  assert.equal(describeWhen("2026-10-15T23:55:00+09:00", NOW), "あと25分");
  assert.equal(describeWhen("2026-10-15T23:31:00+09:00", NOW), "あと1分");
});

test("describes bookings a few hours away in hours", () => {
  assert.equal(describeWhen("2026-10-16T02:30:00+09:00", NOW), "あと3時間");
});

test("describes already-started bookings", () => {
  assert.equal(describeWhen("2026-10-15T23:00:00+09:00", NOW), "30分前に開始");
  assert.equal(describeWhen("2026-10-15T20:30:00+09:00", NOW), "3時間前に開始");
});

test("uses 今日 / 明日 across the JST day boundary", () => {
  assert.equal(describeWhen("2026-10-16T12:00:00+09:00", NOW), "明日 12:00");
  assert.equal(describeWhen("2026-10-15T23:59:00+09:00", Date.parse("2026-10-15T10:00:00+09:00")), "今日 23:59");
});

test("falls back to a dated label for later days", () => {
  assert.match(describeWhen("2026-10-20T20:00:00+09:00", NOW), /^10\/20.*20:00$/);
});
