import { createRoot } from "react-dom/client";
import { GlassyOtpDemo } from "@/features/security/glassy-otp";
import { LocaleProvider } from "@/features/finance/locale-provider";

const root = document.getElementById("root");
if (!root) throw new Error("The OTP QA harness requires its root element.");

createRoot(root).render(
  <LocaleProvider>
    <GlassyOtpDemo />
  </LocaleProvider>,
);
