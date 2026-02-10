import { Link } from "react-router-dom";
import { Sparkles, ArrowRight, BarChart3, Users, Lightbulb, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Users,
    title: "Multi-Persona Analysis",
    description: "View your data through the lens of different stakeholders—citizens, accountants, engineers, and policy makers.",
  },
  {
    icon: Lightbulb,
    title: "AI-Powered Insights",
    description: "Leverage advanced AI to discover patterns and generate actionable insights from your datasets.",
  },
  {
    icon: BarChart3,
    title: "Dashboard Suggestions",
    description: "Get automated recommendations for visualizations that best represent your data stories.",
  },
  {
    icon: Zap,
    title: "Instant Analysis",
    description: "Upload your CSV and receive comprehensive analysis within seconds, not hours.",
  },
];

const Home = () => {
  return (
    <div className="relative overflow-hidden">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 px-6">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(173_80%_45%/0.12),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,hsl(35_95%_55%/0.08),transparent_50%)]" />
        
        <div className="relative max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 mb-8">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">AI-Powered Data Analysis</span>
          </div>
          
          {/* New Logo - matching Layout.tsx */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="relative">
              {/* Outer glow */}
              <div className="absolute inset-0 w-20 h-20 rounded-2xl bg-gradient-to-br from-primary via-accent to-primary opacity-60 blur-lg" />
              {/* Main logo container */}
              <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-accent flex items-center justify-center shadow-xl shadow-primary/30">
                <Zap className="w-10 h-10 text-primary-foreground" />
              </div>
            </div>
          </div>
          
          <h1 className="font-display text-5xl md:text-7xl font-bold text-foreground mb-6 leading-tight">
            <span className="gradient-text">InsightGen</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed mb-4">
            Perspective-Driven Insight Generator
          </p>
          
          <p className="text-lg text-muted-foreground/80 max-w-2xl mx-auto leading-relaxed mb-12">
            Transform raw data into meaningful insights tailored to different analytical perspectives. 
            From everyday users to policy strategists, discover what your data truly reveals.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              asChild
              size="lg"
              className="h-14 px-8 text-lg font-display font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-lg shadow-primary/25"
            >
              <Link to="/dashboard">
                Start Analyzing
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-14 px-8 text-lg font-display font-semibold"
            >
              <Link to="/methodology">
                Learn How It Works
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Powerful Features for Deep Analysis
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to extract meaningful insights from your data
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="glass-card rounded-2xl p-8 hover:border-primary/30 transition-all duration-300 group"
              >
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-display text-xl font-semibold text-foreground mb-3">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="glass-card rounded-3xl p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5" />
            <div className="relative">
              <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
                Ready to Transform Your Data?
              </h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Upload your dataset and let AI guide you through perspective-driven analysis.
              </p>
              <Button
                asChild
                size="lg"
                className="h-14 px-10 text-lg font-display font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-lg shadow-primary/25"
              >
                <Link to="/dashboard">
                  Get Started Free
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;