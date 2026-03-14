import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import NavBar from "@/components/NavBar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Calendar } from "lucide-react";

export default function AppointmentNew() {
  const navigate = useNavigate();
  const { toast } = useToast();
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

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Fetch user's cattle
      const { data: cattleData, error: cattleError } = await supabase
        .from("cattle")
        .select("*")
        .eq("owner_id", user.id)
        .order("name");

      if (cattleError) throw cattleError;
      setCattle(cattleData || []);

      // Fetch verified veterinarians
      const { data: vetsData, error: vetsError } = await supabase
        .from("veterinarians")
        .select(`
          *,
          profiles!inner(full_name)
        `)
        .eq("is_verified", true)
        .order("clinic_name");

      if (vetsError) throw vetsError;
      setVets(vetsData || []);
    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      });
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
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
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

      toast({
        title: "Success",
        description: "Appointment booked successfully",
      });

      navigate("/appointments");
    } catch (error: any) {
      console.error("Error creating appointment:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to book appointment",
        variant: "destructive",
      });
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
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
              <Calendar className="h-8 w-8" />
              Book Appointment
            </h1>
            <p className="text-muted-foreground">Schedule a visit with a veterinarian</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="vet_id">Veterinarian *</Label>
              <Select
                value={formData.vet_id}
                onValueChange={(value) => handleChange("vet_id", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a veterinarian" />
                </SelectTrigger>
                <SelectContent>
                  {vets.map((vet) => (
                    <SelectItem key={vet.user_id} value={vet.user_id}>
                      {vet.clinic_name} - {vet.city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cattle_id">Cattle (Optional)</Label>
              <Select
                value={formData.cattle_id}
                onValueChange={(value) => handleChange("cattle_id", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select cattle (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
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
                <Label htmlFor="appointment_date">Date *</Label>
                <Input
                  id="appointment_date"
                  type="date"
                  value={formData.appointment_date}
                  onChange={(e) => handleChange("appointment_date", e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="appointment_time">Time *</Label>
                <Input
                  id="appointment_time"
                  type="time"
                  value={formData.appointment_time}
                  onChange={(e) => handleChange("appointment_time", e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Visit *</Label>
              <Textarea
                id="reason"
                value={formData.reason}
                onChange={(e) => handleChange("reason", e.target.value)}
                placeholder="Describe the reason for the appointment..."
                rows={3}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
                placeholder="Any additional information..."
                rows={3}
              />
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Book Appointment
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/appointments")}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
