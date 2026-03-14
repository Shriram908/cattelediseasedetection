import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Stethoscope, LogOut, Menu, X, User, MessageSquare, Syringe } from "lucide-react";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useI18n } from "@/lib/i18n";

export default function NavBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useI18n();
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserRole(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserRole(session.user.id);
      } else {
        setUserRole(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRole = async (userId: string) => {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .single();
    
    if (!error && data) {
      setUserRole(data.role);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const isActive = (path: string) => location.pathname === path;

  if (!user) return null;

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link to="/dashboard" className="flex items-center space-x-2">
            <Stethoscope className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl">CattleCare AI</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link
              to="/dashboard"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isActive("/dashboard") ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {t("nav.dashboard")}
            </Link>
            <Link
              to="/diagnose"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isActive("/diagnose") ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {t("nav.diagnose")}
            </Link>
            <Link
              to="/messages"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isActive("/messages") ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <MessageSquare className="h-4 w-4" />
            </Link>
            <Link
              to="/vaccinations"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isActive("/vaccinations") ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Syringe className="h-4 w-4" />
            </Link>
            <Link
              to="/profile"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isActive("/profile") ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <User className="h-4 w-4" />
            </Link>
            <LanguageSwitcher />
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              {t("nav.logout")}
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 space-y-3 border-t">
              <Link to="/dashboard" className="block text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>
                {t("nav.dashboard")}
              </Link>
              <Link to="/diagnose" className="block text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>
                {t("nav.diagnose")}
              </Link>
              <Link to="/messages" className="block text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>
                {t("nav.messages")}
              </Link>
              <Link to="/vaccinations" className="block text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>
                {t("nav.vaccinations")}
              </Link>
              <Link to="/profile" className="block text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>
                {t("nav.profile")}
              </Link>
              <div className="flex items-center gap-2">
                <LanguageSwitcher />
              </div>
              <Button variant="ghost" size="sm" onClick={() => { handleLogout(); setMobileMenuOpen(false); }} className="w-full justify-start">
                <LogOut className="h-4 w-4 mr-2" />
                {t("nav.logout")}
              </Button>
            </div>
          )}
      </div>
    </nav>
  );
}
