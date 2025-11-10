import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function CattleNew() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    breed: "",
    cattle_tag: "",
    age: "",
    weight: "",
    farm_location: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("cattle").insert({
        owner_id: user.id,
        name: formData.name,
        breed: formData.breed || null,
        cattle_tag: formData.cattle_tag || null,
        age: formData.age ? parseInt(formData.age) : null,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        farm_location: formData.farm_location || null,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Cattle registered successfully!",
      });

      navigate("/dashboard");
    } catch (error: any) {
      console.error("Registration error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to register cattle",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Register Cattle</h1>
          <p className="text-muted-foreground">
            Add a new cattle to your farm registry
          </p>
        </div>

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Cattle Name *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., Gaumata-1"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="breed">Breed</Label>
              <Input
                id="breed"
                name="breed"
                value={formData.breed}
                onChange={handleChange}
                placeholder="e.g., Holstein, Jersey, Gir"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cattle_tag">Cattle Tag/ID</Label>
              <Input
                id="cattle_tag"
                name="cattle_tag"
                value={formData.cattle_tag}
                onChange={handleChange}
                placeholder="e.g., CTL-001"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="age">Age (years)</Label>
                <Input
                  id="age"
                  name="age"
                  type="number"
                  min="0"
                  step="0.1"
                  value={formData.age}
                  onChange={handleChange}
                  placeholder="e.g., 3"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input
                  id="weight"
                  name="weight"
                  type="number"
                  min="0"
                  step="0.1"
                  value={formData.weight}
                  onChange={handleChange}
                  placeholder="e.g., 450"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="farm_location">Farm Location</Label>
              <Input
                id="farm_location"
                name="farm_location"
                value={formData.farm_location}
                onChange={handleChange}
                placeholder="e.g., Shed A, Field 3"
              />
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
                    Registering...
                  </>
                ) : (
                  "Register Cattle"
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
