import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import NavBar from "@/components/NavBar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, Printer, AlertCircle } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function Report() {
  const { reportId } = useParams<{ reportId: string }>();
  const navigate = useNavigate();
  const { t } = useI18n();

  const { data: report, isLoading } = useQuery({
    queryKey: ["report", reportId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reports")
        .select(`*, cattle:cattle_id (name, breed, cattle_tag, age, weight)`)
        .eq("id", reportId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const handlePrint = () => window.print();

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
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">{t("report.notFound")}</h2>
            <Button onClick={() => navigate("/dashboard")}>{t("report.backDashboard")}</Button>
          </Card>
        </div>
      </div>
    );
  }

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "mild": return "bg-severity-mild/10 text-severity-mild border border-severity-mild/20";
      case "moderate": return "bg-severity-moderate/10 text-severity-moderate border border-severity-moderate/20";
      case "severe": return "bg-severity-severe/10 text-severity-severe border border-severity-severe/20";
      case "critical": return "bg-severity-critical/10 text-severity-critical border border-severity-critical/20";
      default: return "bg-secondary text-secondary-foreground";
    }
  };

  const parseNotes = (notes: string | null) => {
    if (!notes) return { duration: "", remedies: [] as string[], precautions: [] as string[] };
    const lines = notes.split("\n");
    const duration = lines.find(l => l.startsWith("Duration:"))?.replace("Duration:", "").trim() || "";
    const remediesStart = lines.findIndex(l => l.includes("Home Remedies:"));
    const precautionsStart = lines.findIndex(l => l.includes("Precautions:"));
    const remedies = remediesStart >= 0 ? lines.slice(remediesStart + 1, precautionsStart >= 0 ? precautionsStart : undefined).filter(l => l.trim()) : [];
    const precautions = precautionsStart >= 0 ? lines.slice(precautionsStart + 1).filter(l => l.trim()) : [];
    return { duration, remedies, precautions };
  };

  const { duration, remedies, precautions } = parseNotes(report.treatment_notes);

  return (
    <div className="min-h-screen bg-background">
      <div className="no-print"><NavBar /></div>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8 print:hidden">
          <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />{t("report.backDashboard")}
          </Button>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">{t("report.title")}</h1>
              <p className="text-muted-foreground">{t("report.generatedOn")} {new Date(report.diagnosis_date).toLocaleDateString()}</p>
            </div>
            <Button onClick={handlePrint} variant="outline">
              <Printer className="mr-2 h-4 w-4" />{t("report.print")}
            </Button>
          </div>
        </div>

        <div className="hidden print:block mb-8">
          <h1 className="text-3xl font-bold mb-2">{t("report.printTitle")}</h1>
          <p className="text-sm text-muted-foreground">{t("report.generatedOn")} {new Date(report.diagnosis_date).toLocaleDateString()}</p>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">{t("report.cattleInfo")}</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div><p className="text-sm text-muted-foreground">{t("report.name")}</p><p className="font-medium">{report.cattle?.name}</p></div>
              <div><p className="text-sm text-muted-foreground">{t("report.breed")}</p><p className="font-medium">{report.cattle?.breed || t("common.na")}</p></div>
              <div><p className="text-sm text-muted-foreground">{t("report.tagId")}</p><p className="font-medium">{report.cattle?.cattle_tag || t("common.na")}</p></div>
              <div><p className="text-sm text-muted-foreground">{t("report.age")}</p><p className="font-medium">{report.cattle?.age ? `${report.cattle.age} years` : t("common.na")}</p></div>
              <div><p className="text-sm text-muted-foreground">{t("report.weight")}</p><p className="font-medium">{report.cattle?.weight ? `${report.cattle.weight} kg` : t("common.na")}</p></div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">{t("report.diagnosis")}</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">{t("report.predictedDisease")}</p>
                <p className="text-2xl font-bold text-primary">{report.predicted_disease}</p>
              </div>
              <div className="flex gap-4 flex-wrap">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{t("report.confidence")}</p>
                  <Badge variant="secondary">{Math.round(report.confidence_score * 100)}%</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{t("report.severity")}</p>
                  <Badge className={getSeverityColor(report.severity)}>{report.severity}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{t("report.veterinarian")}</p>
                  <Badge variant={report.veterinarian_recommended ? "destructive" : "secondary"}>
                    {report.veterinarian_recommended ? t("report.required") : t("report.optional")}
                  </Badge>
                </div>
              </div>
              {report.selected_symptoms && report.selected_symptoms.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">{t("report.observedSymptoms")}</p>
                  <div className="flex flex-wrap gap-2">
                    {report.selected_symptoms.map((symptom) => (
                      <Badge key={symptom} variant="outline">{symptom.replace(/_/g, " ")}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {duration && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">{t("report.treatmentDuration")}</h2>
              <p>{duration}</p>
            </Card>
          )}

          {remedies.length > 0 && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">{t("report.homeRemedies")}</h2>
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

          {precautions.length > 0 && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">{t("report.precautions")}</h2>
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

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">{t("report.analysisInfo")}</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("report.mlModel")}:</span>
                <span className="font-medium">{report.ml_model_used}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("report.reportId")}:</span>
                <span className="font-mono text-xs">{report.id}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
