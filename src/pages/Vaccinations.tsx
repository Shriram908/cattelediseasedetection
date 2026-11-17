import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import NavBar from "@/components/NavBar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Syringe, Loader2, Plus, Calendar, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, isBefore, addDays } from "date-fns";
import { useI18n } from "@/lib/i18n";

interface Vaccination {
  id: string; vaccine_name: string; vaccination_date: string; next_due_date: string | null;
  administered_by: string | null; batch_number: string | null; notes: string | null; cattle_id: string;
  cattle?: { name: string; breed: string };
}

export default function Vaccinations() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useI18n();
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([]);
  const [cattle, setCattle] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ cattle_id: "", vaccine_name: "", vaccination_date: "", next_due_date: "", administered_by: "", batch_number: "", notes: "" });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/auth"); return; }
      const { data: cattleData, error: cattleError } = await supabase.from("cattle").select("*").eq("owner_id", user.id).order("name");
      if (cattleError) throw cattleError;
      setCattle(cattleData || []);
      const { data: vaccinationsData, error: vacError } = await supabase.from("vaccinations").select(`*, cattle:cattle_id (name, breed)`).order("vaccination_date", { ascending: false });
      if (vacError) throw vacError;
      setVaccinations(vaccinationsData || []);
    } catch (error: any) {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  const handleChange = (name: string, value: string) => { setFormData({ ...formData, [name]: value }); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.cattle_id || !formData.vaccine_name || !formData.vaccination_date) {
      toast({ title: t("common.error"), description: "Please fill in all required fields", variant: "destructive" }); return;
    }
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("vaccinations").insert({
        cattle_id: formData.cattle_id, vaccine_name: formData.vaccine_name, vaccination_date: formData.vaccination_date,
        next_due_date: formData.next_due_date || null, administered_by: formData.administered_by || null,
        batch_number: formData.batch_number || null, notes: formData.notes || null,
      });
      if (error) throw error;
      toast({ title: t("common.success"), description: t("vac.success") });
      setIsDialogOpen(false);
      setFormData({ cattle_id: "", vaccine_name: "", vaccination_date: "", next_due_date: "", administered_by: "", batch_number: "", notes: "" });
      fetchData();
    } catch (error: any) {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    } finally { setIsSubmitting(false); }
  };

  const isDueOrOverdue = (nextDueDate: string | null) => {
    if (!nextDueDate) return false;
    return isBefore(new Date(nextDueDate), addDays(new Date(), 30));
  };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex flex-wrap gap-4 justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">{t("vac.title")}</h1>
            <p className="text-muted-foreground">{t("vac.subtitle")}</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" />{t("vac.add")}</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90dvh] overflow-y-auto">
              <DialogHeader><DialogTitle>{t("vac.addRecord")}</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>{t("vac.cattle")} *</Label>
                  <Select value={formData.cattle_id} onValueChange={(value) => handleChange("cattle_id", value)}>
                    <SelectTrigger><SelectValue placeholder={t("diagnose.selectCattle")} /></SelectTrigger>
                    <SelectContent>{cattle.map((animal) => (<SelectItem key={animal.id} value={animal.id}>{animal.name} - {animal.breed}</SelectItem>))}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t("vac.vaccineName")} *</Label>
                  <Input value={formData.vaccine_name} onChange={(e) => handleChange("vaccine_name", e.target.value)} placeholder="e.g., FMD Vaccine" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t("vac.date")} *</Label>
                    <Input type="date" value={formData.vaccination_date} onChange={(e) => handleChange("vaccination_date", e.target.value)} max={new Date().toISOString().split("T")[0]} required />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("vac.nextDue")}</Label>
                    <Input type="date" value={formData.next_due_date} onChange={(e) => handleChange("next_due_date", e.target.value)} min={new Date().toISOString().split("T")[0]} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t("vac.administeredBy")}</Label>
                    <Input value={formData.administered_by} onChange={(e) => handleChange("administered_by", e.target.value)} placeholder="Veterinarian name" />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("vac.batchNumber")}</Label>
                    <Input value={formData.batch_number} onChange={(e) => handleChange("batch_number", e.target.value)} placeholder="Vaccine batch number" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{t("vac.notes")}</Label>
                  <Textarea value={formData.notes} onChange={(e) => handleChange("notes", e.target.value)} placeholder="Additional notes..." rows={3} />
                </div>
                <div className="flex gap-4">
                  <Button type="submit" disabled={isSubmitting} className="flex-1">
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{t("vac.addBtn")}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1">{t("vac.cancel")}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {vaccinations.length === 0 ? (
          <Card className="p-12 text-center">
            <Syringe className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">{t("vac.noRecords")}</h3>
            <p className="text-muted-foreground mb-4">{t("vac.noRecordsDesc")}</p>
            <Button onClick={() => setIsDialogOpen(true)}><Plus className="mr-2 h-4 w-4" />{t("vac.addFirst")}</Button>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {vaccinations.map((vac) => (
              <Card key={vac.id} className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-bold">{vac.vaccine_name}</h3>
                      <p className="text-sm text-muted-foreground">{vac.cattle?.name} ({vac.cattle?.breed})</p>
                    </div>
                    <Syringe className="h-6 w-6 text-primary" />
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{t("vac.vaccinated")}:</span>
                      <span className="font-medium">{format(new Date(vac.vaccination_date), "PPP")}</span>
                    </div>
                    {vac.next_due_date && (
                      <div className="flex items-center gap-2">
                        {isDueOrOverdue(vac.next_due_date) && <AlertCircle className="h-4 w-4 text-warning" />}
                        <span className="text-muted-foreground">{t("vac.nextDueLabel")}:</span>
                        <Badge className={isDueOrOverdue(vac.next_due_date) ? "bg-warning text-foreground" : "bg-success text-primary-foreground"}>
                          {format(new Date(vac.next_due_date), "PPP")}
                        </Badge>
                      </div>
                    )}
                    {vac.administered_by && (<div className="flex gap-2"><span className="text-muted-foreground">{t("vac.by")}:</span><span>{vac.administered_by}</span></div>)}
                    {vac.batch_number && (<div className="flex gap-2"><span className="text-muted-foreground">{t("vac.batch")}:</span><span className="font-mono text-xs">{vac.batch_number}</span></div>)}
                    {vac.notes && (<div className="pt-2 border-t"><p className="text-muted-foreground">{vac.notes}</p></div>)}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
