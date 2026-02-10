import { useState, useCallback, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { FileUpload } from "@/components/FileUpload";
import { PersonaSelector, PersonaType, CustomPersonaData } from "@/components/PersonaSelector";
import { DataPreview } from "@/components/DataPreview";
import { useDatasetAnalysis } from "@/hooks/useDatasetAnalysis";
import { AnalysisDashboard } from "@/components/dashboard/AnalysisDashboard";
import { AnalysisLoadingState } from "@/components/dashboard/AnalysisLoadingState";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight, Brain, RotateCcw, Upload, Bookmark, Check } from "lucide-react";
import { toast } from "sonner";
import { saveAnalysis } from "@/pages/History";

const Dashboard = () => {
  const [searchParams] = useSearchParams();
  const [file, setFile] = useState<File | null>(null);
  const [data, setData] = useState<string[][] | null>(null);
  const [persona, setPersona] = useState<PersonaType | null>(null);
  const [customPersona, setCustomPersona] = useState<CustomPersonaData | undefined>(undefined);
  const [isSaved, setIsSaved] = useState(false);
  
  const { isAnalyzing, insights, analyzeDataset, clearInsights, setInsights } = useDatasetAnalysis();

  // Handle viewing saved analysis
  useEffect(() => {
    if (searchParams.get('view') === 'saved') {
      const savedData = sessionStorage.getItem('view_analysis');
      if (savedData) {
        try {
          const analysis = JSON.parse(savedData);
          setFile({ name: analysis.fileName } as File);
          setData(analysis.data);
          setPersona(analysis.persona);
          setCustomPersona(analysis.customPersona);
          setInsights(analysis.insights);
          setIsSaved(true);
          sessionStorage.removeItem('view_analysis');
        } catch (e) {
          console.error('Failed to load saved analysis', e);
        }
      }
    }
  }, [searchParams, setInsights]);

  const handleFileSelect = useCallback((selectedFile: File, parsedData: string[][]) => {
    setFile(selectedFile);
    setData(parsedData);
    clearInsights();
    setIsSaved(false);
    toast.success("Dataset loaded successfully!");
  }, [clearInsights]);

  const handleClearFile = useCallback(() => {
    setFile(null);
    setData(null);
    clearInsights();
    setIsSaved(false);
  }, [clearInsights]);

  const handlePersonaSelect = useCallback((selectedPersona: PersonaType, customData?: CustomPersonaData) => {
    setPersona(selectedPersona);
    if (selectedPersona === 'custom' && customData) {
      setCustomPersona(customData);
    } else {
      setCustomPersona(undefined);
    }
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!data || !persona) return;
    
    // Validate custom persona if selected
    if (persona === 'custom' && (!customPersona?.name || !customPersona?.analyticalFocus)) {
      toast.error("Please complete the custom persona form before analyzing.");
      return;
    }
    
    setIsSaved(false);
    await analyzeDataset(data, persona, customPersona);
  }, [data, persona, customPersona, analyzeDataset]);

  const handleNewAnalysis = useCallback(() => {
    setFile(null);
    setData(null);
    setPersona(null);
    setCustomPersona(undefined);
    setIsSaved(false);
    clearInsights();
  }, [clearInsights]);

  const handleSaveAnalysis = useCallback(() => {
    if (!insights || !data || !file || !persona) return;
    
    saveAnalysis({
      fileName: file.name,
      persona,
      customPersona,
      date: new Date().toLocaleDateString(),
      recordCount: data.length - 1,
      insights,
      data,
    });
    
    setIsSaved(true);
    toast.success("Analysis saved successfully!");
  }, [insights, data, file, persona, customPersona]);

  const canAnalyze = file && data && persona && 
    (persona !== 'custom' || (customPersona?.name && customPersona?.analyticalFocus));

  // Show loading state
  if (isAnalyzing) {
    return (
      <div className="relative">
        <AnalysisLoadingState />
      </div>
    );
  }

  // Show dashboard when we have insights
  if (insights && data && file && persona) {
    return (
      <div className="relative">
        {/* Action Buttons */}
        <div className="fixed bottom-6 right-6 z-50 flex gap-3">
          <Button 
            onClick={handleSaveAnalysis}
            disabled={isSaved}
            variant={isSaved ? "secondary" : "default"}
            className={`gap-2 shadow-lg ${
              isSaved 
                ? 'bg-persona-engineer/20 text-persona-engineer border border-persona-engineer/50' 
                : 'bg-gradient-to-r from-accent to-accent/80 hover:from-accent/90 hover:to-accent/70'
            }`}
          >
            {isSaved ? (
              <>
                <Check className="w-4 h-4" />
                Saved
              </>
            ) : (
              <>
                <Bookmark className="w-4 h-4" />
                Save Analysis
              </>
            )}
          </Button>
          <Button 
            onClick={handleNewAnalysis}
            className="gap-2 shadow-lg shadow-primary/25 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
          >
            <RotateCcw className="w-4 h-4" />
            New Analysis
          </Button>
        </div>
        
        <AnalysisDashboard 
          insights={insights} 
          persona={persona} 
          data={data}
          fileName={file.name}
          customPersona={customPersona}
        />
      </div>
    );
  }

  // Show configuration view
  return (
    <div className="relative">
      {/* Header */}
      <div className="relative py-12 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(173_80%_45%/0.1),transparent_50%)]" />
        
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 mb-6">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Analysis Dashboard</span>
          </div>
          
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center glow-effect">
              <Brain className="w-7 h-7 text-primary-foreground" />
            </div>
          </div>
          
          <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
            Analyze Your
            <span className="gradient-text"> Dataset</span>
          </h1>
          
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Upload your data, choose a perspective, and let AI uncover the insights that matter most.
          </p>
        </div>
      </div>
      
      <div className="max-w-4xl mx-auto px-6 pb-20">
        <div className="space-y-8">
          {/* Step 1: File Upload */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Upload className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-display font-semibold text-xl text-foreground">
                  Step 1: Upload Dataset
                </h2>
                <p className="text-sm text-muted-foreground">CSV file with headers required</p>
              </div>
            </div>
            
            <FileUpload 
              onFileSelect={handleFileSelect}
              selectedFile={file}
              onClear={handleClearFile}
            />
          </div>
          
          {/* Data Preview */}
          {data && (
            <DataPreview data={data} fileName={file?.name || ''} />
          )}
          
          {/* Step 2: Persona Selection - Always visible after file upload */}
          {data && (
            <div className="glass-card rounded-2xl p-6 animate-slide-up">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
                  <Brain className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h2 className="font-display font-semibold text-xl text-foreground">
                    Step 2: Choose Perspective
                  </h2>
                  <p className="text-sm text-muted-foreground">Select a preset or create your own custom persona</p>
                </div>
              </div>
              
              <PersonaSelector 
                selected={persona}
                onSelect={handlePersonaSelect}
              />
            </div>
          )}
          
          {/* Analyze Button */}
          {data && (
            <Button
              onClick={handleAnalyze}
              disabled={!canAnalyze || isAnalyzing}
              className="w-full h-16 text-lg font-display font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-lg shadow-primary/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed animate-slide-up"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Generate AI-Powered Dashboard
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;