import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import NavBar from "@/components/NavBar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Upload, Loader2, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

const COMMON_SYMPTOMS = [
  "fever",
  "loss_of_appetite",
  "reduced_milk_production",
  "lethargy",
  "difficulty_breathing",
  "coughing",
  "nasal_discharge",
  "diarrhea",
  "bloating",
  "lameness",
  "swelling_in_legs",
  "skin_lesions",
  "weight_loss",
  "excessive_salivation",
  "eye_discharge"
];

export default function Diagnose() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedCattle, setSelectedCattle] = useState<string>("");
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const { data: cattle, isLoading } = useQuery({
    queryKey: ["cattle"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("cattle")
        .select("*")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File, userId: string): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('cattle-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('cattle-images')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };

  const handleSymptomToggle = (symptom: string) => {
    setSelectedSymptoms(prev =>
      prev.includes(symptom)
        ? prev.filter(s => s !== symptom)
        : [...prev, symptom]
    );
  };

  const handleAnalyze = async () => {
    if (!selectedCattle) {
      toast({
        title: "Select Cattle",
        description: "Please select a cattle to diagnose.",
        variant: "destructive",
      });
      return;
    }

    if (selectedSymptoms.length === 0 && !imageFile) {
      toast({
        title: "Input Required",
        description: "Please select symptoms or upload an image.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Upload image first if provided
      let uploadedImageUrl = "";
      if (imageFile) {
        const url = await uploadImage(imageFile, user.id);
        if (url) {
          uploadedImageUrl = url;
        } else {
          throw new Error("Failed to upload image");
        }
      }

      const { data, error } = await supabase.functions.invoke("analyze-disease", {
        body: {
          cattle_id: selectedCattle,
          symptoms: selectedSymptoms.length > 0 ? selectedSymptoms : undefined,
          image_url: uploadedImageUrl || undefined,
        },
      });

      if (error) throw error;

      toast({
        title: "Analysis Complete",
        description: "Disease diagnosis has been generated successfully.",
      });

      navigate(`/report/${data.report_id}`);
    } catch (error: any) {
      console.error("Analysis error:", error);
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to analyze disease. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!cattle || cattle.length === 0) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="container mx-auto max-w-2xl">
          <Card className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-warning mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">No Cattle Registered</h2>
            <p className="text-muted-foreground mb-6">
              You need to register at least one cattle before you can perform a diagnosis.
            </p>
            <Button onClick={() => navigate("/cattle/new")}>
              Register Your First Cattle
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Diagnose Disease</h1>
          <p className="text-muted-foreground">
            Upload an image or select symptoms to get an AI-powered diagnosis
          </p>
        </div>

        <div className="space-y-6">
          {/* Cattle Selection */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Select Cattle</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cattle.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCattle(c.id)}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    selectedCattle === c.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="font-semibold">{c.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {c.breed} • Tag: {c.cattle_tag || "N/A"}
                  </div>
                </button>
              ))}
            </div>
          </Card>

          {/* Image Upload */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Upload Image (Optional)</h2>
            <div className="space-y-4">
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="cursor-pointer">
                  {imagePreview ? (
                    <div className="space-y-4">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="max-h-64 mx-auto rounded-lg"
                      />
                      <p className="text-sm text-muted-foreground">
                        Click to change image
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Click to upload or drag and drop
                      </p>
                    </div>
                  )}
                </label>
              </div>
            </div>
          </Card>

          {/* Symptom Selection */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Select Symptoms (Optional)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {COMMON_SYMPTOMS.map((symptom) => (
                <div key={symptom} className="flex items-center space-x-2">
                  <Checkbox
                    id={symptom}
                    checked={selectedSymptoms.includes(symptom)}
                    onCheckedChange={() => handleSymptomToggle(symptom)}
                  />
                  <Label
                    htmlFor={symptom}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 capitalize cursor-pointer"
                  >
                    {symptom.replace(/_/g, " ")}
                  </Label>
                </div>
              ))}
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              size="lg"
              className="flex-1"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                "Analyze Disease"
              )}
            </Button>
            <Button
              onClick={() => navigate("/dashboard")}
              variant="outline"
              size="lg"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
