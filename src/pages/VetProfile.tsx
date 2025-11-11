import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import NavBar from "@/components/NavBar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Stethoscope } from "lucide-react";

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function VetProfile() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isVet, setIsVet] = useState(false);
  const [existingProfile, setExistingProfile] = useState<any>(null);
  const [formData, setFormData] = useState({
    clinic_name: "",
    specialization: "",
    experience_years: "",
    license_number: "",
    clinic_address: "",
    city: "",
    state: "",
    pincode: "",
    phone: "",
    consultation_fee: "",
    available_days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    consultation_hours: "9:00 AM - 6:00 PM",
  });

  useEffect(() => {
    checkVetRoleAndLoadProfile();
  }, []);

  const checkVetRoleAndLoadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Check if user is a veterinarian
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single();

      if (roleData?.role !== "veterinarian") {
        toast({
          title: "Access Denied",
          description: "Only veterinarians can access this page.",
          variant: "destructive",
        });
        navigate("/dashboard");
        return;
      }

      setIsVet(true);

      // Check for existing profile
      const { data: profileData } = await supabase
        .from("veterinarians")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (profileData) {
        setExistingProfile(profileData);
        setFormData({
          clinic_name: profileData.clinic_name || "",
          specialization: profileData.specialization || "",
          experience_years: profileData.experience_years?.toString() || "",
          license_number: profileData.license_number || "",
          clinic_address: profileData.clinic_address || "",
          city: profileData.city || "",
          state: profileData.state || "",
          pincode: profileData.pincode || "",
          phone: profileData.phone || "",
          consultation_fee: profileData.consultation_fee?.toString() || "",
          available_days: profileData.available_days || ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
          consultation_hours: profileData.consultation_hours || "9:00 AM - 6:00 PM",
        });
      }
    } catch (error: any) {
      console.error("Error checking vet role:", error);
      toast({
        title: "Error",
        description: "Failed to load profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleDayToggle = (day: string) => {
    setFormData(prev => ({
      ...prev,
      available_days: prev.available_days.includes(day)
        ? prev.available_days.filter(d => d !== day)
        : [...prev.available_days, day]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const profileData = {
        user_id: user.id,
        clinic_name: formData.clinic_name,
        specialization: formData.specialization || null,
        experience_years: formData.experience_years ? parseInt(formData.experience_years) : null,
        license_number: formData.license_number || null,
        clinic_address: formData.clinic_address,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode || null,
        phone: formData.phone,
        consultation_fee: formData.consultation_fee ? parseFloat(formData.consultation_fee) : null,
        available_days: formData.available_days,
        consultation_hours: formData.consultation_hours,
      };

      if (existingProfile) {
        const { error } = await supabase
          .from("veterinarians")
          .update(profileData)
          .eq("user_id", user.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Profile updated successfully!",
        });
      } else {
        const { error } = await supabase
          .from("veterinarians")
          .insert(profileData);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Profile created successfully! Your profile will be visible once verified.",
        });
      }

      navigate("/dashboard");
    } catch (error: any) {
      console.error("Profile error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save profile",
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

  if (!isVet) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Stethoscope className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold text-foreground">
              {existingProfile ? "Edit" : "Setup"} Veterinarian Profile
            </h1>
          </div>
          <p className="text-muted-foreground">
            Complete your profile to appear in the veterinarian directory
          </p>
        </div>

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="clinic_name">Clinic Name *</Label>
              <Input
                id="clinic_name"
                name="clinic_name"
                value={formData.clinic_name}
                onChange={handleChange}
                placeholder="e.g., Green Valley Veterinary Clinic"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="specialization">Specialization</Label>
                <Input
                  id="specialization"
                  name="specialization"
                  value={formData.specialization}
                  onChange={handleChange}
                  placeholder="e.g., Large Animal Medicine"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="experience_years">Years of Experience</Label>
                <Input
                  id="experience_years"
                  name="experience_years"
                  type="number"
                  min="0"
                  value={formData.experience_years}
                  onChange={handleChange}
                  placeholder="e.g., 10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="license_number">License Number</Label>
              <Input
                id="license_number"
                name="license_number"
                value={formData.license_number}
                onChange={handleChange}
                placeholder="e.g., VET-12345"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="clinic_address">Clinic Address *</Label>
              <Textarea
                id="clinic_address"
                name="clinic_address"
                value={formData.clinic_address}
                onChange={handleChange}
                placeholder="Full clinic address"
                required
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="e.g., Mumbai"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">State *</Label>
                <Input
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="e.g., Maharashtra"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pincode">Pincode</Label>
                <Input
                  id="pincode"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleChange}
                  placeholder="e.g., 400001"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="e.g., +91 9876543210"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="consultation_fee">Consultation Fee (₹)</Label>
                <Input
                  id="consultation_fee"
                  name="consultation_fee"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.consultation_fee}
                  onChange={handleChange}
                  placeholder="e.g., 500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="consultation_hours">Consultation Hours</Label>
              <Input
                id="consultation_hours"
                name="consultation_hours"
                value={formData.consultation_hours}
                onChange={handleChange}
                placeholder="e.g., 9:00 AM - 6:00 PM"
              />
            </div>

            <div className="space-y-3">
              <Label>Available Days</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {DAYS_OF_WEEK.map((day) => (
                  <div key={day} className="flex items-center space-x-2">
                    <Checkbox
                      id={day}
                      checked={formData.available_days.includes(day)}
                      onCheckedChange={() => handleDayToggle(day)}
                    />
                    <Label
                      htmlFor={day}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {day}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  existingProfile ? "Update Profile" : "Create Profile"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/dashboard")}
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
