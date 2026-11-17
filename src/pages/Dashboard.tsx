import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import NavBar from "@/components/NavBar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Activity, Plus, FileText, Heart, Settings, Syringe, AlertCircle } from "lucide-react";
import { User } from "@supabase/supabase-js";
import { format, addDays } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n";

interface Profile {
  id: string;
  full_name: string | null;
  email: string;
}

interface Cattle {
  id: string;
  name: string;
  cattle_tag: string | null;
  age: number | null;
  breed: string | null;
  image_url: string | null;
}

interface Report {
  id: string;
  diagnosis_date: string;
  predicted_disease: string;
  confidence_score: number;
  severity: string;
  cattle: {
    name: string;
  };
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useI18n();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [cattle, setCattle] = useState<Cattle[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [dueVaccinations, setDueVaccinations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (!session) {
        navigate("/auth");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user?.id)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Fetch cattle
      const { data: cattleData } = await supabase
        .from("cattle")
        .select("*")
        .eq("owner_id", user?.id)
        .order("created_at", { ascending: false });
      setCattle(cattleData || []);

      // Fetch reports
      const { data: reportsData } = await supabase
        .from("reports")
        .select(`*, cattle:cattle_id (name)`)
        .eq("user_id", user?.id)
        .order("diagnosis_date", { ascending: false })
        .limit(10);
      setReports(reportsData || []);

      // Fetch due vaccinations
      const { data: vacData } = await supabase
        .from("vaccinations")
        .select(`*, cattle:cattle_id (name)`)
        .lte("next_due_date", addDays(new Date(), 30).toISOString().split("T")[0])
        .order("next_due_date", { ascending: true })
        .limit(5);
      setDueVaccinations(vacData || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error loading data",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "mild": return "bg-severity-mild/10 text-severity-mild border-severity-mild/20";
      case "moderate": return "bg-severity-moderate/10 text-severity-moderate border-severity-moderate/20";
      case "severe": return "bg-severity-severe/10 text-severity-severe border-severity-severe/20";
      case "critical": return "bg-severity-critical/10 text-severity-critical border-severity-critical/20";
      default: return "bg-muted text-muted-foreground";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Activity className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <NavBar />

      <main className="container mx-auto px-4 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            {t("dashboard.welcome")}, {profile?.full_name || "User"}!
          </h1>
          <p className="text-muted-foreground">{t("dashboard.farmerDashboard")}</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("dashboard.totalCattle")}</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{cattle.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("dashboard.diagnoses")}</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reports.length}</div>
            </CardContent>
          </Card>

          <Card className={dueVaccinations.length > 0 ? "border-warning" : ""}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("dashboard.dueVaccinations")}</CardTitle>
              <Syringe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dueVaccinations.length}</div>
              {dueVaccinations.length > 0 && (
                <p className="text-xs text-warning">{t("dashboard.actionNeeded")}</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Vaccination Reminders */}
        {dueVaccinations.length > 0 && (
          <Card className="mb-8 border-warning bg-warning/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-warning">
                <AlertCircle className="h-5 w-5" />
                {t("dashboard.vaccinationReminders")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {dueVaccinations.map((vac: any) => (
                  <div key={vac.id} className="flex justify-between items-center p-2 bg-background rounded">
                    <div>
                      <p className="font-medium">{vac.vaccine_name}</p>
                      <p className="text-sm text-muted-foreground">{vac.cattle?.name}</p>
                    </div>
                    <Badge variant="outline" className="border-warning text-warning">
                      Due: {vac.next_due_date ? format(new Date(vac.next_due_date), "PP") : "N/A"}
                    </Badge>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="mt-4" onClick={() => navigate("/vaccinations")}>
                <Syringe className="mr-2 h-4 w-4" /> {t("dashboard.manageVaccinations")}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        <Tabs defaultValue="cattle" className="space-y-6">
          <TabsList>
            <TabsTrigger value="cattle">{t("dashboard.myCattle")}</TabsTrigger>
            <TabsTrigger value="reports">{t("dashboard.diagnosisHistory")}</TabsTrigger>
          </TabsList>

          <TabsContent value="cattle" className="space-y-4">
            <div className="flex flex-wrap gap-3 items-center justify-between">
              <h2 className="text-2xl font-bold">{t("dashboard.cattleRegistry")}</h2>
              <Button onClick={() => navigate("/cattle/new")} className="gap-2">
                <Plus className="h-4 w-4" />
                {t("dashboard.addCattle")}
              </Button>
            </div>

            {cattle.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Heart className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">{t("dashboard.noCattle")}</p>
                  <Button onClick={() => navigate("/cattle/new")}>{t("dashboard.addFirst")}</Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {cattle.map((animal) => (
                  <Card key={animal.id} className="hover:shadow-md transition-shadow overflow-hidden">
                    {animal.image_url && (
                      <div className="h-40 overflow-hidden">
                        <img src={animal.image_url} alt={animal.name} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Heart className="h-5 w-5 text-primary" />
                        {animal.name}
                      </CardTitle>
                      {animal.cattle_tag && (
                        <CardDescription>Tag: {animal.cattle_tag}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-1 text-sm">
                        {animal.breed && <p><span className="text-muted-foreground">{t("report.breed")}:</span> {animal.breed}</p>}
                        {animal.age && <p><span className="text-muted-foreground">{t("report.age")}:</span> {animal.age} {t("report.years")}</p>}
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button
                          className="flex-1"
                          variant="outline"
                          onClick={() => navigate(`/diagnose?cattle=${animal.id}`)}
                        >
                          {t("dashboard.diagnoseBtn")}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => navigate(`/cattle/edit/${animal.id}`)}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <h2 className="text-2xl font-bold">{t("dashboard.recentDiagnoses")}</h2>

            {reports.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">{t("dashboard.noDiagnoses")}</p>
                  <Button onClick={() => navigate("/diagnose")}>{t("dashboard.createFirst")}</Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {reports.map((report) => (
                  <Card key={report.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{report.predicted_disease}</CardTitle>
                          <CardDescription>
                            {report.cattle?.name} • {new Date(report.diagnosis_date).toLocaleDateString()}
                          </CardDescription>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getSeverityColor(report.severity)}`}>
                          {report.severity}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-3 items-center justify-between">
                        <div className="text-sm">
                          <span className="text-muted-foreground">{t("dashboard.confidence")}:</span>{" "}
                          <span className="font-medium">{(report.confidence_score * 100).toFixed(1)}%</span>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => navigate(`/report/${report.id}`)}>
                          {t("dashboard.viewReport")}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Dashboard;
