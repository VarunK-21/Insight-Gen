import { Brain, Sparkles } from "lucide-react";

export const AnalysisHeader = () => {
  return (
    <header className="relative py-12 px-6 overflow-hidden">
      {/* Background glow effect */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(173_80%_45%/0.1),transparent_50%)]" />
      
      <div className="relative max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 mb-6">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-primary">AI-Powered Analysis</span>
        </div>
        
        <div className="flex items-center justify-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center glow-effect">
            <Brain className="w-7 h-7 text-primary-foreground" />
          </div>
        </div>
        
        <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
          Perspective-Driven
          <span className="gradient-text block">Insight Generator</span>
        </h1>
        
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Upload your dataset, select a persona, and discover insights tailored to 
          different perspectives—from everyday citizens to policy strategists.
        </p>
      </div>
    </header>
  );
};
