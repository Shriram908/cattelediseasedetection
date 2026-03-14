import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import NavBar from "@/components/NavBar";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone, Stethoscope, Clock, Search, DollarSign, MessageSquare, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";

export default function Veterinarians() {
  const navigate = useNavigate();
  const [vets, setVets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchCity, setSearchCity] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const { toast } = useToast();
  const { t } = useI18n();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id || null);
    });
    fetchVeterinarians();
  }, []);

  const fetchVeterinarians = async (city?: string) => {
    try {
      setLoading(true);
      let query = supabase
        .from("veterinarians")
        .select(`*, profiles:user_id (full_name, email)`)
        .eq("is_verified", true);

      if (city) {
        query = query.ilike("city", `%${city}%`);
      }

      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) throw error;
      setVets(data || []);
    } catch (error: any) {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchVeterinarians(searchCity.trim() || undefined);
  };

  const startConversation = async (vetUserId: string) => {
    if (!userId) {
      navigate("/auth");
      return;
    }
    try {
      const { data: existing } = await supabase
        .from("conversations")
        .select("id")
        .eq("farmer_id", userId)
        .eq("vet_id", vetUserId)
        .maybeSingle();

      if (existing) {
        navigate("/messages");
        return;
      }

      const { error } = await supabase
        .from("conversations")
        .insert({ farmer_id: userId, vet_id: vetUserId });
      if (error) throw error;

      toast({ title: t("common.success"), description: t("apt.noAppointmentsDesc") });
      navigate("/messages");
    } catch (error: any) {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">{t("vet.title")}</h1>
          <p className="text-muted-foreground">{t("vet.subtitle")}</p>
        </div>

        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder={t("vet.searchCity")} value={searchCity} onChange={(e) => setSearchCity(e.target.value)} className="pl-10" />
            </div>
            <Button type="submit">{t("vet.search")}</Button>
            {searchCity && (
              <Button type="button" variant="outline" onClick={() => { setSearchCity(""); fetchVeterinarians(); }}>
                {t("vet.clear")}
              </Button>
            )}
          </div>
        </form>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">{t("vet.loading")}</p>
          </div>
        ) : vets.length === 0 ? (
          <Card className="p-8 text-center">
            <Stethoscope className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              {searchCity ? `${t("vet.noVetsCity")} "${searchCity}"` : t("vet.noVets")}
            </p>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {vets.map((vet) => (
              <Card key={vet.id} className="p-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-bold">{vet.clinic_name}</h3>
                    <p className="text-sm text-muted-foreground">Dr. {vet.profiles?.full_name}</p>
                  </div>

                  {vet.specialization && (
                    <div className="flex items-center gap-2">
                      <Stethoscope className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{vet.specialization}</span>
                      {vet.experience_years && (
                        <Badge variant="secondary">{vet.experience_years} {t("vet.yearsExp")}</Badge>
                      )}
                    </div>
                  )}

                  <div className="space-y-2">
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
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{vet.consultation_hours}</span>
                    </div>
                    {vet.consultation_fee && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">₹{vet.consultation_fee} {t("vet.consultationFee")}</span>
                      </div>
                    )}
                  </div>

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

                  <div className="grid grid-cols-3 gap-2">
                    <Button className="w-full" asChild>
                      <a href={`tel:${vet.phone}`}><Phone className="h-4 w-4 mr-1" />{t("vet.call")}</a>
                    </Button>
                    <Button variant="outline" className="w-full" onClick={() => startConversation(vet.user_id)}>
                      <MessageSquare className="h-4 w-4 mr-1" />{t("vet.chat")}
                    </Button>
                    <Button variant="secondary" className="w-full" onClick={() => navigate(`/appointments/new?vet_id=${vet.user_id}`)}>
                      <Calendar className="h-4 w-4 mr-1" />{t("vet.bookAppt")}
                    </Button>
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
