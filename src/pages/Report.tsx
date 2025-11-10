import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, Printer, AlertCircle } from "lucide-react";

export default function Report() {
  const { reportId } = useParams<{ reportId: string }>();
  const navigate = useNavigate();

  const { data: report, isLoading } = useQuery({
    queryKey: ["report", reportId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reports")
        .select(`
          *,
          cattle:cattle_id (
            name,
            breed,
            cattle_tag,
            age,
            weight
          )
        `)
        .eq("id", reportId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="container mx-auto max-w-2xl">
          <Card className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-warning mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Report Not Found</h2>
            <Button onClick={() => navigate("/dashboard")}>
              Back to Dashboard
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "mild":
        return "bg-severity-mild text-severity-mild-foreground";
      case "moderate":
        return "bg-severity-moderate text-severity-moderate-foreground";
      case "severe":
        return "bg-severity-severe text-severity-severe-foreground";
      case "critical":
        return "bg-severity-critical text-severity-critical-foreground";
      default:
        return "bg-secondary text-secondary-foreground";
    }
  };

  const parseNotes = (notes: string | null) => {
    if (!notes) return { duration: "", remedies: [], precautions: [] };
    
    const lines = notes.split("\n");
    const duration = lines.find(l => l.startsWith("Duration:"))?.replace("Duration:", "").trim() || "";
    
    const remediesStart = lines.findIndex(l => l.includes("Home Remedies:"));
    const precautionsStart = lines.findIndex(l => l.includes("Precautions:"));
    
    const remedies = remediesStart >= 0 
      ? lines.slice(remediesStart + 1, precautionsStart >= 0 ? precautionsStart : undefined)
          .filter(l => l.trim())
      : [];
    
    const precautions = precautionsStart >= 0 
      ? lines.slice(precautionsStart + 1).filter(l => l.trim())
      : [];
    
    return { duration, remedies, precautions };
  };

  const { duration, remedies, precautions } = parseNotes(report.treatment_notes);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header - Hidden on print */}
        <div className="mb-8 print:hidden">
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">
                Disease Diagnosis Report
              </h1>
              <p className="text-muted-foreground">
                Generated on {new Date(report.diagnosis_date).toLocaleDateString()}
              </p>
            </div>
            <Button onClick={handlePrint} variant="outline">
              <Printer className="mr-2 h-4 w-4" />
              Print Report
            </Button>
          </div>
        </div>

        {/* Print Header - Only visible on print */}
        <div className="hidden print:block mb-8">
          <h1 className="text-3xl font-bold mb-2">Cattle Disease Diagnosis Report</h1>
          <p className="text-sm text-muted-foreground">
            Generated on {new Date(report.diagnosis_date).toLocaleDateString()}
          </p>
        </div>

        <div className="space-y-6">
          {/* Cattle Information */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Cattle Information</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium">{report.cattle?.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Breed</p>
                <p className="font-medium">{report.cattle?.breed || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tag ID</p>
                <p className="font-medium">{report.cattle?.cattle_tag || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Age</p>
                <p className="font-medium">{report.cattle?.age ? `${report.cattle.age} years` : "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Weight</p>
                <p className="font-medium">{report.cattle?.weight ? `${report.cattle.weight} kg` : "N/A"}</p>
              </div>
            </div>
          </Card>

          {/* Diagnosis */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Diagnosis</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Predicted Disease</p>
                <p className="text-2xl font-bold text-medical">{report.predicted_disease}</p>
              </div>
              
              <div className="flex gap-4 flex-wrap">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Confidence</p>
                  <Badge variant="secondary">
                    {Math.round(report.confidence_score * 100)}%
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Severity</p>
                  <Badge className={getSeverityColor(report.severity)}>
                    {report.severity}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Veterinarian</p>
                  <Badge variant={report.veterinarian_recommended ? "destructive" : "secondary"}>
                    {report.veterinarian_recommended ? "Required" : "Optional"}
                  </Badge>
                </div>
              </div>

              {report.selected_symptoms && report.selected_symptoms.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Observed Symptoms</p>
                  <div className="flex flex-wrap gap-2">
                    {report.selected_symptoms.map((symptom) => (
                      <Badge key={symptom} variant="outline">
                        {symptom.replace(/_/g, " ")}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Treatment Information */}
          {duration && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Treatment Duration</h2>
              <p>{duration}</p>
            </Card>
          )}

          {/* Home Remedies */}
          {remedies.length > 0 && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Home Remedies</h2>
              <ul className="space-y-2">
                {remedies.map((remedy, idx) => (
                  <li key={idx} className="flex gap-2">
                    <span className="text-primary font-medium">{idx + 1}.</span>
                    <span>{remedy}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Precautions */}
          {precautions.length > 0 && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Precautions</h2>
              <ul className="space-y-2">
                {precautions.map((precaution, idx) => (
                  <li key={idx} className="flex gap-2">
                    <span className="text-primary font-medium">{idx + 1}.</span>
                    <span>{precaution}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* AI Model Info */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Analysis Information</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">ML Model Used:</span>
                <span className="font-medium">{report.ml_model_used}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Report ID:</span>
                <span className="font-mono text-xs">{report.id}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
