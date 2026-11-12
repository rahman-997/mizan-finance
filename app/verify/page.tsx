import type { Metadata } from "next";
import { GlassyOtpDemo } from "@/features/security/glassy-otp";

export const metadata: Metadata = {
  title: "OTP Interface Preview",
  description: "A glass-style OTP interface concept for Mizan Finance. This is not real authentication.",
};

export default function VerifyPreviewPage() {
  return <GlassyOtpDemo />;
}
