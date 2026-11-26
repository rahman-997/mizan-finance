import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

// Static guard for the 390px header overflow (measured in a real browser: scrollWidth 438 vs clientWidth 390,
// theme toggle off-screen). The header row on mobile must not contain the sidebar OTP link, and the floating
// OTP pill must not sit on the add-transaction button.
const css = readFileSync("app/globals.css", "utf8");

test("mobile header hides the sidebar OTP link so the actions row fits", () => {
  const block = css.slice(css.indexOf("@media (max-width: 760px)"));
  assert.match(block, /\.sidebar-panel > a\.nav-link\s*\{\s*display:\s*none/);
});

test("floating OTP pill is anchored opposite the add-transaction button", () => {
  assert.match(css, /\.mizan-mobile-otp-preview\s*\{[^}]*left:16px/);
  assert.match(css, /\[dir="rtl"\] \.mizan-mobile-otp-preview\s*\{\s*left:auto;\s*right:16px/);
});
