import { User, Mail, Linkedin, Github, Heart, Code2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const About = () => {
  return (
    <div className="relative">
      {/* Header */}
      <div className="relative py-12 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(173_80%_45%/0.1),transparent_50%)]" />
        
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 mb-6">
            <User className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">About</span>
          </div>
          
          <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
            Meet the
            <span className="gradient-text"> Creator</span>
          </h1>
          
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            The mind behind InsightGen
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 pb-20">
        {/* Profile Card */}
        <div className="glass-card rounded-3xl p-8 md:p-12 mb-12">
          <div className="flex flex-col md:flex-row items-center gap-8">
            {/* Avatar */}
            <div className="relative">
              <div className="w-40 h-40 rounded-3xl bg-gradient-to-br from-primary to-accent flex items-center justify-center glow-effect">
                <span className="font-display text-5xl font-bold text-primary-foreground">VK</span>
              </div>
              <div className="absolute -bottom-2 -right-2 w-12 h-12 rounded-xl bg-secondary border-4 border-background flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
            </div>
            
            {/* Info */}
            <div className="flex-1 text-center md:text-left">
              <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
                Varun K
              </h2>
              <p className="text-lg text-primary font-medium mb-4">
                Creator & Developer
              </p>
              <p className="text-muted-foreground leading-relaxed mb-6 max-w-lg">
                Passionate about transforming complex data into actionable insights. 
                I believe in the power of perspective—that the same data can tell different 
                stories to different stakeholders, and all those stories matter.
              </p>
              
              <div className="flex items-center justify-center md:justify-start gap-3">
                <Button variant="outline" size="icon" className="rounded-xl">
                  <Github className="w-5 h-5" />
                </Button>
                <Button variant="outline" size="icon" className="rounded-xl">
                  <Linkedin className="w-5 h-5" />
                </Button>
                <Button variant="outline" size="icon" className="rounded-xl">
                  <Mail className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Mission */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="glass-card rounded-2xl p-8">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-6">
              <Heart className="w-7 h-7 text-primary" />
            </div>
            <h3 className="font-display text-xl font-semibold text-foreground mb-3">
              The Mission
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              To democratize data analysis by making it accessible to everyone, 
              regardless of their technical background. InsightGen bridges the gap 
              between raw data and meaningful understanding.
            </p>
          </div>
          
          <div className="glass-card rounded-2xl p-8">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center mb-6">
              <Code2 className="w-7 h-7 text-accent" />
            </div>
            <h3 className="font-display text-xl font-semibold text-foreground mb-3">
              The Tech
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              Built with React, TypeScript, and powered by OpenAI models. 
              InsightGen combines modern web technologies with cutting-edge 
              artificial intelligence to deliver intelligent data analysis.
            </p>
          </div>
        </div>

        {/* Quote */}
        <div className="glass-card rounded-3xl p-8 md:p-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5" />
          <div className="relative">
            <blockquote className="font-display text-2xl md:text-3xl font-semibold text-foreground mb-6 leading-relaxed">
              "Data doesn't lie, but it speaks differently to different people. 
              My goal is to help everyone hear what's relevant to them."
            </blockquote>
            <cite className="text-lg text-primary font-medium">— Varun K</cite>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
