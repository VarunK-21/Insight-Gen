import { useState, useCallback } from "react";
import { analyzeDataset as callAnalyzeAPI, AnalysisResult as APIAnalysisResult, CleaningReport } from "@/lib/api";
import { PersonaType, CustomPersonaData } from "@/components/PersonaSelector";
import { AnalysisResult } from "@/components/InsightsPanel";
import { toast } from "sonner";

export interface ExtendedAnalysisResult extends AnalysisResult {
  cleaningReport?: CleaningReport;
  columnStats?: Record<string, any>;
  cleaningNotes?: string[];
}

export const useDatasetAnalysis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [insights, setInsights] = useState<ExtendedAnalysisResult | null>(null);

  const analyzeDataset = useCallback(async (
    data: string[][],
    persona: PersonaType,
    customPersona?: CustomPersonaData
  ): Promise<ExtendedAnalysisResult | null> => {
    setIsAnalyzing(true);
    
    try {
      const request: any = { data, persona };
      
      if (persona === 'custom' && customPersona) {
        request.customPersona = customPersona;
      }

      const result = await callAnalyzeAPI(request);

      if (!result) {
        toast.error("Analysis failed. Please try again.");
        return null;
      }

      // Transform API result to match the expected types
      const transformedResult: ExtendedAnalysisResult = {
        dataSummary: result.dataSummary,
        patterns: result.patterns,
        insights: result.insights,
        dashboardViews: result.dashboardViews,
        warning: result.warning,
        cleaningReport: result.cleaningReport,
        columnStats: result.columnStats,
        cleaningNotes: result.cleaningNotes,
      };

      setInsights(transformedResult);
      
      // Show cleaning stats in toast
      if (result?.cleaningReport) {
        const report = result.cleaningReport;
        const cleaningMessage = `Data cleaned: ${report.cleanedRows} rows processed, ${report.duplicatesRemoved} duplicates removed, ${report.nullsHandled} null values handled`;
        toast.success(cleaningMessage);
      } else {
        toast.success("Analysis complete!");
      }
      
      return transformedResult;
    } catch (error) {
      console.error("Analysis error:", error);
      
      if (error instanceof Error) {
        if (error.message.includes('Rate limit') || error.message.includes('429')) {
          toast.error("Rate limit reached. Please wait a moment and try again.");
        } else if (error.message.includes('API key') || error.message.includes('401')) {
          toast.error("Invalid API key. Please check your configuration.");
        } else {
          toast.error(error.message || "Failed to analyze dataset. Please try again.");
        }
      } else {
        toast.error("Failed to analyze dataset. Please try again.");
      }
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const clearInsights = useCallback(() => {
    setInsights(null);
  }, []);

  return {
    isAnalyzing,
    insights,
    analyzeDataset,
    clearInsights,
    setInsights,
  };
};
