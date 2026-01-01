import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Plus, Edit2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface LineGroup {
  id: string;
  lineKey: string;
  displayName: string;
  isDefault?: boolean;
}

interface LineGroupSelectorProps {
  lineGroups: LineGroup[];
  selectedLineGroupId: string | null;
  onSelect: (lineGroupId: string | null) => void;
  onAddNew?: () => void;
  onEdit?: (lineGroupId: string) => void;
  className?: string;
}

export function LineGroupSelector({
  lineGroups,
  selectedLineGroupId,
  onSelect,
  onAddNew,
  onEdit,
  className,
}: LineGroupSelectorProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className="text-sm font-medium text-muted-foreground">Line Group:</span>
      
      <Select
        value={selectedLineGroupId || 'all'}
        onValueChange={v => onSelect(v === 'all' ? null : v)}
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="All Lines" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Lines</SelectItem>
          {lineGroups.map(lg => (
            <SelectItem key={lg.id} value={lg.id}>
              {lg.displayName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedLineGroupId && onEdit && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onEdit(selectedLineGroupId)}
        >
          <Edit2 className="h-4 w-4" />
        </Button>
      )}

      {onAddNew && (
        <Button
          variant="outline"
          size="sm"
          onClick={onAddNew}
          className="ml-2"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Line
        </Button>
      )}
    </div>
  );
}
