import assert from "node:assert/strict";
import test from "node:test";
import { normalizeOtp, isCompleteOtp, verifyPreviewOtp } from "../lib/otp-code.mjs";

test("normalizes Arabic and Persian digits while ignoring punctuation", () => {
  assert.equal(normalizeOtp("١۲٣4-5٦7"), "123456");
});
test("truncates OTP to six numeric digits", () => {
  assert.equal(normalizeOtp("123456789"), "123456");
  assert.equal(normalizeOtp("  "), "");
});
test("does not accept partial or non-digit codes", () => {
  assert.equal(isCompleteOtp("12345"), false);
  assert.equal(isCompleteOtp("123456"), true);
  assert.equal(isCompleteOtp("12345a"), false);
});
test("never treats arbitrary codes as preview success", () => {
  assert.equal(verifyPreviewOtp("246810"), true);
  assert.equal(verifyPreviewOtp("123456"), false);
  assert.equal(verifyPreviewOtp(""), false);
});
