import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ALERT_AFTER_FAILURES,
  REMIND_AFTER_MS,
  evaluate,
  type CheckResult,
  type StoredState,
} from "./health-eval.ts";

function result(name: string, status: CheckResult["status"]): CheckResult {
  return { name, label: name, status, detail: "", ms: 1 };
}

const T0 = 1_000_000;

test("a single failure does not alert (transient blips like cold starts)", () => {
  const { alerts, next } = evaluate([result("db", "fail")], new Map(), T0);
  assert.equal(alerts.length, 0);
  assert.equal(next.get("db")?.consecutiveFailures, 1);
});

test("alerts once the failure count reaches the threshold", () => {
  let state = new Map<string, StoredState>();
  let alertCount = 0;
  for (let i = 0; i < ALERT_AFTER_FAILURES; i++) {
    const e = evaluate([result("db", "fail")], state, T0 + i * 1000);
    alertCount += e.alerts.length;
    state = e.next;
  }
  assert.equal(alertCount, 1);
  assert.notEqual(state.get("db")?.lastAlertAt, null);
});

test("does not re-alert while still failing within the reminder window", () => {
  const prev = new Map<string, StoredState>([
    ["db", { status: "fail", consecutiveFailures: 5, lastAlertAt: T0 }],
  ]);
  const { alerts } = evaluate([result("db", "fail")], prev, T0 + REMIND_AFTER_MS - 1);
  assert.equal(alerts.length, 0);
});

test("sends a reminder once the reminder window has passed", () => {
  const prev = new Map<string, StoredState>([
    ["db", { status: "fail", consecutiveFailures: 5, lastAlertAt: T0 }],
  ]);
  const { alerts, next } = evaluate([result("db", "fail")], prev, T0 + REMIND_AFTER_MS);
  assert.equal(alerts.length, 1);
  assert.equal(next.get("db")?.lastAlertAt, T0 + REMIND_AFTER_MS);
});

test("sends a recovery notice only after a failure was actually alerted", () => {
  const alerted = new Map<string, StoredState>([
    ["db", { status: "fail", consecutiveFailures: 3, lastAlertAt: T0 }],
  ]);
  const recovered = evaluate([result("db", "ok")], alerted, T0 + 1000);
  assert.equal(recovered.recoveries.length, 1);
  assert.deepEqual(recovered.next.get("db"), { status: "ok", consecutiveFailures: 0, lastAlertAt: null });

  const blip = new Map<string, StoredState>([
    ["db", { status: "fail", consecutiveFailures: 1, lastAlertAt: null }],
  ]);
  assert.equal(evaluate([result("db", "ok")], blip, T0 + 1000).recoveries.length, 0);
});

test("a fail-ok-fail flapping sequence never builds up to an alert", () => {
  let state = new Map<string, StoredState>();
  let alerts = 0;
  for (const status of ["fail", "ok", "fail", "ok", "fail"] as const) {
    const e = evaluate([result("db", status)], state, T0);
    alerts += e.alerts.length;
    state = e.next;
  }
  assert.equal(alerts, 0);
});

test("skipped checks are ignored and keep their previous state", () => {
  const prev = new Map<string, StoredState>([
    ["places", { status: "fail", consecutiveFailures: 4, lastAlertAt: T0 }],
  ]);
  const { alerts, recoveries, next } = evaluate([result("places", "skipped")], prev, T0 + 1);
  assert.equal(alerts.length, 0);
  assert.equal(recoveries.length, 0);
  assert.deepEqual(next.get("places"), prev.get("places"));
});

test("checks are tracked independently of each other", () => {
  const prev = new Map<string, StoredState>([
    ["db", { status: "fail", consecutiveFailures: 1, lastAlertAt: null }],
  ]);
  const { alerts, next } = evaluate([result("db", "fail"), result("app", "ok")], prev, T0);
  assert.deepEqual(alerts.map((a) => a.name), ["db"]);
  assert.equal(next.get("app")?.status, "ok");
});
