import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import NavBar from "@/components/NavBar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Activity, Plus, FileText, Heart, AlertCircle, Settings } from "lucide-react";
import { Session, User } from "@supabase/supabase-js";

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
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [cattle, setCattle] = useState<Cattle[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!session) {
        navigate("/auth");
      }
    });

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
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
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user?.id)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Fetch user role
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user?.id)
        .single();
      
      if (roleData) {
        setUserRole(roleData.role);
      }

      // Fetch cattle
      const { data: cattleData, error: cattleError } = await supabase
        .from("cattle")
        .select("*")
        .eq("owner_id", user?.id)
        .order("created_at", { ascending: false });

      if (cattleError) throw cattleError;
      setCattle(cattleData || []);

      // Fetch reports with cattle names
      const { data: reportsData, error: reportsError } = await supabase
        .from("reports")
        .select(`
          *,
          cattle:cattle_id (name)
        `)
        .eq("user_id", user?.id)
        .order("diagnosis_date", { ascending: false })
        .limit(10);

      if (reportsError) throw reportsError;
      setReports(reportsData || []);
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
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
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Cattle</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{cattle.length}</div>
              <p className="text-xs text-muted-foreground">Registered animals</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Diagnoses</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reports.length}</div>
              <p className="text-xs text-muted-foreground">Total reports</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Account</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize">{userRole || "User"}</div>
              <p className="text-xs text-muted-foreground">{profile?.email}</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="cattle" className="space-y-6">
          <TabsList>
            <TabsTrigger value="cattle">My Cattle</TabsTrigger>
            <TabsTrigger value="reports">Diagnosis History</TabsTrigger>
          </TabsList>

          <TabsContent value="cattle" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Cattle Registry</h2>
              <Button onClick={() => navigate("/cattle/new")} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Cattle
              </Button>
            </div>

            {cattle.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Heart className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">No cattle registered yet</p>
                  <Button onClick={() => navigate("/cattle/new")}>Add Your First Cattle</Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {cattle.map((animal) => (
                  <Card key={animal.id} className="hover:shadow-md transition-shadow">
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
      </main>
    </div>
  );
};

export default Dashboard;