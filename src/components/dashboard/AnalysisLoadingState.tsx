import { Sparkles, Zap } from "lucide-react";

export const AnalysisLoadingState = () => {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center space-y-6">
        <div className="relative">
          {/* Outer glow */}
          <div className="absolute inset-0 w-24 h-24 mx-auto rounded-2xl bg-gradient-to-br from-primary via-accent to-primary opacity-50 blur-lg animate-pulse" />
          {/* Main logo */}
          <div className="relative w-24 h-24 mx-auto rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-accent flex items-center justify-center animate-pulse shadow-xl shadow-primary/30">
            <Zap className="w-12 h-12 text-primary-foreground" />
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-accent flex items-center justify-center animate-bounce shadow-lg">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
        </div>
        
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground mb-2">
            Analyzing Your Dataset
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            AI is discovering patterns, generating insights, and preparing visualizations tailored to your perspective...
          </p>
        </div>
        
        <div className="flex justify-center gap-2">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="w-3 h-3 rounded-full bg-primary animate-pulse"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};