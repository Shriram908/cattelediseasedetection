import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Brain, FileText, MapPin, Shield, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Brain,
      title: "AI-Powered Detection",
      description: "Advanced machine learning algorithms analyze images and symptoms to detect 26+ cattle diseases with high accuracy.",
    },
    {
      icon: FileText,
      title: "Professional Reports",
      description: "Generate comprehensive medical reports with disease information, remedies, and treatment recommendations.",
    },
    {
      icon: Zap,
      title: "Dual Analysis",
      description: "Combine image-based CNN analysis with symptom-based classification for more accurate diagnoses.",
    },
    {
      icon: MapPin,
      title: "Veterinarian Locator",
      description: "Find nearby veterinarians with contact details when professional care is recommended.",
    },
    {
      icon: Shield,
      title: "Multilingual Support",
      description: "Access the system in English, Hindi, and Marathi for maximum accessibility.",
    },
    {
      icon: Activity,
      title: "History Tracking",
      description: "Save and track diagnosis history for all your cattle with detailed records.",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/5 via-background to-secondary/5 py-20 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 mb-6 bg-primary/10 px-4 py-2 rounded-full border border-primary/20">
              <Activity className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-primary">AI-Powered Veterinary Care</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              CattleCare AI
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Advanced machine learning system for early detection and diagnosis of cattle diseases. 
              Protect your herd with instant AI-powered analysis.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => navigate("/auth")} className="text-lg px-8">
                Get Started
                <Activity className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/auth")}>
                Learn More
              </Button>
            </div>

            <div className="mt-12 grid grid-cols-3 gap-8 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">26+</div>
                <div className="text-sm text-muted-foreground">Diseases Detected</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">92+</div>
                <div className="text-sm text-muted-foreground">Symptoms Analyzed</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">95%+</div>
                <div className="text-sm text-muted-foreground">Accuracy Rate</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Comprehensive Features</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to monitor and maintain the health of your cattle herd
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <Card key={index} className="border-2 hover:border-primary/50 transition-colors hover:shadow-lg">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-lg text-muted-foreground">Simple, fast, and accurate diagnosis in 3 easy steps</p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="space-y-8">
              {[
                {
                  step: "1",
                  title: "Upload & Select",
                  description: "Upload images of your cattle or select symptoms from our comprehensive checklist",
                },
                {
                  step: "2",
                  title: "AI Analysis",
                  description: "Our advanced ML models analyze the data using CNN for images and multiple algorithms for symptoms",
                },
                {
                  step: "3",
                  title: "Get Results",
                  description: "Receive detailed diagnosis with confidence scores, treatment recommendations, and veterinarian referrals if needed",
                },
              ].map((item) => (
                <div key={item.step} className="flex gap-6 items-start">
                  <div className="flex-shrink-0 h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold">
                    {item.step}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                    <p className="text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary via-primary-glow to-primary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-primary-foreground">
            Ready to Protect Your Herd?
          </h2>
          <p className="text-lg text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
            Join thousands of farmers and veterinarians using CattleCare AI for accurate disease detection
          </p>
          <Button size="lg" variant="secondary" onClick={() => navigate("/auth")} className="text-lg px-8">
            Start Free Trial
            <Activity className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t bg-card">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; 2025 CattleCare AI. Advanced AI-powered cattle disease detection system.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;