import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from '@/components/ui/pagination';
import { History, CheckCircle2, XCircle, Clock, Ban, Loader2, Eye, AlertCircle, FileSpreadsheet } from 'lucide-react';
import { format } from 'date-fns';

interface ImportHistoryRecord {
  id: string;
  file_name: string;
  file_size_bytes: number | null;
  status: string;
  import_type: string;
  rows_inserted: number | null;
  rows_skipped: number | null;
  total_rows: number | null;
  districts_processed: number | null;
  duration_seconds: number | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
  format: string | null;
  status_breakdown: Record<string, number> | null;
  state_breakdown: Record<string, number> | null;
}

interface ImportHistoryTableProps {
  refreshTrigger?: number;
}

const PAGE_SIZE = 10;

export function ImportHistoryTable({ refreshTrigger }: ImportHistoryTableProps) {
  const [history, setHistory] = useState<ImportHistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<ImportHistoryRecord | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, [refreshTrigger, currentPage, showAll]);

  const fetchHistory = async () => {
    setLoading(true);
    
    // Get total count
    const { count } = await supabase
      .from('import_history')
      .select('*', { count: 'exact', head: true });
    
    setTotalCount(count || 0);
    
    // Fetch records
    let query = supabase
      .from('import_history')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!showAll) {
      const from = (currentPage - 1) * PAGE_SIZE;
      query = query.range(from, from + PAGE_SIZE - 1);
    }
    
    const { data, error } = await query;
    
    if (!error && data) {
      setHistory(data as ImportHistoryRecord[]);
    }
    setLoading(false);
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-500"><CheckCircle2 className="h-3 w-3 mr-1" />Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      case 'cancelled':
        return <Badge variant="secondary"><Ban className="h-3 w-3 mr-1" />Cancelled</Badge>;
      case 'in_progress':
        return <Badge variant="outline"><Loader2 className="h-3 w-3 mr-1 animate-spin" />In Progress</Badge>;
      default:
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (seconds === null) return '-';
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  };

  const formatBytes = (bytes: number | null): string => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const openDetails = (record: ImportHistoryRecord) => {
    setSelectedRecord(record);
    setDetailsOpen(true);
  };

  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('ellipsis');
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push('ellipsis');
      pages.push(totalPages);
    }
    return pages;
  };

  if (loading && history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <History className="h-5 w-5" />
            Import History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <History className="h-5 w-5" />
            Import History
          </CardTitle>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {totalCount} total import{totalCount !== 1 ? 's' : ''}
            </span>
            {totalCount > PAGE_SIZE && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  setShowAll(!showAll);
                  setCurrentPage(1);
                }}
              >
                {showAll ? 'Show Less' : 'View All'}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No import history yet.</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>File</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Records</TableHead>
                    <TableHead className="text-right">Duration</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="text-sm">
                        {format(new Date(record.created_at), 'MMM d, h:mm a')}
                      </TableCell>
                      <TableCell className="font-medium text-sm max-w-[200px] truncate" title={record.file_name}>
                        {record.file_name}
                      </TableCell>
                      <TableCell>{getStatusBadge(record.status)}</TableCell>
                      <TableCell className="text-right text-sm">
                        {record.rows_inserted !== null ? record.rows_inserted.toLocaleString() : '-'}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {formatDuration(record.duration_seconds)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDetails(record)}
                          title="View details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {!showAll && totalPages > 1 && (
                <div className="mt-4 flex flex-col items-center gap-2">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                      
                      {getPageNumbers().map((page, idx) => (
                        <PaginationItem key={idx}>
                          {page === 'ellipsis' ? (
                            <PaginationEllipsis />
                          ) : (
                            <PaginationLink
                              onClick={() => setCurrentPage(page)}
                              isActive={currentPage === page}
                              className="cursor-pointer"
                            >
                              {page}
                            </PaginationLink>
                          )}
                        </PaginationItem>
                      ))}
                      
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                  <p className="text-sm text-muted-foreground">
                    Showing {((currentPage - 1) * PAGE_SIZE) + 1}-{Math.min(currentPage * PAGE_SIZE, totalCount)} of {totalCount}
                  </p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Details Modal */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Import Details
            </DialogTitle>
            <DialogDescription className="truncate">
              {selectedRecord?.file_name}
            </DialogDescription>
          </DialogHeader>

          {selectedRecord && (
            <div className="space-y-6">
              {/* Summary Grid */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <p className="text-muted-foreground">Status</p>
                  <div>{getStatusBadge(selectedRecord.status)}</div>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">Format</p>
                  <p className="font-medium">{selectedRecord.format || '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">Total Rows</p>
                  <p className="font-medium">{selectedRecord.total_rows?.toLocaleString() || '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">Rows Inserted</p>
                  <p className="font-medium">{selectedRecord.rows_inserted?.toLocaleString() || '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">Rows Skipped</p>
                  <p className="font-medium">{selectedRecord.rows_skipped?.toLocaleString() || '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">Districts Created</p>
                  <p className="font-medium">{selectedRecord.districts_processed?.toLocaleString() || '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">Duration</p>
                  <p className="font-medium">{formatDuration(selectedRecord.duration_seconds)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">File Size</p>
                  <p className="font-medium">{formatBytes(selectedRecord.file_size_bytes)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">Started</p>
                  <p className="font-medium">
                    {selectedRecord.started_at 
                      ? format(new Date(selectedRecord.started_at), 'MMM d, yyyy h:mm:ss a')
                      : '-'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">Completed</p>
                  <p className="font-medium">
                    {selectedRecord.completed_at 
                      ? format(new Date(selectedRecord.completed_at), 'MMM d, yyyy h:mm:ss a')
                      : '-'}
                  </p>
                </div>
              </div>

              {/* State Breakdown */}
              {selectedRecord.state_breakdown && Object.keys(selectedRecord.state_breakdown).length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm">Schools by State</h4>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 text-sm">
                    {Object.entries(selectedRecord.state_breakdown)
                      .sort((a, b) => b[1] - a[1])
                      .map(([state, count]) => (
                        <div key={state} className="flex justify-between bg-muted px-2 py-1 rounded">
                          <span className="font-medium">{state}</span>
                          <span className="text-muted-foreground">{count.toLocaleString()}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Status Breakdown */}
              {selectedRecord.status_breakdown && Object.keys(selectedRecord.status_breakdown).length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm">Schools by Operational Status</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {Object.entries(selectedRecord.status_breakdown)
                      .sort((a, b) => b[1] - a[1])
                      .map(([status, count]) => (
                        <div key={status} className="flex justify-between bg-muted px-3 py-2 rounded">
                          <span className="font-medium">{status}</span>
                          <span className="text-muted-foreground">{count.toLocaleString()}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Error Message */}
              {selectedRecord.error_message && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription className="whitespace-pre-wrap">
                    {selectedRecord.error_message}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
