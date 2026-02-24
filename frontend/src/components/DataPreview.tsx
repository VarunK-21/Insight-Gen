import { Table, Hash, Calendar, Type, AlertCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DataPreviewProps {
  data: string[][];
  fileName: string;
}

interface ColumnInfo {
  name: string;
  type: 'numeric' | 'text' | 'date' | 'mixed';
  nullCount: number;
  uniqueCount: number;
}

const detectColumnType = (values: string[]): 'numeric' | 'text' | 'date' | 'mixed' => {
  const nonEmpty = values.filter(v => v.trim() !== '');
  if (nonEmpty.length === 0) return 'text';
  
  const numericCount = nonEmpty.filter(v => !isNaN(parseFloat(v)) && isFinite(Number(v))).length;
  const datePattern = /^\d{1,4}[-/]\d{1,2}[-/]\d{1,4}$/;
  const dateCount = nonEmpty.filter(v => datePattern.test(v)).length;
  
  if (numericCount === nonEmpty.length) return 'numeric';
  if (dateCount > nonEmpty.length * 0.5) return 'date';
  if (numericCount > nonEmpty.length * 0.5) return 'mixed';
  return 'text';
};

const TypeIcon = ({ type }: { type: ColumnInfo['type'] }) => {
  switch (type) {
    case 'numeric': return <Hash className="w-3.5 h-3.5 text-primary" />;
    case 'date': return <Calendar className="w-3.5 h-3.5 text-accent" />;
    case 'text': return <Type className="w-3.5 h-3.5 text-muted-foreground" />;
    default: return <AlertCircle className="w-3.5 h-3.5 text-persona-common" />;
  }
};

export const DataPreview = ({ data, fileName }: DataPreviewProps) => {
  if (data.length < 2) return null;
  
  const headers = data[0];
  const rows = data.slice(1);
  const previewRows = rows.slice(0, 5);
  
  const columnInfo: ColumnInfo[] = headers.map((header, idx) => {
    const values = rows.map(row => row[idx] || '');
    const nonEmpty = values.filter(v => v.trim() !== '');
    const unique = new Set(nonEmpty);
    
    return {
      name: header,
      type: detectColumnType(values),
      nullCount: values.length - nonEmpty.length,
      uniqueCount: unique.size,
    };
  });
  
  const numericCols = columnInfo.filter(c => c.type === 'numeric').length;
  const textCols = columnInfo.filter(c => c.type === 'text').length;
  const dateCols = columnInfo.filter(c => c.type === 'date').length;
  const totalNulls = columnInfo.reduce((sum, c) => sum + c.nullCount, 0);

  return (
    <div className="glass-card rounded-2xl overflow-hidden animate-slide-up">
      {/* Header */}
      <div className="p-5 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Table className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-foreground">Data Summary</h3>
              <p className="text-sm text-muted-foreground">
                {rows.length.toLocaleString()} rows × {headers.length} columns
              </p>
            </div>
          </div>
          
          <div className="flex gap-4">
            <div className="text-center">
              <div className="text-lg font-display font-bold text-primary">{numericCols}</div>
              <div className="text-xs text-muted-foreground">Numeric</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-display font-bold text-muted-foreground">{textCols}</div>
              <div className="text-xs text-muted-foreground">Text</div>
            </div>
            {dateCols > 0 && (
              <div className="text-center">
                <div className="text-lg font-display font-bold text-accent">{dateCols}</div>
                <div className="text-xs text-muted-foreground">Date</div>
              </div>
            )}
            {totalNulls > 0 && (
              <div className="text-center">
                <div className="text-lg font-display font-bold text-persona-common">{totalNulls}</div>
                <div className="text-xs text-muted-foreground">Missing</div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Column chips */}
      <div className="p-4 border-b border-border bg-secondary/30">
        <div className="flex flex-wrap gap-2">
          {columnInfo.map((col, idx) => (
            <div
              key={idx}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card border border-border"
            >
              <TypeIcon type={col.type} />
              <span className="text-xs font-medium text-foreground">{col.name}</span>
              {col.nullCount > 0 && (
                <span className="text-[10px] text-persona-common">
                  ({col.nullCount} null)
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Table preview */}
      <ScrollArea className="h-48">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 sticky top-0">
              <tr>
                {headers.map((header, idx) => (
                  <th
                    key={idx}
                    className="px-4 py-2 text-left font-medium text-muted-foreground whitespace-nowrap"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {previewRows.map((row, rowIdx) => (
                <tr key={rowIdx} className="border-t border-border/50">
                  {row.map((cell, cellIdx) => (
                    <td
                      key={cellIdx}
                      className="px-4 py-2 text-foreground whitespace-nowrap max-w-[200px] truncate"
                    >
                      {cell || <span className="text-muted-foreground italic">null</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ScrollArea>
      
      {rows.length > 5 && (
        <div className="px-4 py-2 text-center text-xs text-muted-foreground bg-secondary/30 border-t border-border">
          Showing first 5 of {rows.length.toLocaleString()} rows
        </div>
      )}
    </div>
  );
};
