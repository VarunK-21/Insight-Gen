import { CheckCircle, AlertTriangle, Trash2, Hash, Type, Calendar, ToggleLeft, HelpCircle, TrendingUp, Sparkles } from "lucide-react";
import { Progress } from "@/components/ui/progress";

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

interface CleaningReportTabProps {
  cleaningReport: CleaningReport;
  columnStats?: Record<string, any>;
  cleaningNotes?: string[];
}

const TypeIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'numeric': return <Hash className="w-4 h-4 text-primary" />;
    case 'date': return <Calendar className="w-4 h-4 text-accent" />;
    case 'boolean': return <ToggleLeft className="w-4 h-4 text-persona-engineer" />;
    case 'mixed': return <HelpCircle className="w-4 h-4 text-persona-common" />;
    default: return <Type className="w-4 h-4 text-muted-foreground" />;
  }
};

const getTypeLabel = (type: string): string => {
  switch (type) {
    case 'numeric': return 'Numeric';
    case 'date': return 'Date';
    case 'boolean': return 'Boolean';
    case 'mixed': return 'Mixed';
    case 'text': return 'Text';
    default: return type.charAt(0).toUpperCase() + type.slice(1);
  }
};

export const CleaningReportTab = ({ cleaningReport, columnStats, cleaningNotes }: CleaningReportTabProps) => {
  const retentionRate = Math.round((cleaningReport.cleanedRows / cleaningReport.totalRows) * 100);
  const completenessScore = 100 - Math.round((cleaningReport.nullsHandled / Math.max(1, cleaningReport.totalRows * cleaningReport.columnsAnalyzed.length)) * 100);

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard 
          icon={<CheckCircle className="w-5 h-5" />}
          label="Data Retention"
          value={`${retentionRate}%`}
          subtext={`${cleaningReport.cleanedRows.toLocaleString()} of ${cleaningReport.totalRows.toLocaleString()} rows`}
          color="primary"
          progress={retentionRate}
        />
        <StatCard 
          icon={<Trash2 className="w-5 h-5" />}
          label="Duplicates Removed"
          value={cleaningReport.duplicatesRemoved.toLocaleString()}
          subtext="Exact row matches"
          color="accent"
        />
        <StatCard 
          icon={<AlertTriangle className="w-5 h-5" />}
          label="Outliers Flagged"
          value={cleaningReport.outliersFlagged.toLocaleString()}
          subtext="Statistical anomalies"
          color="persona-common"
        />
        <StatCard 
          icon={<TrendingUp className="w-5 h-5" />}
          label="Completeness Score"
          value={`${Math.max(0, completenessScore)}%`}
          subtext="Non-null values"
          color="persona-accountant"
          progress={Math.max(0, completenessScore)}
        />
      </div>

      {/* Cleaning Notes */}
      {cleaningNotes && cleaningNotes.length > 0 && (
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-lg text-foreground">Data Quality Notes</h3>
              <p className="text-xs text-muted-foreground">AI-generated observations about data quality</p>
            </div>
          </div>
          <ul className="space-y-2">
            {cleaningNotes.map((note, idx) => (
              <li key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/40 border border-border/50">
                <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-sm text-foreground">{note}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Cleaning Operations and Column Analysis */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Cleaning Operations */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-lg text-foreground">Cleaning Operations</h3>
              <p className="text-xs text-muted-foreground">Automated data preprocessing steps</p>
            </div>
          </div>
          <div className="space-y-5">
            <CleaningOperation 
              label="Empty/Invalid Rows Removed"
              value={cleaningReport.removedRows}
              total={cleaningReport.totalRows}
              color="destructive"
            />
            <CleaningOperation 
              label="Duplicate Records Removed"
              value={cleaningReport.duplicatesRemoved}
              total={cleaningReport.totalRows}
              color="accent"
            />
            <CleaningOperation 
              label="Null Values Handled"
              value={cleaningReport.nullsHandled}
              total={cleaningReport.totalRows * cleaningReport.columnsAnalyzed.length}
              color="persona-common"
            />
            <CleaningOperation 
              label="Data Type Corrections"
              value={cleaningReport.dataTypeCorrections}
              total={cleaningReport.totalRows * cleaningReport.columnsAnalyzed.length}
              color="primary"
            />
          </div>
        </div>

        {/* Column Analysis */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Hash className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-lg text-foreground">Column Analysis</h3>
              <p className="text-xs text-muted-foreground">{cleaningReport.columnsAnalyzed.length} columns analyzed</p>
            </div>
          </div>
          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-2 custom-scrollbar">
            {cleaningReport.columnsAnalyzed.map((col, idx) => (
              <div 
                key={idx}
                className="p-4 rounded-xl bg-secondary/40 border border-border/50 hover:border-primary/30 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-card flex items-center justify-center">
                      <TypeIcon type={col.type} />
                    </div>
                    <span className="font-medium text-foreground">{col.name}</span>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium">
                    {getTypeLabel(col.type)}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-2 rounded-lg bg-card/50">
                    <span className="text-muted-foreground">Unique Values</span>
                    <p className="text-foreground font-semibold">{col.uniqueCount.toLocaleString()}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-card/50">
                    <span className="text-muted-foreground">Null Count</span>
                    <p className={`font-semibold ${col.nullCount > 0 ? 'text-persona-common' : 'text-primary'}`}>
                      {col.nullCount.toLocaleString()}
                    </p>
                  </div>
                </div>

                {columnStats?.[col.name]?.stats && col.type === 'numeric' && (
                  <div className="mt-3 pt-3 border-t border-border/50">
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="text-center p-2 rounded bg-card/50">
                        <span className="text-muted-foreground block">Min</span>
                        <span className="text-foreground font-medium">{columnStats[col.name].stats.min?.toLocaleString() ?? '-'}</span>
                      </div>
                      <div className="text-center p-2 rounded bg-card/50">
                        <span className="text-muted-foreground block">Max</span>
                        <span className="text-foreground font-medium">{columnStats[col.name].stats.max?.toLocaleString() ?? '-'}</span>
                      </div>
                      <div className="text-center p-2 rounded bg-card/50">
                        <span className="text-muted-foreground block">Mean</span>
                        <span className="text-foreground font-medium">{columnStats[col.name].stats.mean?.toLocaleString() ?? '-'}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, subtext, color, progress }: { 
  icon: React.ReactNode; 
  label: string; 
  value: string;
  subtext: string;
  color: string;
  progress?: number;
}) => (
  <div className="glass-card rounded-xl p-4">
    <div className="flex items-center gap-3 mb-3">
      <div className={`w-10 h-10 rounded-lg bg-${color}/20 flex items-center justify-center text-${color}`}>
        {icon}
      </div>
      <p className="text-2xl font-display font-bold text-foreground">{value}</p>
    </div>
    {progress !== undefined && (
      <Progress value={progress} className="h-2 mb-2" />
    )}
    <p className="text-sm font-medium text-foreground">{label}</p>
    <p className="text-xs text-muted-foreground">{subtext}</p>
  </div>
);

const CleaningOperation = ({ label, value, total, color }: { label: string; value: number; total: number; color: string }) => {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
  // Cap at 100% for display but use actual value for bar width
  const displayPercentage = Math.min(percentage, 100);
  // Scale bar: if percentage is very small show at least a visible portion
  const barWidth = value > 0 ? Math.max(displayPercentage, 3) : 0;
  
  // Color mapping for Tailwind classes
  const colorClasses: Record<string, string> = {
    destructive: 'bg-red-500',
    accent: 'bg-accent',
    'persona-common': 'bg-persona-common',
    primary: 'bg-primary',
  };
  
  return (
    <div className="p-4 rounded-xl bg-secondary/40 border border-border/50">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <div className="text-right flex items-center gap-2">
          <span className="text-lg font-bold text-foreground">{value.toLocaleString()}</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
            {displayPercentage}%
          </span>
        </div>
      </div>
      {/* Progress bar container */}
      <div className="relative h-3 rounded-full bg-card overflow-hidden border border-border/30">
        <div 
          className={`absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out ${colorClasses[color] || 'bg-primary'}`}
          style={{ width: `${barWidth}%` }}
        />
        {/* Tick marks for scale reference */}
        <div className="absolute inset-0 flex justify-between px-1 items-center pointer-events-none">
          <span className="w-px h-1.5 bg-border/50" />
          <span className="w-px h-1.5 bg-border/50" />
          <span className="w-px h-1.5 bg-border/50" />
          <span className="w-px h-1.5 bg-border/50" />
          <span className="w-px h-1.5 bg-border/50" />
        </div>
      </div>
      {/* Scale labels */}
      <div className="flex justify-between mt-1 text-[10px] text-muted-foreground/60">
        <span>0</span>
        <span>25%</span>
        <span>50%</span>
        <span>75%</span>
        <span>100%</span>
      </div>
    </div>
  );
};