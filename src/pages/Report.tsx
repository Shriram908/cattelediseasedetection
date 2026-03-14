import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import NavBar from "@/components/NavBar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Loader2, ArrowLeft, Printer, AlertCircle, Stethoscope,
  ShieldAlert, Heart, Clock, Home, ShieldCheck, Bug,
  CheckCircle2, AlertTriangle, XCircle, Activity, FileText
} from "lucide-react";
import { useI18n } from "@/lib/i18n";

const SeverityIcon = ({ severity }: { severity: string }) => {
  switch (severity?.toLowerCase()) {
    case "mild": return <CheckCircle2 className="h-6 w-6 text-severity-mild" />;
    case "moderate": return <AlertTriangle className="h-6 w-6 text-severity-moderate" />;
    case "severe": return <AlertTriangle className="h-6 w-6 text-severity-severe" />;
    case "critical": return <XCircle className="h-6 w-6 text-severity-critical" />;
    default: return <Activity className="h-6 w-6 text-muted-foreground" />;
  }
};

const SeverityBar = ({ severity }: { severity: string }) => {
  const levels = ["mild", "moderate", "severe", "critical"];
  const activeIndex = levels.indexOf(severity?.toLowerCase());
  const colors = [
    "bg-severity-mild",
    "bg-severity-moderate",
    "bg-severity-severe",
    "bg-severity-critical",
  ];

  return (
    <div className="flex gap-1.5 mt-2">
      {levels.map((level, i) => (
        <div
          key={level}
          className={`h-2.5 flex-1 rounded-full transition-all ${
            i <= activeIndex ? colors[i] : "bg-muted"
          }`}
        />
      ))}
    </div>
  );
};

