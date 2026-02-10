import { useState, useEffect } from "react";
import { Bookmark, FileSpreadsheet, User, ArrowRight, Trash2, Eye, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ExtendedAnalysisResult } from "@/hooks/useDatasetAnalysis";
import { PersonaType, CustomPersonaData } from "@/components/PersonaSelector";
import { toast } from "sonner";

interface SavedAnalysis {
  id: string;
  fileName: string;
  persona: PersonaType;
  customPersona?: CustomPersonaData;
  date: string;
  timestamp: number;
  recordCount: number;
  insights: ExtendedAnalysisResult;
  data: string[][];
}

const STORAGE_KEY = 'insightgen_saved_analyses';

// Export functions for use in Dashboard
export const saveAnalysis = (analysis: Omit<SavedAnalysis, 'id' | 'timestamp'>) => {
  const saved = getSavedAnalyses();
  const newAnalysis: SavedAnalysis = {
    ...analysis,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
  };
  saved.unshift(newAnalysis);
  // Keep only last 20 analyses
  const trimmed = saved.slice(0, 20);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  return newAnalysis;
};

export const getSavedAnalyses = (): SavedAnalysis[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const deleteAnalysis = (id: string) => {
  const saved = getSavedAnalyses().filter(a => a.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
};

const personaLabels: Record<PersonaType, string> = {
  common: 'Common Citizen',
  accountant: 'Chartered Accountant',
  engineer: 'Systems Engineer',
  policy: 'Policy Strategist',
  lawyer: 'Legal Advisor',
  business: 'Business Analyst',
  data_scientist: 'Data Scientist',
  product_manager: 'Product Manager',
  custom: 'Custom',
};

const History = () => {
  const [analyses, setAnalyses] = useState<SavedAnalysis[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    setAnalyses(getSavedAnalyses());
  }, []);

  const handleDelete = (id: string) => {
    deleteAnalysis(id);
    setAnalyses(getSavedAnalyses());
    setDeleteConfirm(null);
    toast.success("Analysis deleted");
  };

  const handleView = (analysis: SavedAnalysis) => {
    // Store in session for viewing
    sessionStorage.setItem('view_analysis', JSON.stringify(analysis));
    navigate('/dashboard?view=saved');
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit'
    });
  };

  return (
    <div className="relative">
      {/* Header */}
      <div className="relative py-12 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(173_80%_45%/0.1),transparent_50%)]" />
        
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 mb-6">
            <Bookmark className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Saved Analyses</span>
          </div>
          
          <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
            Your Saved
            <span className="gradient-text"> Analyses</span>
          </h1>
          
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Access your previously saved dataset analyses and insights.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 pb-20">
        {analyses.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-secondary flex items-center justify-center">
              <FileSpreadsheet className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="font-display font-semibold text-xl text-foreground mb-2">
              No Saved Analyses Yet
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-8">
              Start by analyzing a dataset and click "Save Analysis" to store it for later reference.
            </p>
            <Button
              asChild
              className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground"
            >
              <Link to="/dashboard">
                Start Your First Analysis
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Stats Bar */}
            <div className="flex items-center justify-between mb-6 p-4 glass-card rounded-xl">
              <p className="text-sm text-muted-foreground">
                <span className="text-foreground font-semibold">{analyses.length}</span> saved {analyses.length === 1 ? 'analysis' : 'analyses'}
              </p>
              <Button asChild variant="outline" size="sm">
                <Link to="/dashboard">
                  New Analysis
                  <ArrowRight className="w-3 h-3 ml-1" />
                </Link>
              </Button>
            </div>

            {analyses.map((analysis) => (
              <div
                key={analysis.id}
                className="glass-card rounded-xl p-5 hover:border-primary/30 transition-all duration-300 group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <FileSpreadsheet className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display font-semibold text-foreground truncate">
                        {analysis.fileName}
                      </h3>
                      <div className="flex flex-wrap items-center gap-3 mt-1.5">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {formatDate(analysis.timestamp)}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {formatTime(analysis.timestamp)}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {analysis.recordCount.toLocaleString()} records
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary">
                      <User className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {analysis.persona === 'custom' && analysis.customPersona?.name 
                          ? analysis.customPersona.name 
                          : personaLabels[analysis.persona]}
                      </span>
                    </div>
                    
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleView(analysis)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                      onClick={() => setDeleteConfirm(analysis.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Preview of insights */}
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-2">Top Insight:</p>
                  <p className="text-sm text-foreground line-clamp-2">
                    {analysis.insights.insights[0]}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Analysis?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. The saved analysis will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default History;
