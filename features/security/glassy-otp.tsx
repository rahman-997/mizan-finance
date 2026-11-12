"use client";

/* eslint-disable @next/next/no-html-link-for-pages -- Vinext uses full-page navigation to avoid preview cache issues. */

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Globe2, LockKeyhole, RefreshCw, ShieldCheck, Sparkles } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useLocale } from "@/features/finance/locale-provider";
import { isCompleteOtp, normalizeOtp, verifyPreviewOtp } from "@/lib/otp-code.mjs";
import "./glassy-otp.css";

type Language = "en" | "ar" | "tr";
type State = "idle" | "checking" | "error" | "success";
const copy = {
  en: {
    back: "Back to overview", preview: "INTERACTIVE UI PREVIEW", concept: "MIZAN / IDENTITY CONCEPT",
    hero1: "Beautifully clear.", hero2: "Purposefully designed.",
    intro: "An elegant glass-inspired verification experience for the next chapter of Mizan.",
    points: ["Six-digit code entry", "Keyboard and paste ready", "Accessible by design"],
    disclaimer: "UI prototype only. No SMS is sent. This screen does not protect your financial data.",
    title: "Verify your number", caption: "Enter the six-digit code to explore the interaction.",
    codeLabel: "Six-digit verification code", demoLabel: "Preview code", submit: "Verify preview code",
    checking: "Checking...", error: "Incorrect preview code. Use 246810.",
    success: "Animation complete", successDetail: "Visual success only. No real login or verification has taken place.",
    reset: "Reset preview", cooldown: "Reset available in", resetNotice: "Preview reset. No message was sent.",
  },
  ar: {
    back: "العودة إلى النظرة العامة", preview: "معاينة تفاعلية للواجهة", concept: "ميزان / مفهوم التحقق",
    hero1: "وضوح في التصميم.", hero2: "عناية في التفاصيل.",
    intro: "واجهة تحقق بتأثيرات زجاجية، مصممة للمرحلة القادمة من مشروع ميزان.",
    points: ["رمز من ست خانات", "دعم لوحة المفاتيح واللصق", "واجهة سهلة الوصول"],
    disclaimer: "هذه معاينة فقط. لا تُرسل رسائل نصية ولا تحمي الشاشة بياناتك المالية.",
    title: "تأكيد رقم هاتفك", caption: "أدخل الرمز المكوّن من ست خانات لتجربة الواجهة.",
    codeLabel: "رمز التحقق المكوّن من ست خانات", demoLabel: "رمز المعاينة", submit: "تجربة التحقق",
    checking: "جارٍ الفحص...", error: "رمز المعاينة غير صحيح. استخدم 246810.",
    success: "اكتملت الحركة بنجاح", successDetail: "نجاح بصري تجريبي فقط، وليس تسجيلاً للدخول أو تحققاً فعلياً.",
    reset: "إعادة ضبط المعاينة", cooldown: "تتوفر إعادة الضبط خلال", resetNotice: "أُعيد ضبط المعاينة. لم تُرسل رسالة.",
  },
  tr: {
    back: "Genel bakışa dön", preview: "ETKİLEŞİMLİ ARAYÜZ ÖNİZLEMESİ", concept: "MIZAN / DOĞRULAMA KONSEPTİ",
    hero1: "Net bir tasarım.", hero2: "Özenli detaylar.",
    intro: "Mizan'ın geleceği için cam efektleriyle tasarlanmış bir doğrulama deneyimi.",
    points: ["Altı haneli kod girişi", "Klavye ve yapıştırma desteği", "Erişilebilir tasarım"],
    disclaimer: "Bu yalnızca bir arayüz prototipidir. SMS gönderilmez. Finansal verileriniz bu ekranla korunmaz.",
    title: "Numaranızı doğrulayın", caption: "Arayüzü denemek için altı haneli kodu girin.",
    codeLabel: "Altı haneli doğrulama kodu", demoLabel: "Önizleme kodu", submit: "Önizleme kodunu doğrula",
    checking: "Kontrol ediliyor...", error: "Önizleme kodu yanlış. 246810 kullanın.",
    success: "Animasyon tamamlandı", successDetail: "Yalnızca görsel bir başarı durumudur; gerçek giriş veya doğrulama değildir.",
    reset: "Önizlemeyi sıfırla", cooldown: "Sıfırlamaya kalan süre", resetNotice: "Önizleme sıfırlandı. Mesaj gönderilmedi.",
  },
} satisfies Record<Language, Record<string, string | string[]>>;

