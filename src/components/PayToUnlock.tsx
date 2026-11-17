import { useState } from "react";
import { Lock, Loader2, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { formatRupees, loadRazorpayCheckout, type RazorpaySuccess } from "@/lib/razorpay";
import { DIAGNOSIS_PRICE_PAISE } from "../../supabase/functions/_shared/payments";

interface PayToUnlockProps {
  reportId: string;
  cattleName: string | null;
  diagnosisDate: string;
  onUnlocked: () => void;
}

export default function PayToUnlock({ reportId, cattleName, diagnosisDate, onUnlocked }: PayToUnlockProps) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const price = formatRupees(DIAGNOSIS_PRICE_PAISE);

  const fail = (description: string) => {
    setBusy(false);
    toast({ variant: "destructive", title: t("payment.failed"), description });
  };

  const verify = async (result: RazorpaySuccess) => {
    const { error } = await supabase.functions.invoke("razorpay-payment", {
      body: { action: "verify", order_id: result.razorpay_order_id, payment_id: result.razorpay_payment_id, signature: result.razorpay_signature },
    });
    if (error) return fail(t("payment.verifyFailed"));
    toast({ title: t("payment.success") });
    setBusy(false);
    onUnlocked();
  };

  const pay = async () => {
    setBusy(true);
    try {
      await loadRazorpayCheckout();
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase.functions.invoke("razorpay-payment", { body: { action: "create_order", report_id: reportId } });
      if (error) throw error;
      if (data?.unlocked) { setBusy(false); return onUnlocked(); }
      if (!window.Razorpay) throw new Error("Checkout unavailable");

      const checkout = new window.Razorpay({
        key: data.key_id,
        order_id: data.order_id,
        amount: data.amount,
        currency: data.currency,
        name: "CattleCare AI",
        description: t("payment.description"),
        prefill: { email: user?.email ?? "", contact: user?.phone ?? "" },
        handler: verify,
        modal: { ondismiss: () => setBusy(false) },
      });
      checkout.on("payment.failed", () => fail(t("payment.declined")));
      checkout.open();
    } catch {
      fail(t("payment.unavailable"));
    }
  };

  return (
    <Card className="border-2 border-primary/30">
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <Lock className="h-7 w-7 text-primary" />
        </div>
        <CardTitle className="text-2xl">{t("payment.lockedTitle")}</CardTitle>
        <CardDescription>
          {cattleName ?? "—"} • {new Date(diagnosisDate).toLocaleDateString()}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-center">
        <p className="text-muted-foreground">{t("payment.lockedDesc")}</p>
        <Button size="lg" className="w-full sm:w-auto" onClick={pay} disabled={busy}>
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lock className="mr-2 h-4 w-4" />}
          {t("payment.payButton").replace("{price}", price)}
        </Button>
        <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5" />{t("payment.secureNote")}
        </p>
      </CardContent>
    </Card>
  );
}
