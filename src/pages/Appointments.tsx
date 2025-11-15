import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import NavBar from "@/components/NavBar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, Loader2, MapPin, Phone, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Appointment {
  id: string;
  appointment_date: string;
  status: string;
  reason: string;
  notes: string | null;
  cattle_id: string | null;
  farmer_id: string;
  vet_id: string;
  cattle?: {
    name: string;
    breed: string;
  };
  vet_profile?: {
    full_name: string;
    phone?: string;
    location?: string;
  };
  farmer_profile?: {
    full_name: string;
    phone: string;
  };
  veterinarian?: {
    clinic_name: string;
    clinic_address: string;
    phone: string;
  };
}

export default function Appointments() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>("");

  useEffect(() => {
    fetchUserRoleAndAppointments();
  }, []);

  const fetchUserRoleAndAppointments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Get user role
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single();

      if (roleData) {
        setUserRole(roleData.role);
      }

      // Fetch appointments based on role
      let query = supabase.from("appointments").select(`
        *,
        cattle:cattle_id (name, breed)
      `);

      if (roleData?.role === "farmer") {
        query = query.eq("farmer_id", user.id);
      } else if (roleData?.role === "veterinarian") {
        query = query.eq("vet_id", user.id);
      }

      const { data: appointmentsData, error } = await query.order("appointment_date", { ascending: true });

      if (error) throw error;

      // Fetch additional profile information
      const enrichedAppointments = await Promise.all(
        (appointmentsData || []).map(async (apt) => {
          if (roleData?.role === "farmer") {
            // Fetch vet profile and clinic info
            const { data: vetProfile } = await supabase
              .from("profiles")
              .select("full_name")
              .eq("id", apt.vet_id)
              .single();

            const { data: vetClinic } = await supabase
              .from("veterinarians")
              .select("clinic_name, clinic_address, phone")
              .eq("user_id", apt.vet_id)
              .single();

            return {
              ...apt,
              vet_profile: vetProfile,
              veterinarian: vetClinic,
            };
          } else {
            // Fetch farmer profile
            const { data: farmerProfile } = await supabase
              .from("profiles")
              .select("full_name, phone")
              .eq("id", apt.farmer_id)
              .single();

            return {
              ...apt,
              farmer_profile: farmerProfile,
            };
          }
        })
      );

      setAppointments(enrichedAppointments);
    } catch (error: any) {
      console.error("Error fetching appointments:", error);
      toast({
        title: "Error",
        description: "Failed to load appointments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (appointmentId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("appointments")
        .update({ status: newStatus })
        .eq("id", appointmentId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Appointment status updated",
      });

      fetchUserRoleAndAppointments();
    } catch (error: any) {
      console.error("Error updating appointment:", error);
      toast({
        title: "Error",
        description: "Failed to update appointment",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-success text-white";
      case "pending":
        return "bg-warning text-white";
      case "completed":
        return "bg-primary text-primary-foreground";
      case "cancelled":
        return "bg-destructive text-destructive-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const filterAppointments = (status?: string) => {
    if (!status) return appointments;
    return appointments.filter((apt) => apt.status === status);
  };

  const renderAppointmentCard = (apt: Appointment) => (
    <Card key={apt.id} className="p-6">
      <div className="space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xl font-bold">
              {userRole === "farmer" ? apt.veterinarian?.clinic_name : apt.farmer_profile?.full_name}
            </h3>
            <Badge className={getStatusColor(apt.status)}>{apt.status}</Badge>
          </div>
          <div className="flex gap-2">
            {userRole === "veterinarian" && apt.status === "pending" && (
              <Button
                size="sm"
                onClick={() => handleStatusUpdate(apt.id, "confirmed")}
              >
                Confirm
              </Button>
            )}
            {apt.status !== "cancelled" && apt.status !== "completed" && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleStatusUpdate(apt.id, "cancelled")}
              >
                Cancel
              </Button>
            )}
            {userRole === "veterinarian" && apt.status === "confirmed" && (
              <Button
                size="sm"
                variant="default"
                onClick={() => handleStatusUpdate(apt.id, "completed")}
              >
                Complete
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{format(new Date(apt.appointment_date), "PPP")}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{format(new Date(apt.appointment_date), "p")}</span>
          </div>
          {apt.cattle && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="h-4 w-4" />
              <span>
                {apt.cattle.name} ({apt.cattle.breed})
              </span>
            </div>
          )}
          {userRole === "farmer" && apt.veterinarian && (
            <>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{apt.veterinarian.clinic_address}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>{apt.veterinarian.phone}</span>
              </div>
            </>
          )}
          {userRole === "veterinarian" && apt.farmer_profile && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-4 w-4" />
              <span>{apt.farmer_profile.phone}</span>
            </div>
          )}
        </div>

        <div>
          <p className="text-sm font-semibold mb-1">Reason:</p>
          <p className="text-sm text-muted-foreground">{apt.reason}</p>
        </div>

        {apt.notes && (
          <div>
            <p className="text-sm font-semibold mb-1">Notes:</p>
            <p className="text-sm text-muted-foreground">{apt.notes}</p>
          </div>
        )}
      </div>
    </Card>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Appointments</h1>
            <p className="text-muted-foreground">Manage your veterinary appointments</p>
          </div>
          {userRole === "farmer" && (
            <Button onClick={() => navigate("/appointments/new")}>Book Appointment</Button>
          )}
        </div>

        <Tabs defaultValue="all" className="space-y-6">
          <TabsList>
            <TabsTrigger value="all">All ({appointments.length})</TabsTrigger>
            <TabsTrigger value="pending">
              Pending ({filterAppointments("pending").length})
            </TabsTrigger>
            <TabsTrigger value="confirmed">
              Confirmed ({filterAppointments("confirmed").length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({filterAppointments("completed").length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {appointments.length === 0 ? (
              <Card className="p-8 text-center">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No appointments yet</p>
              </Card>
            ) : (
              appointments.map(renderAppointmentCard)
            )}
          </TabsContent>

          <TabsContent value="pending" className="space-y-4">
            {filterAppointments("pending").length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No pending appointments</p>
              </Card>
            ) : (
              filterAppointments("pending").map(renderAppointmentCard)
            )}
          </TabsContent>

          <TabsContent value="confirmed" className="space-y-4">
            {filterAppointments("confirmed").length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No confirmed appointments</p>
              </Card>
            ) : (
              filterAppointments("confirmed").map(renderAppointmentCard)
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {filterAppointments("completed").length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No completed appointments</p>
              </Card>
            ) : (
              filterAppointments("completed").map(renderAppointmentCard)
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