/**
 * Reusable UI component. A real integration MUST verify codes server-side, enforce
 * rate limits and expiry server-side, and create a server-backed session.
 * Never use verifyPreviewOtp as a real authentication callback.
 */
export function GlassyOtp({
  language, onVerify, onResend, isPreview = false,
}: {
  language: Language;
  onVerify: (code: string) => Promise<boolean>;
  onResend?: () => Promise<void>;
  isPreview?: boolean;
}) {
  const t = copy[language];
  const [code, setCode] = useState("");
  const [state, setState] = useState<State>("idle");
  const [seconds, setSeconds] = useState(20);
  const [notice, setNotice] = useState("");
  const operation = useRef(0);

  useEffect(() => {
    if (seconds === 0 || state === "success") return;
    const timeout = window.setTimeout(() => setSeconds(value => Math.max(0, value - 1)), 1000);
    return () => window.clearTimeout(timeout);
  }, [seconds, state]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isCompleteOtp(code) || state === "checking" || state === "success") return;
    const id = ++operation.current;
    setState("checking");
    setNotice("");
    try {
      const success = await onVerify(code);
      if (id === operation.current) setState(success ? "success" : "error");
    } catch {
      if (id === operation.current) setState("error");
    }
  }

  function restartPreview() {
    if (!isPreview || state !== "success") return;
    operation.current += 1;
    setCode("");
    setState("idle");
    setSeconds(20);
    setNotice("");
  }

  async function reset() {
    if (seconds > 0 || state === "checking") return;
    const id = ++operation.current;
    try {
      await onResend?.();
      if (id !== operation.current) return;
      setCode("");
      setState("idle");
      setNotice(isPreview ? t.resetNotice : "");
      setSeconds(20);
    } catch {
      if (id === operation.current) setNotice(t.error);
    }
  }

  return (
    <div className={"mizan-otp-card" + (state === "success" ? " is-success" : "")}>
      <div className="mizan-otp-corner corner-one" aria-hidden="true" />
      <div className="mizan-otp-corner corner-two" aria-hidden="true" />
      <div className="mizan-otp-lock" aria-hidden="true">{state === "success" ? <Check /> : <LockKeyhole />}</div>
      {state === "success" ? (
        <div className="mizan-otp-success" role="status" aria-live="polite">
          <div className="mizan-otp-success-icon"><CheckCircle2 size={58} strokeWidth={1.5} /></div>
          <span className="mizan-otp-tag">{t.preview}</span>
          <h2>{t.success}</h2>
          <p>{t.successDetail}</p>
          {isPreview && (
            <button className="mizan-otp-restart" type="button" onClick={restartPreview}>
              <RefreshCw size={16} aria-hidden="true" />{t.reset}
            </button>
          )}
        </div>
      ) : (
        <>
          <span className="mizan-otp-step" dir="ltr">01 / 02</span>
          <h2>{t.title}</h2>
          <p className="mizan-otp-description">{t.caption}</p>
          <form className="mizan-otp-form" onSubmit={submit}>
            <InputOTP maxLength={6} value={code}
              onChange={value => { setCode(normalizeOtp(value)); if (state === "error") setState("idle"); setNotice(""); }}
              pasteTransformer={normalizeOtp} inputMode="numeric" autoComplete="one-time-code"
              aria-label={t.codeLabel} aria-invalid={state === "error"} disabled={state === "checking"}
              containerClassName="mizan-otp-grid">
              <InputOTPGroup className="mizan-otp-slot-group" dir="ltr">
                {Array.from({ length: 6 }, (_, index) => <InputOTPSlot key={index} index={index} className="mizan-otp-slot" />)}
              </InputOTPGroup>
            </InputOTP>
            <p className={"mizan-otp-feedback" + (state === "error" ? " is-error" : "")} role={state === "error" ? "alert" : "status"}>
              {state === "error" ? t.error : notice}
            </p>
            <button className="mizan-otp-action" type="submit" disabled={!isCompleteOtp(code) || state === "checking"}>
              {state === "checking" ? t.checking : t.submit}
              {state === "checking" ? <RefreshCw size={16} className="mizan-otp-spin" /> : <ArrowRight size={17} className="mizan-otp-arrow" />}
            </button>
          </form>
        </>
      )}
      <footer className="mizan-otp-card-footer">
        <span><ShieldCheck size={14} />{t.preview}</span>
        {state !== "success" && <button disabled={seconds > 0 || state === "checking"} onClick={reset} type="button">
          <RefreshCw size={13} />{seconds > 0 ? t.cooldown + " " + seconds + "s" : t.reset}
        </button>}
      </footer>
    </div>
  );
}

