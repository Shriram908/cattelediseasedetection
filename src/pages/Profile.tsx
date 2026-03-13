import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import NavBar from "@/components/NavBar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, User } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function Profile() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useI18n();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ full_name: "", email: "", phone: "", location: "" });

  useEffect(() => { loadProfile(); }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/auth"); return; }
      const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (error) throw error;
      setFormData({ full_name: data.full_name || "", email: data.email || "", phone: data.phone || "", location: data.location || "" });
    } catch (error: any) {
      toast({ title: t("common.error"), description: t("profile.error"), variant: "destructive" });
    } finally { setLoading(false); }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("profiles").update({ full_name: formData.full_name, phone: formData.phone || null, location: formData.location || null }).eq("id", user.id);
      if (error) throw error;
      toast({ title: t("common.success"), description: t("profile.success") });
      navigate("/dashboard");
    } catch (error: any) {
      toast({ title: t("common.error"), description: error.message || t("profile.error"), variant: "destructive" });
    } finally { setIsSubmitting(false); }
  };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <User className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold text-foreground">{t("profile.title")}</h1>
          </div>
          <p className="text-muted-foreground">{t("profile.subtitle")}</p>
        </div>
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="full_name">{t("profile.fullName")}</Label>
              <Input id="full_name" name="full_name" value={formData.full_name} onChange={handleChange} placeholder="Your full name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t("profile.email")}</Label>
              <Input id="email" name="email" type="email" value={formData.email} disabled className="bg-muted cursor-not-allowed" />
              <p className="text-xs text-muted-foreground">{t("profile.emailNote")}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">{t("profile.phone")}</Label>
              <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} placeholder="e.g., +91 9876543210" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">{t("profile.location")}</Label>
              <Input id="location" name="location" value={formData.location} onChange={handleChange} placeholder="e.g., Mumbai, Maharashtra" />
            </div>
            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t("profile.updating")}</>) : t("profile.update")}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate("/dashboard")}>{t("profile.cancel")}</Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
