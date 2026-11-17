import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { isValidOtp, toE164 } from "@/lib/phone";

const RESEND_SECONDS = 60;

/** Passwordless sign-in and sign-up with a one-time SMS code. New numbers create a farmer account. */
export default function PhoneOtpForm() {
  const { toast } = useToast();
  const { t } = useI18n();
  const [phone, setPhone] = useState("");
  const [fullName, setFullName] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const startCooldown = () => {
    setCooldown(RESEND_SECONDS);
    const timer = setInterval(() => setCooldown((s) => (s <= 1 ? (clearInterval(timer), 0) : s - 1)), 1000);
  };

  const sendCode = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const e164 = toE164(phone);
    if (!e164) return toast({ variant: "destructive", title: t("auth.invalidPhone") });
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ phone: e164, options: { data: { full_name: fullName.trim() } } });
    setLoading(false);
    if (error) return toast({ variant: "destructive", title: t("auth.otpSendFailed"), description: error.message });
    setSentTo(e164);
    setCode("");
    startCooldown();
    toast({ title: t("auth.otpSent"), description: e164 });
  };

  const verifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sentTo || !isValidOtp(code)) return;
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({ phone: sentTo, token: code, type: "sms" });
    setLoading(false);
    if (error) toast({ variant: "destructive", title: t("auth.otpInvalid"), description: error.message });
    // On success the auth listener on the Auth page redirects to the dashboard.
  };

  if (!sentTo) {
    return (
      <form onSubmit={sendCode} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="otp-phone">{t("auth.mobile")}</Label>
          <Input id="otp-phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="98765 43210" value={phone} onChange={(e) => setPhone(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="otp-name">{t("auth.fullNameNew")}</Label>
          <Input id="otp-name" maxLength={200} placeholder="Your name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>{loading ? t("auth.sending") : t("auth.sendOtp")}</Button>
      </form>
    );
  }

  return (
    <form onSubmit={verifyCode} className="space-y-4">
      <p className="text-sm text-muted-foreground">{t("auth.enterOtp")} <span className="font-medium text-foreground">{sentTo}</span></p>
      <div className="flex justify-center">
        <InputOTP maxLength={6} value={code} onChange={setCode} autoFocus>
          <InputOTPGroup>{Array.from({ length: 6 }, (_, i) => <InputOTPSlot key={i} index={i} />)}</InputOTPGroup>
        </InputOTP>
      </div>
      <Button type="submit" className="w-full" disabled={loading || !isValidOtp(code)}>{loading ? t("auth.verifying") : t("auth.verifyOtp")}</Button>
      <div className="flex justify-between text-sm">
        <Button type="button" variant="link" className="px-0" onClick={() => setSentTo(null)}>{t("auth.changeNumber")}</Button>
        <Button type="button" variant="link" className="px-0" disabled={cooldown > 0 || loading} onClick={() => sendCode()}>
          {cooldown > 0 ? `${t("auth.resendIn")} ${cooldown}s` : t("auth.resendOtp")}
        </Button>
      </div>
    </form>
  );
}
