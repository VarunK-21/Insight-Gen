import { useState, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ChevronLeft, ChevronRight, Hash, Type, Calendar, Download } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface DataTabProps {
  data: string[][];
}

const detectColumnType = (values: string[]): 'numeric' | 'text' | 'date' => {
  const nonEmpty = values.filter(v => v && v.trim() !== '');
  if (nonEmpty.length === 0) return 'text';
  
  const numericCount = nonEmpty.filter(v => !isNaN(parseFloat(v)) && isFinite(Number(v))).length;
  const datePattern = /^\d{1,4}[-/]\d{1,2}[-/]\d{1,4}$/;
  const dateCount = nonEmpty.filter(v => datePattern.test(v)).length;
  
  if (numericCount === nonEmpty.length) return 'numeric';
  if (dateCount > nonEmpty.length * 0.5) return 'date';
  return 'text';
};

const TypeIcon = ({ type }: { type: 'numeric' | 'text' | 'date' }) => {
  switch (type) {
    case 'numeric': return <Hash className="w-3 h-3 text-primary" />;
    case 'date': return <Calendar className="w-3 h-3 text-accent" />;
    default: return <Type className="w-3 h-3 text-muted-foreground" />;
  }
};

const ROWS_PER_PAGE = 25;

export const DataTab = ({ data }: DataTabProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<number | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const headers = data[0];
  const allRows = data.slice(1);

  const columnTypes = useMemo(() => 
    headers.map((_, idx) => detectColumnType(allRows.map(row => row[idx] || ''))),
    [headers, allRows]
  );

  const filteredRows = useMemo(() => {
    let rows = allRows;
    
    if (searchTerm) {
      rows = rows.filter(row => 
        row.some(cell => cell?.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    if (sortColumn !== null) {
      rows = [...rows].sort((a, b) => {
        const aVal = a[sortColumn] || '';
        const bVal = b[sortColumn] || '';
        
        if (columnTypes[sortColumn] === 'numeric') {
          const aNum = parseFloat(aVal) || 0;
          const bNum = parseFloat(bVal) || 0;
          return sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
        }
        
        return sortDirection === 'asc' 
          ? aVal.localeCompare(bVal) 
          : bVal.localeCompare(aVal);
      });
    }
    
    return rows;
  }, [allRows, searchTerm, sortColumn, sortDirection, columnTypes]);

  const totalPages = Math.ceil(filteredRows.length / ROWS_PER_PAGE);
  const paginatedRows = filteredRows.slice(
    (currentPage - 1) * ROWS_PER_PAGE,
    currentPage * ROWS_PER_PAGE
  );

  const handleSort = (columnIdx: number) => {
    if (sortColumn === columnIdx) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnIdx);
      setSortDirection('asc');
    }
  };

  const handleExportCSV = () => {
    const csvContent = [
      headers.join(','),
      ...filteredRows.map(row => row.map(cell => `"${cell || ''}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cleaned_data.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="glass-card rounded-xl p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search across all columns..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10 bg-background border-border"
            />
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {filteredRows.length.toLocaleString()} records
            </span>
            <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-2">
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <ScrollArea className="h-[600px]">
          <div className="min-w-max">
            <Table>
              <TableHeader className="sticky top-0 bg-card z-10">
                <TableRow className="border-b border-border hover:bg-transparent">
                  <TableHead className="w-16 text-center font-medium text-muted-foreground">#</TableHead>
                  {headers.map((header, idx) => (
                    <TableHead 
                      key={idx}
                      onClick={() => handleSort(idx)}
                      className="cursor-pointer hover:bg-secondary/50 transition-colors min-w-[150px]"
                    >
                      <div className="flex items-center gap-2">
                        <TypeIcon type={columnTypes[idx]} />
                        <span className="font-medium text-foreground">{header}</span>
                        {sortColumn === idx && (
                          <span className="text-primary text-xs">
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedRows.map((row, rowIdx) => (
                  <TableRow 
                    key={rowIdx} 
                    className="border-b border-border/50 hover:bg-secondary/30"
                  >
                    <TableCell className="text-center text-muted-foreground text-sm">
                      {(currentPage - 1) * ROWS_PER_PAGE + rowIdx + 1}
                    </TableCell>
                    {row.map((cell, cellIdx) => (
                      <TableCell 
                        key={cellIdx}
                        className={`text-sm ${
                          columnTypes[cellIdx] === 'numeric' 
                            ? 'font-mono text-right text-foreground' 
                            : 'text-foreground'
                        }`}
                      >
                        {cell || <span className="text-muted-foreground italic">null</span>}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="border-t border-border px-4 py-3 flex items-center justify-between bg-card/50">
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