export default function Report() {
  const { reportId } = useParams<{ reportId: string }>();
  const navigate = useNavigate();
  const { t } = useI18n();

  const { data: report, isLoading } = useQuery({
    queryKey: ["report", reportId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reports")
        .select(`*, cattle:cattle_id (name, breed, cattle_tag, age, weight, farm_location)`)
        .eq("id", reportId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!reportId,
  });

  const handlePrint = () => window.print();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">{t("report.loading") || "Loading report..."}</p>
        </div>
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

  const getSeverityLabel = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case "mild": return "Mild – Not serious, can be treated at home";
      case "moderate": return "Moderate – Needs attention, monitor closely";
      case "severe": return "Severe – Urgent care needed";
      case "critical": return "Critical – Emergency! See a vet immediately";
      default: return severity;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case "mild": return "bg-severity-mild/10 text-severity-mild border-severity-mild/30";
      case "moderate": return "bg-severity-moderate/10 text-severity-moderate border-severity-moderate/30";
      case "severe": return "bg-severity-severe/10 text-severity-severe border-severity-severe/30";
      case "critical": return "bg-severity-critical/10 text-severity-critical border-severity-critical/30";
      default: return "bg-secondary/10 text-secondary";
    }
  };

  const parseNotes = (notes: string | null) => {
    if (!notes) return { duration: "", remedies: [] as string[], precautions: [] as string[] };
    const lines = notes.split("\n");
    const duration = lines.find(l => l.startsWith("Duration:"))?.replace("Duration:", "").trim() || "";
    const remediesStart = lines.findIndex(l => l.includes("Home Remedies:"));
    const precautionsStart = lines.findIndex(l => l.includes("Precautions:"));
    const remedies = remediesStart >= 0
      ? lines.slice(remediesStart + 1, precautionsStart >= 0 ? precautionsStart : undefined).filter(l => l.trim())
      : [];
    const precautions = precautionsStart >= 0
      ? lines.slice(precautionsStart + 1).filter(l => l.trim())
      : [];
    return { duration, remedies, precautions };
  };

  const { duration, remedies, precautions } = parseNotes(report.treatment_notes);
  const confidencePercent = Math.round(report.confidence_score * 100);
  const diagnosisDate = new Date(report.diagnosis_date).toLocaleDateString("en-IN", {
    day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Screen-only NavBar */}
      <div className="print:hidden"><NavBar /></div>

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Screen-only header */}
        <div className="mb-6 print:hidden">
          <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />{t("report.backDashboard")}
          </Button>
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-foreground">{t("report.title")}</h1>
            <Button onClick={handlePrint} variant="outline" size="sm">
              <Printer className="mr-2 h-4 w-4" />Print Report
            </Button>
          </div>
        </div>

        {/* Print-only header */}
        <div className="hidden print:block mb-6 border-b-2 border-primary pb-4">
          <div className="flex items-center gap-3 mb-2">
            <Stethoscope className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">🐄 CattleCare AI – Health Report</h1>
              <p className="text-sm text-muted-foreground">AI-Powered Cattle Disease Diagnosis</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Report Date: {diagnosisDate} • Report ID: {report.id?.slice(0, 8)}</p>
        </div>

        <div className="space-y-5">
          {/* ===== ALERT BANNER ===== */}
          {report.veterinarian_recommended && (
            <div className="rounded-lg border-2 border-severity-critical/40 bg-severity-critical/5 p-4 flex items-start gap-3">
              <ShieldAlert className="h-6 w-6 text-severity-critical flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-severity-critical text-lg">⚠️ Veterinarian Visit Required</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Based on the symptoms, we strongly recommend consulting a veterinarian as soon as possible. Do not delay treatment.
                </p>
              </div>
            </div>
          )}

          {/* ===== ANIMAL DETAILS ===== */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Heart className="h-5 w-5 text-primary" />
                Animal Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-3 gap-x-6 text-sm">
                <div>
                  <p className="text-muted-foreground">Name</p>
                  <p className="font-semibold">{report.cattle?.name || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Breed</p>
                  <p className="font-semibold">{report.cattle?.breed || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Tag / ID</p>
                  <p className="font-semibold">{report.cattle?.cattle_tag || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Age</p>
                  <p className="font-semibold">{report.cattle?.age ? `${report.cattle.age} years` : "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Weight</p>
                  <p className="font-semibold">{report.cattle?.weight ? `${report.cattle.weight} kg` : "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Location</p>
                  <p className="font-semibold">{report.cattle?.farm_location || "—"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ===== DIAGNOSIS RESULT ===== */}
          <Card className="border-2 border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Bug className="h-5 w-5 text-primary" />
                Diagnosis Result
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Disease Name */}
              <div className="text-center py-3 rounded-lg bg-primary/5">
                <p className="text-sm text-muted-foreground mb-1">Detected Disease</p>
                <p className="text-3xl font-bold text-primary">{report.predicted_disease}</p>
              </div>

              {/* Severity + Confidence side by side */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-lg border p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <SeverityIcon severity={report.severity} />
                    <p className="font-semibold">Severity Level</p>
                  </div>
                  <Badge className={`text-sm px-3 py-1 border ${getSeverityColor(report.severity)}`}>
                    {report.severity}
                  </Badge>
                  <SeverityBar severity={report.severity} />
                  <p className="text-xs text-muted-foreground mt-2">{getSeverityLabel(report.severity)}</p>
                </div>

                <div className="rounded-lg border p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="h-5 w-5 text-secondary" />
                    <p className="font-semibold">AI Confidence</p>
                  </div>
                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-bold text-secondary">{confidencePercent}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2.5 mt-2">
                    <div
                      className="bg-secondary h-2.5 rounded-full transition-all"
                      style={{ width: `${confidencePercent}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {confidencePercent >= 80 ? "High confidence in this diagnosis" :
                     confidencePercent >= 50 ? "Moderate confidence – consult a vet to confirm" :
                     "Low confidence – please consult a vet"}
                  </p>
                </div>
              </div>

              {/* Observed Symptoms */}
              {report.selected_symptoms && report.selected_symptoms.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-2">Observed Symptoms</p>
                  <div className="flex flex-wrap gap-2">
                    {report.selected_symptoms.map((symptom: string) => (
                      <Badge key={symptom} variant="outline" className="capitalize text-xs">
                        {symptom.replace(/_/g, " ")}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ===== TREATMENT DURATION ===== */}
          {duration && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Clock className="h-5 w-5 text-accent" />
                  Expected Recovery Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold">{duration}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Recovery time may vary. Monitor your animal daily and note any changes.
                </p>
              </CardContent>
            </Card>
          )}

          {/* ===== HOME REMEDIES ===== */}
          {remedies.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Home className="h-5 w-5 text-primary" />
                  What You Can Do at Home
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  These are simple steps you can follow right now to help your animal feel better:
                </p>
                <ul className="space-y-3">
                  {remedies.map((remedy, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary font-bold text-sm flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="text-sm leading-relaxed pt-0.5">{remedy}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* ===== PRECAUTIONS ===== */}
          {precautions.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ShieldCheck className="h-5 w-5 text-warning" />
                  Precautions to Prevent Spread
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Follow these precautions to protect your other animals:
                </p>
                <ul className="space-y-3">
                  {precautions.map((precaution, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-7 h-7 rounded-full bg-warning/10 text-warning font-bold text-sm flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="text-sm leading-relaxed pt-0.5">{precaution}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* ===== IMAGE ===== */}
          {report.image_url && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  Uploaded Image
                </CardTitle>
              </CardHeader>
              <CardContent>
                <img
                  src={report.image_url}
                  alt="Cattle diagnosis image"
                  className="w-full max-h-72 object-cover rounded-lg border"
                />
              </CardContent>
            </Card>
          )}

          {/* ===== FOOTER / META ===== */}
          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                <div>
                  <p className="font-medium">Report Date</p>
                  <p>{diagnosisDate}</p>
                </div>
                <div>
                  <p className="font-medium">AI Model Used</p>
                  <p>{report.ml_model_used}</p>
                </div>
                <div className="col-span-2">
                  <p className="font-medium">Report ID</p>
                  <p className="font-mono">{report.id}</p>
                </div>
              </div>
              <Separator className="my-4" />
              <p className="text-xs text-muted-foreground text-center italic">
                ⚠️ This report is generated by AI and is for informational purposes only.
                Always consult a qualified veterinarian for proper diagnosis and treatment.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
