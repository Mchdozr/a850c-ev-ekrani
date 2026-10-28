import assert from "node:assert/strict";
import test from "node:test";
import { formatIstanbulDate, formatIstanbulTime } from "../lib/time";

test("clock uses Istanbul time and names the location across UTC midnight", () => {
  const now = new Date("2026-10-28T23:30:00Z");
  assert.equal(formatIstanbulTime(now), "02:30");
  assert.equal(formatIstanbulDate(now), "29 Ekim Perşembe · İstanbul");
});