export function GlassyOtpDemo() {
  const { language: savedLanguage, setLanguage } = useLocale();
  const [override, setOverride] = useState<"tr" | null>(null);
  const language: Language = override ?? savedLanguage;
  const t = copy[language];
  function switchLanguage(next: Language) {
    if (next === "tr") setOverride("tr");
    else { setOverride(null); setLanguage(next); }
  }

  return (
    <main className="mizan-otp-scene" dir={language === "ar" ? "rtl" : "ltr"} lang={language}>
      <div className="mizan-otp-ribbon top" aria-hidden="true" />
      <div className="mizan-otp-ribbon bottom" aria-hidden="true" />
      <div className="mizan-otp-shell">
        <header className="mizan-otp-header">
          <a href="/" className="mizan-otp-brand"><span className="mizan-otp-brand-icon"><ShieldCheck size={22} /></span>MIZAN <strong>FINANCE</strong></a>
          <div className="mizan-otp-header-right">
            <span className="mizan-otp-preview-tag"><span />{t.preview}</span>
            <div className="mizan-otp-languages" role="group" aria-label="Language">
              <Globe2 size={14} aria-hidden="true" />
              {(["en", "ar", "tr"] as const).map(option =>
                <button type="button" key={option} aria-pressed={language === option} onClick={() => switchLanguage(option)}>{option.toUpperCase()}</button>
              )}
            </div>
          </div>
        </header>
        <div className="mizan-otp-main">
          <section className="mizan-otp-intro">
            <div className="mizan-otp-kicker"><span />{t.concept}</div>
            <h1>{t.hero1}<br /><em>{t.hero2}</em></h1>
            <p>{t.intro}</p>
            <div className="mizan-otp-features">
              {t.points.map((point, index) => <div key={point}><small>{"0" + (index + 1)}</small><Check size={16} /><span>{point}</span></div>)}
            </div>
            <div className="mizan-otp-disclaimer"><Sparkles size={18} /><span>{t.disclaimer}</span></div>
          </section>
          <section className="mizan-otp-verify" aria-label={t.title}>
            <GlassyOtp key={language} language={language} isPreview
              onVerify={async candidate => verifyPreviewOtp(candidate)}
              onResend={async () => {}} />
            <p className="mizan-otp-demo-code">{t.demoLabel} <strong dir="ltr">246810</strong> · UI DEMO</p>
          </section>
        </div>
        <footer className="mizan-otp-bottom-bar">
          <a href="/"><ArrowLeft size={16} />{t.back}</a>
          <span>© MIZAN FINANCE / 2026</span>
        </footer>
      </div>
    </main>
  );
}
