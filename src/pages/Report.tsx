import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import NavBar from "@/components/NavBar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Loader2, ArrowLeft, Printer, AlertCircle, Stethoscope,
  ShieldAlert, Heart, Clock, Home, ShieldCheck, Bug,
  CheckCircle2, AlertTriangle, XCircle, Activity, FileText, Zap
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useState, useEffect } from "react";

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
  const colors = ["bg-severity-mild", "bg-severity-moderate", "bg-severity-severe", "bg-severity-critical"];
  return (
    <div className="flex gap-1.5 mt-2">
      {levels.map((level, i) => (
        <div key={level} className={`h-2.5 flex-1 rounded-full transition-all ${i <= activeIndex ? colors[i] : "bg-muted"}`} />
      ))}
    </div>
  );
};

function useTranslatedContent(texts: string[], language: string) {
  const [translated, setTranslated] = useState<string[]>(texts);
  const [isTranslating, setIsTranslating] = useState(false);
  const cacheKey = `${language}-${texts.join("|")}`;

  useEffect(() => {
    if (language === "en" || texts.length === 0 || texts.every(t => !t.trim())) {
      setTranslated(texts);
      return;
    }

    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      try { setTranslated(JSON.parse(cached)); return; } catch {}
    }

    setIsTranslating(true);
    fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/translate-content`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ texts, targetLanguage: language }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.translated && Array.isArray(data.translated)) {
          setTranslated(data.translated);
          sessionStorage.setItem(cacheKey, JSON.stringify(data.translated));
        }
      })
      .catch(() => setTranslated(texts))
      .finally(() => setIsTranslating(false));
  }, [cacheKey, language, texts.length]);

  return { translated, isTranslating };
}

export default function Report() {
  const { reportId } = useParams<{ reportId: string }>();
  const navigate = useNavigate();
  const { t, language } = useI18n();

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

  const parseNotes = (notes: string | null) => {
    if (!notes) return { duration: "", firstAid: [] as string[], remedies: [] as string[], precautions: [] as string[] };
    const lines = notes.split("\n");
    const duration = lines.find(l => l.startsWith("Duration:"))?.replace("Duration:", "").trim() || "";
    const firstAidStart = lines.findIndex(l => l.includes("First Aid:"));
    const remediesStart = lines.findIndex(l => l.includes("Home Remedies:"));
    const precautionsStart = lines.findIndex(l => l.includes("Precautions:"));
    const firstAid = firstAidStart >= 0
      ? lines.slice(firstAidStart + 1, remediesStart >= 0 ? remediesStart : precautionsStart >= 0 ? precautionsStart : undefined).filter(l => l.trim())
      : [];
    const remedies = remediesStart >= 0
      ? lines.slice(remediesStart + 1, precautionsStart >= 0 ? precautionsStart : undefined).filter(l => l.trim())
      : [];
    const precautions = precautionsStart >= 0
      ? lines.slice(precautionsStart + 1).filter(l => l.trim())
      : [];
    return { duration, firstAid, remedies, precautions };
  };

  const { duration, firstAid, remedies, precautions } = parseNotes(report?.treatment_notes ?? null);

  // Translate dynamic content
  const allTexts = [...firstAid, ...remedies, ...precautions, duration, report?.predicted_disease || ""].filter(Boolean);
  const { translated: translatedTexts, isTranslating } = useTranslatedContent(allTexts, language);

  // Split translated texts back
  const translatedFirstAid = translatedTexts.slice(0, firstAid.length);
  const translatedRemedies = translatedTexts.slice(firstAid.length, firstAid.length + remedies.length);
  const translatedPrecautions = translatedTexts.slice(firstAid.length + remedies.length, firstAid.length + remedies.length + precautions.length);
  const translatedDuration = translatedTexts[firstAid.length + remedies.length + precautions.length] || duration;
  const translatedDisease = translatedTexts[firstAid.length + remedies.length + precautions.length + 1] || report?.predicted_disease || "";

  const handlePrint = () => window.print();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">{t("common.loading")}</p>
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
      case "mild": return t("report.severityMild");
      case "moderate": return t("report.severityModerate");
      case "severe": return t("report.severitySevere");
      case "critical": return t("report.severityCritical");
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

  const confidencePercent = Math.round(report.confidence_score * 100);
  const diagnosisDate = new Date(report.diagnosis_date).toLocaleDateString(
    language === "hi" ? "hi-IN" : language === "mr" ? "mr-IN" : "en-IN",
    { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="print:hidden"><NavBar /></div>

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-6 print:hidden">
          <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />{t("report.backDashboard")}
          </Button>
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-foreground">{t("report.title")}</h1>
            <Button onClick={handlePrint} variant="outline" size="sm">
              <Printer className="mr-2 h-4 w-4" />{t("report.print")}
            </Button>
          </div>
        </div>

        <div className="hidden print:block mb-6 border-b-2 border-primary pb-4">
          <div className="flex items-center gap-3 mb-2">
            <Stethoscope className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">🐄 CattleCare AI – {t("report.printTitle")}</h1>
              <p className="text-sm text-muted-foreground">AI-Powered Cattle Disease Diagnosis</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">{t("report.generatedOn")}: {diagnosisDate}</p>
        </div>

        {isTranslating && (
          <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground justify-center">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>{t("common.loading")}</span>
          </div>
        )}

        <div className="space-y-5">
          {report.veterinarian_recommended && (
            <div className="rounded-lg border-2 border-severity-critical/40 bg-severity-critical/5 p-4 flex items-start gap-3">
              <ShieldAlert className="h-6 w-6 text-severity-critical flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-severity-critical text-lg">{t("report.vetRequired")}</p>
                <p className="text-sm text-muted-foreground mt-1">{t("report.vetRequiredDesc")}</p>
              </div>
            </div>
          )}

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Heart className="h-5 w-5 text-primary" />
                {t("report.animalDetails")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-3 gap-x-6 text-sm">
                <div>
                  <p className="text-muted-foreground">{t("report.name")}</p>
                  <p className="font-semibold">{report.cattle?.name || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t("report.breed")}</p>
                  <p className="font-semibold">{report.cattle?.breed || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t("report.tagId")}</p>
                  <p className="font-semibold">{report.cattle?.cattle_tag || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t("report.age")}</p>
                  <p className="font-semibold">{report.cattle?.age ? `${report.cattle.age} ${t("report.years")}` : "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t("report.weight")}</p>
                  <p className="font-semibold">{report.cattle?.weight ? `${report.cattle.weight} ${t("report.kg")}` : "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t("report.location")}</p>
                  <p className="font-semibold">{report.cattle?.farm_location || "—"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Bug className="h-5 w-5 text-primary" />
                {t("report.diagnosisResult")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="text-center py-3 rounded-lg bg-primary/5">
                <p className="text-sm text-muted-foreground mb-1">{t("report.detectedDisease")}</p>
                <p className="text-3xl font-bold text-primary">{translatedDisease}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-lg border p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <SeverityIcon severity={report.severity} />
                    <p className="font-semibold">{t("report.severityLevel")}</p>
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
                    <p className="font-semibold">{t("report.aiConfidence")}</p>
                  </div>
                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-bold text-secondary">{confidencePercent}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2.5 mt-2">
                    <div className="bg-secondary h-2.5 rounded-full transition-all" style={{ width: `${confidencePercent}%` }} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {confidencePercent >= 80 ? t("report.confidenceHigh") :
                     confidencePercent >= 50 ? t("report.confidenceMedium") :
                     t("report.confidenceLow")}
                  </p>
                </div>
              </div>

              {report.selected_symptoms && report.selected_symptoms.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-2">{t("report.observedSymptoms")}</p>
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

          {translatedDuration && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Clock className="h-5 w-5 text-accent" />
                  {t("report.recoveryTime")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold">{translatedDuration}</p>
                <p className="text-sm text-muted-foreground mt-1">{t("report.recoveryNote")}</p>
              </CardContent>
            </Card>
          )}

          {translatedRemedies.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Home className="h-5 w-5 text-primary" />
                  {t("report.homeRemediesTitle")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">{t("report.homeRemediesDesc")}</p>
                <ul className="space-y-3">
                  {translatedRemedies.map((remedy, idx) => (
                    <li key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
                      <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/15 text-primary font-bold text-sm flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="text-sm leading-relaxed pt-0.5">{remedy}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 p-3 rounded-lg bg-accent/10 border border-accent/20">
                  <p className="text-xs text-accent-foreground font-medium">
                    💡 {t("report.importantNote")}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {translatedPrecautions.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ShieldCheck className="h-5 w-5 text-warning" />
                  {t("report.precautionsTitle")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">{t("report.precautionsDesc")}</p>
                <ul className="space-y-3">
                  {translatedPrecautions.map((precaution, idx) => (
                    <li key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-warning/5 border border-warning/10">
                      <span className="flex-shrink-0 w-7 h-7 rounded-full bg-warning/15 text-warning font-bold text-sm flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="text-sm leading-relaxed pt-0.5">{precaution}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {report.image_url && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  {t("report.uploadedImage")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <img src={report.image_url} alt="Cattle diagnosis" className="w-full max-h-72 object-cover rounded-lg border" />
              </CardContent>
            </Card>
          )}

          <p className="text-xs text-muted-foreground text-center italic px-4 pb-4">
            {t("report.disclaimer")}
          </p>
        </div>
      </div>
    </div>
  );
}
