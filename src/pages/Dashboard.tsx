import { useState, useCallback, useEffect } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { FileUpload } from "@/components/FileUpload";
import { PersonaSelector, PersonaType, CustomPersonaData } from "@/components/PersonaSelector";
import { DataPreview } from "@/components/DataPreview";
import { useDatasetAnalysis } from "@/hooks/useDatasetAnalysis";
import { AnalysisDashboard } from "@/components/dashboard/AnalysisDashboard";
import { AnalysisLoadingState } from "@/components/dashboard/AnalysisLoadingState";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight, Brain, RotateCcw, Upload, Bookmark, Check, Lock } from "lucide-react";
import { toast } from "sonner";
import { saveAnalysis } from "@/pages/History";
import { getCurrentUser } from "@/lib/auth";
import { getStoredApiKey } from "@/lib/api";

const Dashboard = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const [file, setFile] = useState<File | null>(null);
  const [data, setData] = useState<string[][] | null>(null);
  const [persona, setPersona] = useState<PersonaType | null>(null);
  const [customPersona, setCustomPersona] = useState<CustomPersonaData | undefined>(undefined);
  const [isSaved, setIsSaved] = useState(false);
  
  const { isAnalyzing, insights, analyzeDataset, clearInsights, setInsights } = useDatasetAnalysis();
  const [user, setUser] = useState(getCurrentUser());
  const [hasApiKey, setHasApiKey] = useState(!!getStoredApiKey());

  useEffect(() => {
    setUser(getCurrentUser());
    setHasApiKey(!!getStoredApiKey());
  }, [location.pathname]);

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
    if (!user) {
      toast.error("Please sign in to analyze datasets.");
      return;
    }
    if (!hasApiKey) {
      toast.error("Please add your OpenAI API key in your profile.");
      return;
    }
    if (!data || !persona) return;
    
    // Validate custom persona if selected
    if (persona === 'custom' && (!customPersona?.name || !customPersona?.analyticalFocus)) {
      toast.error("Please complete the custom persona form before analyzing.");
      return;
    }
    
    setIsSaved(false);
    await analyzeDataset(data, persona, customPersona);
  }, [data, persona, customPersona, analyzeDataset, user, hasApiKey]);

  const handleNewAnalysis = useCallback(() => {
    setFile(null);
    setData(null);
    setPersona(null);
    setCustomPersona(undefined);
    setIsSaved(false);
    clearInsights();
  }, [clearInsights]);

  const handleSaveAnalysis = useCallback(() => {
    if (!user) {
      toast.error("Please sign in to save analyses.");
      return;
    }
    if (!insights || !data || !file || !persona) {
      toast.error("Nothing to save yet.");
      return;
    }
    
    const saved = saveAnalysis({
      fileName: file.name,
      persona,
      customPersona,
      date: new Date().toLocaleDateString(),
      recordCount: data.length - 1,
      insights,
      data,
    }, user.email);

    if (!saved) {
      toast.error("Could not save analysis locally. Please clear local cache and try again.");
      return;
    }

    setIsSaved(true);
    toast.success("Analysis saved successfully!");
  }, [insights, data, file, persona, customPersona, user]);

  const canAnalyze = file && data && persona && 
    (persona !== 'custom' || (customPersona?.name && customPersona?.analyticalFocus));

  const showExample = !user || !hasApiKey;
  const examplePersona: PersonaType = "common";
  const exampleData: string[][] = [
    ["Region", "Revenue", "Customers", "Month"],
    ["North", "120000", "320", "Jan"],
    ["South", "98000", "280", "Jan"],
    ["East", "143000", "360", "Jan"],
    ["West", "110000", "300", "Jan"],
  ];
  const exampleInsights = {
    dataSummary: [
      "Dataset has 4 columns with numeric and categorical fields.",
      "No missing values detected in the sample.",
      "Revenue ranges from 98k to 143k.",
    ],
    patterns: [
      "East region shows the highest revenue in the sample month.",
      "Customer counts track revenue closely across regions.",
      "South region lags behind others on both revenue and customers.",
    ],
    insights: [
      "The East region may be the strongest market segment this month.",
      "Customer volume appears to drive revenue performance across regions.",
      "South region could benefit from targeted growth initiatives.",
      "Revenue dispersion suggests opportunity for regional optimization.",
      "Comparing month-over-month trends would clarify seasonality impacts.",
      "A per-customer revenue view could reveal pricing differences by region.",
      "West and North are close; small initiatives could shift leadership.",
      "A focused retention campaign may improve South region outcomes.",
    ],
    dashboardViews: [
      {
        title: "Revenue by Region",
        purpose: "Compare regional performance at a glance",
        chartType: "bar",
        variables: ["Region", "Revenue"],
        aggregation: "sum",
        xAxisLabel: "Region",
        yAxisLabel: "Revenue",
      },
      {
        title: "Customers by Region",
        purpose: "See customer distribution",
        chartType: "bar",
        variables: ["Region", "Customers"],
        aggregation: "sum",
        xAxisLabel: "Region",
        yAxisLabel: "Customers",
      },
    ],
    cleaningReport: {
      totalRows: 4,
      cleanedRows: 4,
      removedRows: 0,
      nullsHandled: 0,
      duplicatesRemoved: 0,
      dataTypeCorrections: 0,
      outliersFlagged: 0,
      columnsAnalyzed: [
        { name: "Region", type: "text", nullCount: 0, uniqueCount: 4 },
        { name: "Revenue", type: "numeric", nullCount: 0, uniqueCount: 4 },
        { name: "Customers", type: "numeric", nullCount: 0, uniqueCount: 4 },
        { name: "Month", type: "text", nullCount: 0, uniqueCount: 1 },
      ],
    },
    columnStats: {
      Region: { type: "text", stats: {}, outlierCount: 0, nullCount: 0, uniqueCount: 4, sampleValues: ["North", "South", "East", "West"] },
      Revenue: { type: "numeric", stats: { min: 98000, max: 143000, mean: 117750, median: 115000, stdDev: 17060 }, outlierCount: 0, nullCount: 0, uniqueCount: 4, sampleValues: ["120000", "98000", "143000", "110000"] },
      Customers: { type: "numeric", stats: { min: 280, max: 360, mean: 315, median: 310, stdDev: 29 }, outlierCount: 0, nullCount: 0, uniqueCount: 4, sampleValues: ["320", "280", "360", "300"] },
      Month: { type: "text", stats: {}, outlierCount: 0, nullCount: 0, uniqueCount: 1, sampleValues: ["Jan"] },
    },
  };

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

  // Show example analysis for visitors without login/key
  if (showExample) {
    return (
      <div className="relative">
        <div className="relative py-12 px-6 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(173_80%_45%/0.1),transparent_50%)]" />
          <div className="relative max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 mb-6">
              <Lock className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Login required for analysis</span>
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
              Example Analysis
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Sign in and add your OpenAI API key to run your own analysis. Below is a sample dashboard preview.
            </p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <Button asChild className="gap-2">
                <a href="/login">Sign In / Sign Up</a>
              </Button>
              <Button asChild variant="outline" className="gap-2">
                <a href="/profile">Upload API Key</a>
              </Button>
            </div>
          </div>
        </div>
        <AnalysisDashboard
          insights={exampleInsights}
          persona={examplePersona}
          data={exampleData}
          fileName="Sample_Regional_Revenue.csv"
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