import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import NavBar from "@/components/NavBar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useI18n } from "@/lib/i18n";

export default function CattleEdit() {
  const { cattleId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useI18n();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ name: "", breed: "", cattle_tag: "", age: "", weight: "", farm_location: "" });

  useEffect(() => { loadCattle(); }, [cattleId]);

  const loadCattle = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/auth"); return; }
      const { data, error } = await supabase.from("cattle").select("*").eq("id", cattleId).eq("owner_id", user.id).single();
      if (error) throw error;
      if (!data) { toast({ title: t("common.error"), description: "Cattle not found", variant: "destructive" }); navigate("/dashboard"); return; }
      setFormData({ name: data.name || "", breed: data.breed || "", cattle_tag: data.cattle_tag || "", age: data.age?.toString() || "", weight: data.weight?.toString() || "", farm_location: data.farm_location || "" });
    } catch (error: any) {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
      navigate("/dashboard");
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
      const { error } = await supabase.from("cattle").update({
        name: formData.name, breed: formData.breed || null, cattle_tag: formData.cattle_tag || null,
        age: formData.age ? parseInt(formData.age) : null, weight: formData.weight ? parseFloat(formData.weight) : null,
        farm_location: formData.farm_location || null,
      }).eq("id", cattleId).eq("owner_id", user.id);
      if (error) throw error;
      toast({ title: t("common.success"), description: t("cattle.updateSuccess") });
      navigate("/dashboard");
    } catch (error: any) {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    } finally { setIsSubmitting(false); }
  };

  const handleDelete = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("cattle").delete().eq("id", cattleId).eq("owner_id", user.id);
      if (error) throw error;
      toast({ title: t("common.success"), description: t("cattle.deleteSuccess") });
      navigate("/dashboard");
    } catch (error: any) {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    }
  };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">{t("cattle.edit")}</h1>
          <p className="text-muted-foreground">{t("cattle.editSubtitle")}</p>
        </div>
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">{t("cattle.name")} *</Label>
              <Input id="name" name="name" value={formData.name} onChange={handleChange} placeholder="e.g., Gaumata-1" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="breed">{t("cattle.breed")}</Label>
              <Input id="breed" name="breed" value={formData.breed} onChange={handleChange} placeholder="e.g., Holstein, Jersey, Gir" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cattle_tag">{t("cattle.tag")}</Label>
              <Input id="cattle_tag" name="cattle_tag" value={formData.cattle_tag} onChange={handleChange} placeholder="e.g., CTL-001" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="age">{t("cattle.age")}</Label>
                <Input id="age" name="age" type="number" min="0" step="0.1" value={formData.age} onChange={handleChange} placeholder="e.g., 3" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight">{t("cattle.weight")}</Label>
                <Input id="weight" name="weight" type="number" min="0" step="0.1" value={formData.weight} onChange={handleChange} placeholder="e.g., 450" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="farm_location">{t("cattle.farmLocation")}</Label>
              <Input id="farm_location" name="farm_location" value={formData.farm_location} onChange={handleChange} placeholder="e.g., Shed A, Field 3" />
            </div>
            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t("cattle.updating")}</>) : t("cattle.update")}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate("/dashboard")}>{t("cattle.cancel")}</Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="destructive" size="icon"><Trash2 className="h-4 w-4" /></Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t("cattle.delete")}</AlertDialogTitle>
                    <AlertDialogDescription>{t("cattle.deleteConfirm")}</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{t("common.delete")}</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
