import { useState, useCallback } from "react";
import { Upload, FileSpreadsheet, X, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import * as XLSX from "xlsx";

interface FileUploadProps {
  onFileSelect: (file: File, data: string[][]) => void;
  onSampleSelect?: (name: string, data: string[][]) => void;
  selectedFile: File | null;
  onClear: () => void;
}

const SAMPLE_DATASET: string[][] = [
  ["Month", "Region", "Revenue", "Customers", "AdSpend"],
  ["Jan", "North", "120000", "310", "18000"],
  ["Jan", "South", "95000", "260", "15000"],
  ["Jan", "East", "140000", "350", "22000"],
  ["Feb", "North", "126000", "320", "18500"],
  ["Feb", "South", "98000", "270", "15200"],
  ["Feb", "East", "147000", "360", "23000"],
  ["Mar", "North", "131000", "333", "19200"],
  ["Mar", "South", "102000", "279", "15900"],
  ["Mar", "East", "151000", "374", "23500"],
];

export const FileUpload = ({ onFileSelect, onSampleSelect, selectedFile, onClear }: FileUploadProps) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const parseCSV = (text: string): string[][] => {
    const lines = text.split('\n').filter(line => line.trim());
    return lines.map(line => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    });
  };

  const handleFile = useCallback(async (file: File) => {
    setIsProcessing(true);
    try {
      let data: string[][] = [];
      if (file.name.toLowerCase().endsWith(".xlsx") || file.name.toLowerCase().endsWith(".xls")) {
        const buffer = await file.arrayBuffer();
        const wb = XLSX.read(buffer, { type: "array" });
        const firstSheet = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<(string | number | null)[]>(firstSheet, {
          header: 1,
          blankrows: false,
        });
        data = rows
          .filter((row) => Array.isArray(row) && row.some((cell) => String(cell ?? "").trim() !== ""))
          .map((row) => row.map((cell) => String(cell ?? "").trim()));
      } else {
        const text = await file.text();
        data = parseCSV(text);
      }
      onFileSelect(file, data);
    } catch (error) {
      console.error("Error parsing file:", error);
    } finally {
      setIsProcessing(false);
    }
  }, [onFileSelect]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.csv') || file.name.endsWith('.xlsx'))) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  if (selectedFile) {
    return (
      <div className="glass-card rounded-2xl p-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <FileSpreadsheet className="w-6 h-6 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-semibold text-foreground">{selectedFile.name}</span>
                <CheckCircle2 className="w-4 h-4 text-primary" />
              </div>
              <span className="text-sm text-muted-foreground">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClear}
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`upload-zone cursor-pointer ${isDragActive ? 'active' : ''}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => document.getElementById('file-input')?.click()}
    >
      <input
        id="file-input"
        type="file"
        accept=".csv,.xlsx"
        onChange={handleInputChange}
        className="hidden"
      />
      
      <div className="flex flex-col items-center gap-4">
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 ${
          isDragActive ? 'bg-primary/30 scale-110' : 'bg-secondary'
        }`}>
          {isProcessing ? (
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          ) : (
            <Upload className={`w-8 h-8 transition-colors ${isDragActive ? 'text-primary' : 'text-muted-foreground'}`} />
          )}
        </div>
        
        <div className="text-center">
          <p className="font-display font-semibold text-lg text-foreground">
            {isDragActive ? 'Drop your file here' : 'Upload your dataset'}
          </p>
          <p className="text-muted-foreground mt-1">
            Drag and drop a CSV or Excel file, or click to browse
          </p>
        </div>
        
        <div className="flex gap-2 mt-2">
          <span className="px-3 py-1 rounded-full bg-secondary text-xs font-medium text-muted-foreground">.csv</span>
          <span className="px-3 py-1 rounded-full bg-secondary text-xs font-medium text-muted-foreground">.xlsx</span>
        </div>
        {onSampleSelect && (
          <Button
            type="button"
            variant="outline"
            onClick={(event) => {
              event.stopPropagation();
              onSampleSelect("sample-sales.csv", SAMPLE_DATASET);
            }}
          >
            Use Sample Dataset
          </Button>
        )}
      </div>
    </div>
  );
};
