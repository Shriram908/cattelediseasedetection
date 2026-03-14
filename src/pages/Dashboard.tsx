import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import NavBar from "@/components/NavBar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Activity, Plus, FileText, Heart, Settings, Calendar, Syringe, AlertCircle, MessageSquare } from "lucide-react";
import { Session, User } from "@supabase/supabase-js";
import { format, isBefore, addDays } from "date-fns";
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
  const [userRole, setUserRole] = useState<string | null>(null);
  const [cattle, setCattle] = useState<Cattle[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
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

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user?.id)
        .single();

      if (roleData) {
        setUserRole(roleData.role);
      }

      if (roleData?.role === "farmer") {
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

        // Fetch upcoming appointments
        const { data: aptData } = await supabase
          .from("appointments")
          .select("*")
          .eq("farmer_id", user?.id)
          .in("status", ["pending", "confirmed"])
          .gte("appointment_date", new Date().toISOString())
          .order("appointment_date", { ascending: true })
          .limit(5);
        setAppointments(aptData || []);

        // Fetch due vaccinations
        const { data: vacData } = await supabase
          .from("vaccinations")
          .select(`*, cattle:cattle_id (name)`)
          .lte("next_due_date", addDays(new Date(), 30).toISOString().split("T")[0])
          .order("next_due_date", { ascending: true })
          .limit(5);
        setDueVaccinations(vacData || []);
      } else if (roleData?.role === "veterinarian") {
        // Fetch vet appointments
        const { data: aptData } = await supabase
          .from("appointments")
          .select(`*, cattle:cattle_id (name, breed)`)
          .eq("vet_id", user?.id)
          .in("status", ["pending", "confirmed"])
          .order("appointment_date", { ascending: true })
          .limit(10);
        setAppointments(aptData || []);
      }
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
          <p className="text-muted-foreground capitalize">
            {userRole === "farmer" ? t("dashboard.farmerDashboard") : t("dashboard.vetDashboard")}
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {userRole === "farmer" && (
            <>
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

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t("dashboard.upcomingAppts")}</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{appointments.length}</div>
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
            </>
          )}

          {userRole === "veterinarian" && (
            <>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t("dashboard.pendingAppointments")}</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {appointments.filter(a => a.status === "pending").length}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t("dashboard.confirmedToday")}</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {appointments.filter(a => a.status === "confirmed").length}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t("dashboard.account")}</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold">{t("report.veterinarian")}</div>
                  <p className="text-xs text-muted-foreground">{profile?.email}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t("dashboard.quickActions")}</CardTitle>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button size="sm" className="w-full" variant="outline" onClick={() => navigate("/vet-profile")}>
                    {t("nav.myClinic")}
                  </Button>
                  <Button size="sm" className="w-full" variant="outline" onClick={() => navigate("/messages")}>
                    {t("nav.messages")}
                  </Button>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Vet Appointments List */}
        {userRole === "veterinarian" && appointments.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">{t("dashboard.upcomingAppointments")}</h2>
              <Button variant="outline" onClick={() => navigate("/appointments")}>{t("dashboard.viewAll")}</Button>
            </div>
            <div className="space-y-3">
              {appointments.map((apt) => (
                <Card key={apt.id} className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold">{apt.reason}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(apt.appointment_date), "PPP 'at' p")}
                        {apt.cattle && ` • ${apt.cattle.name}`}
                      </p>
                    </div>
                    <Badge className={apt.status === "pending" ? "bg-warning text-white" : "bg-success text-white"}>
                      {apt.status}
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Farmer Alerts */}
        {userRole === "farmer" && dueVaccinations.length > 0 && (
          <Card className="mb-8 border-warning bg-warning/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-warning">
                <AlertCircle className="h-5 w-5" />
                Vaccination Reminders
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
                <Syringe className="mr-2 h-4 w-4" /> Manage Vaccinations
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Farmer Main Content */}
        {userRole === "farmer" && (
          <Tabs defaultValue="cattle" className="space-y-6">
            <TabsList>
              <TabsTrigger value="cattle">{t("dashboard.myCattle")}</TabsTrigger>
              <TabsTrigger value="reports">{t("dashboard.diagnosisHistory")}</TabsTrigger>
            </TabsList>

            <TabsContent value="cattle" className="space-y-4">
              <div className="flex items-center justify-between">
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
                          {animal.breed && <p><span className="text-muted-foreground">Breed:</span> {animal.breed}</p>}
                          {animal.age && <p><span className="text-muted-foreground">Age:</span> {animal.age} years</p>}
                        </div>
                        <div className="flex gap-2 mt-4">
                          <Button
                            className="flex-1"
                            variant="outline"
                            onClick={() => navigate(`/diagnose?cattle=${animal.id}`)}
                          >
                            Diagnose
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
              <h2 className="text-2xl font-bold">Recent Diagnoses</h2>

              {reports.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">No diagnosis reports yet</p>
                    <Button onClick={() => navigate("/diagnose")}>Create First Diagnosis</Button>
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
                        <div className="flex items-center justify-between">
                          <div className="text-sm">
                            <span className="text-muted-foreground">Confidence:</span>{" "}
                            <span className="font-medium">{(report.confidence_score * 100).toFixed(1)}%</span>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => navigate(`/report/${report.id}`)}>
                            View Report
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
