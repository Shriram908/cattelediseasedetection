import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import NavBar from "@/components/NavBar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { Loader2, Calendar, MapPin, Phone, Stethoscope, Clock, DollarSign, User } from "lucide-react";

export default function AppointmentNew() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useI18n();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cattle, setCattle] = useState<any[]>([]);
  const [vets, setVets] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    vet_id: searchParams.get("vet_id") || "",
    cattle_id: "",
    appointment_date: "",
    appointment_time: "",
    reason: "",
    notes: "",
  });

  const selectedVet = vets.find((v) => v.user_id === formData.vet_id);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/auth"); return; }

      const [cattleRes, vetsRes] = await Promise.all([
        supabase.from("cattle").select("*").eq("owner_id", user.id).order("name"),
        supabase.from("veterinarians").select(`*, profiles:user_id (full_name, email)`).eq("is_verified", true).order("clinic_name"),
      ]);

      if (cattleRes.error) throw cattleRes.error;
      if (vetsRes.error) throw vetsRes.error;
      setCattle(cattleRes.data || []);
      setVets(vetsRes.data || []);
    } catch (error: any) {
      toast({ title: t("common.error"), description: t("apt.failedToLoad"), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.vet_id || !formData.appointment_date || !formData.appointment_time || !formData.reason) {
      toast({ title: t("common.error"), description: t("apt.fillRequired"), variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const appointmentDateTime = new Date(`${formData.appointment_date}T${formData.appointment_time}`);
      const { error } = await supabase.from("appointments").insert({
        farmer_id: user.id,
        vet_id: formData.vet_id,
        cattle_id: formData.cattle_id && formData.cattle_id !== "none" ? formData.cattle_id : null,
        appointment_date: appointmentDateTime.toISOString(),
        reason: formData.reason,
        notes: formData.notes || null,
        status: "pending",
      });
      if (error) throw error;
      toast({ title: t("common.success"), description: t("apt.bookedSuccess") });
      navigate("/appointments");
    } catch (error: any) {
      toast({ title: t("common.error"), description: error.message || t("apt.failedToBook"), variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid gap-6 md:grid-cols-5">
          {/* Booking Form */}
          <Card className="p-8 md:col-span-3">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
                <Calendar className="h-8 w-8" />
                {t("apt.bookTitle")}
              </h1>
              <p className="text-muted-foreground">{t("apt.bookSubtitle")}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label>{t("apt.veterinarian")} *</Label>
                <Select value={formData.vet_id} onValueChange={(value) => handleChange("vet_id", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("apt.selectVet")} />
                  </SelectTrigger>
                  <SelectContent>
                    {vets.map((vet) => (
                      <SelectItem key={vet.user_id} value={vet.user_id}>
                        {vet.clinic_name} - Dr. {vet.profiles?.full_name} ({vet.city})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t("apt.cattleOptional")}</Label>
                <Select value={formData.cattle_id} onValueChange={(value) => handleChange("cattle_id", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("apt.selectCattle")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t("apt.none")}</SelectItem>
                    {cattle.map((animal) => (
                      <SelectItem key={animal.id} value={animal.id}>
                        {animal.name} - {animal.breed}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("apt.date")} *</Label>
                  <Input type="date" value={formData.appointment_date} onChange={(e) => handleChange("appointment_date", e.target.value)} min={new Date().toISOString().split("T")[0]} required />
                </div>
                <div className="space-y-2">
                  <Label>{t("apt.time")} *</Label>
                  <Input type="time" value={formData.appointment_time} onChange={(e) => handleChange("appointment_time", e.target.value)} required />
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t("apt.reasonForVisit")} *</Label>
                <Textarea value={formData.reason} onChange={(e) => handleChange("reason", e.target.value)} placeholder={t("apt.reasonPlaceholder")} rows={3} required />
              </div>

              <div className="space-y-2">
                <Label>{t("apt.additionalNotes")}</Label>
                <Textarea value={formData.notes} onChange={(e) => handleChange("notes", e.target.value)} placeholder={t("apt.notesPlaceholder")} rows={3} />
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={isSubmitting} className="flex-1">
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t("apt.book")}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate("/appointments")} className="flex-1">
                  {t("apt.cancel")}
                </Button>
              </div>
            </form>
          </Card>

          {/* Vet Profile Sidebar */}
          <div className="md:col-span-2">
            {selectedVet ? (
              <VetProfileCard vet={selectedVet} t={t} />
            ) : (
              <Card className="p-6 text-center">
                <User className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                <p className="text-muted-foreground text-sm">{t("apt.selectVet")}</p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function VetProfileCard({ vet, t }: { vet: any; t: (key: string) => string }) {
  return (
    <Card className="p-6 space-y-4 sticky top-24">
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">{t("apt.vetProfile")}</p>
        <h3 className="text-xl font-bold text-foreground">{vet.clinic_name}</h3>
        <p className="text-sm text-muted-foreground">Dr. {vet.profiles?.full_name}</p>
      </div>

      {vet.specialization && (
        <div className="flex items-center gap-2">
          <Stethoscope className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{vet.specialization}</span>
        </div>
      )}

      {vet.experience_years && (
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{vet.experience_years} {t("vet.yearsExp")}</span>
        </div>
      )}

      <div className="flex items-start gap-2">
        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
        <div className="text-sm">
          <p>{vet.clinic_address}</p>
          <p className="text-muted-foreground">{vet.city}, {vet.state} {vet.pincode}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Phone className="h-4 w-4 text-muted-foreground" />
        <a href={`tel:${vet.phone}`} className="text-sm text-primary hover:underline">{vet.phone}</a>
      </div>

      {vet.consultation_hours && (
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{vet.consultation_hours}</span>
        </div>
      )}

      {vet.consultation_fee && (
        <div className="flex items-center gap-2 bg-accent/50 rounded-lg p-3">
          <DollarSign className="h-5 w-5 text-primary" />
          <div>
            <p className="text-lg font-bold text-foreground">₹{vet.consultation_fee}</p>
            <p className="text-xs text-muted-foreground">{t("vet.consultationFee")}</p>
          </div>
        </div>
      )}

      {vet.available_days && vet.available_days.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-1">{t("vet.availableOn")}</p>
          <div className="flex flex-wrap gap-1">
            {vet.available_days.map((day: string) => (
              <Badge key={day} variant="outline" className="text-xs">{day}</Badge>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
