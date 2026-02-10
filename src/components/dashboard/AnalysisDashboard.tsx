import { useState } from "react";
import { PersonaType, CustomPersonaData } from "@/components/PersonaSelector";
import { AnalysisResult } from "@/components/InsightsPanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutDashboard, Table2, TrendingUp, Lightbulb, BarChart3, Sparkles } from "lucide-react";
import { OverviewTab } from "./tabs/OverviewTab";
import { DataTab } from "./tabs/DataTab";
import { PatternsTab } from "./tabs/PatternsTab";
import { InsightsTab } from "./tabs/InsightsTab";
import { ChartsTab } from "./tabs/ChartsTab";
import { CleaningReportTab } from "./tabs/CleaningReportTab";

interface CleaningReport {
  totalRows: number;
  cleanedRows: number;
  removedRows: number;
  nullsHandled: number;
  duplicatesRemoved: number;
  dataTypeCorrections: number;
  outliersFlagged: number;
  columnsAnalyzed: { name: string; type: string; nullCount: number; uniqueCount: number }[];
}

interface ExtendedAnalysisResult extends AnalysisResult {
  cleaningReport?: CleaningReport;
  columnStats?: Record<string, any>;
  cleaningNotes?: string[];
}

interface AnalysisDashboardProps {
  insights: ExtendedAnalysisResult;
  persona: PersonaType;
  data: string[][];
  fileName: string;
  customPersona?: CustomPersonaData;
}

const personaNames: Record<PersonaType, string> = {
  common: 'Common Citizen',
  accountant: 'Chartered Accountant',
  engineer: 'Systems Engineer',
  policy: 'Policy Strategist',
  lawyer: 'Legal Advisor',
  business: 'Business Analyst',
  data_scientist: 'Data Scientist',
  product_manager: 'Product Manager',
  custom: 'Custom Persona',
};

const personaColors: Record<PersonaType, string> = {
  common: 'bg-persona-common',
  accountant: 'bg-persona-accountant',
  engineer: 'bg-persona-engineer',
  policy: 'bg-persona-policy',
  lawyer: 'bg-accent',
  business: 'bg-primary',
  data_scientist: 'bg-persona-engineer',
  product_manager: 'bg-persona-policy',
  custom: 'bg-accent',
};

export const AnalysisDashboard = ({ insights, persona, data, fileName, customPersona }: AnalysisDashboardProps) => {
  const [activeTab, setActiveTab] = useState("overview");
  
  const headers = data[0];
  const rows = data.slice(1);
  
  const displayPersonaName = persona === 'custom' && customPersona?.name 
    ? customPersona.name 
    : personaNames[persona];

  return (
    <div className="min-h-screen bg-background">
      {/* Dashboard Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-16 z-40">
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center">
                <LayoutDashboard className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-display text-2xl font-bold text-foreground">
                  Analysis Dashboard
                </h1>
                <p className="text-sm text-muted-foreground">
                  {fileName} • {rows.length.toLocaleString()} records • {headers.length} fields
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {insights.cleaningReport && (
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/30">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-xs text-primary font-medium">
                    {insights.cleaningReport.cleanedRows} rows cleaned
                  </span>
                </div>
              )}
              <div className={`px-4 py-2 rounded-full ${personaColors[persona]} text-white font-medium text-sm`}>
                {displayPersonaName}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Tabs */}
      <div className="max-w-[1600px] mx-auto px-6 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-card/50 border border-border p-1 h-auto flex-wrap gap-1">
            <TabsTrigger 
              value="overview" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2 px-4 py-2"
            >
              <LayoutDashboard className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="data" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2 px-4 py-2"
            >
              <Table2 className="w-4 h-4" />
              Data View
            </TabsTrigger>
            <TabsTrigger 
              value="charts" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2 px-4 py-2"
            >
              <BarChart3 className="w-4 h-4" />
              Visualizations
            </TabsTrigger>
            <TabsTrigger 
              value="patterns" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2 px-4 py-2"
            >
              <TrendingUp className="w-4 h-4" />
              Patterns
            </TabsTrigger>
            <TabsTrigger 
              value="insights" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2 px-4 py-2"
            >
              <Lightbulb className="w-4 h-4" />
              Insights
            </TabsTrigger>
            {insights.cleaningReport && (
              <TabsTrigger 
                value="cleaning" 
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2 px-4 py-2"
              >
                <Sparkles className="w-4 h-4" />
                Data Quality
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <OverviewTab insights={insights} persona={persona} data={data} customPersona={customPersona} />
          </TabsContent>

          <TabsContent value="data" className="mt-6">
            <DataTab data={data} />
          </TabsContent>

          <TabsContent value="charts" className="mt-6">
            <ChartsTab data={data} dashboardViews={insights.dashboardViews} />
          </TabsContent>

          <TabsContent value="patterns" className="mt-6">
            <PatternsTab patterns={insights.patterns} dataSummary={insights.dataSummary} />
          </TabsContent>

          <TabsContent value="insights" className="mt-6">
            <InsightsTab 
              insights={insights.insights} 
              persona={persona} 
              warning={insights.warning}
              customPersona={customPersona}
            />
          </TabsContent>

          {insights.cleaningReport && (
            <TabsContent value="cleaning" className="mt-6">
              <CleaningReportTab 
                cleaningReport={insights.cleaningReport} 
                columnStats={insights.columnStats}
                cleaningNotes={insights.cleaningNotes}
              />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};
