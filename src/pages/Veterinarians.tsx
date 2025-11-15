import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import NavBar from "@/components/NavBar";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone, Stethoscope, Clock, Search, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Veterinarians() {
  const navigate = useNavigate();
  const [vets, setVets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchCity, setSearchCity] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchVeterinarians();
  }, []);

  const fetchVeterinarians = async (city?: string) => {
    try {
      setLoading(true);
      let query = supabase
        .from("veterinarians")
        .select(`
          *,
          profiles!inner(full_name, email)
        `)
        .eq("is_verified", true);

      if (city) {
        query = query.ilike("city", `%${city}%`);
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) throw error;
      setVets(data || []);
    } catch (error: any) {
      console.error("Error fetching veterinarians:", error);
      toast({
        title: "Error",
        description: "Failed to load veterinarians",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchVeterinarians(searchCity);
  };

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Find Veterinarians</h1>
          <p className="text-muted-foreground">
            Connect with verified veterinary professionals near you
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by city..."
                value={searchCity}
                onChange={(e) => setSearchCity(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit">Search</Button>
            {searchCity && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setSearchCity("");
                  fetchVeterinarians();
                }}
              >
                Clear
              </Button>
            )}
          </div>
        </form>

        {/* Veterinarians List */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading veterinarians...</p>
          </div>
        ) : vets.length === 0 ? (
          <Card className="p-8 text-center">
            <Stethoscope className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              {searchCity
                ? `No veterinarians found in "${searchCity}"`
                : "No veterinarians available yet"}
            </p>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {vets.map((vet) => (
              <Card key={vet.id} className="p-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-bold">{vet.clinic_name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Dr. {vet.profiles?.full_name}
                    </p>
                  </div>

                  {vet.specialization && (
                    <div className="flex items-center gap-2">
                      <Stethoscope className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{vet.specialization}</span>
                      {vet.experience_years && (
                        <Badge variant="secondary">
                          {vet.experience_years} years exp.
                        </Badge>
                      )}
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="text-sm">
                        <p>{vet.clinic_address}</p>
                        <p className="text-muted-foreground">
                          {vet.city}, {vet.state} {vet.pincode}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a
                        href={`tel:${vet.phone}`}
                        className="text-sm text-primary hover:underline"
                      >
                        {vet.phone}
                      </a>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{vet.consultation_hours}</span>
                    </div>

                    {vet.consultation_fee && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">₹{vet.consultation_fee} consultation fee</span>
                      </div>
                    )}
                  </div>

                  {vet.available_days && vet.available_days.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Available on:</p>
                      <div className="flex flex-wrap gap-1">
                        {vet.available_days.map((day: string) => (
                          <Badge key={day} variant="outline" className="text-xs">
                            {day}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <Button className="w-full" asChild>
                    <a href={`tel:${vet.phone}`}>
                      <Phone className="h-4 w-4 mr-2" />
                      Call Now
                    </a>
                  </Button>

                  <Button 
                    className="w-full"
                    variant="outline"
                    onClick={() => navigate(`/appointments/new?vet_id=${vet.user_id}`)}
                  >
                    Book Appointment
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
