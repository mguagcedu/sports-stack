import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SportLayoutTemplate } from './types';

interface TemplateSelectorProps {
  templates: SportLayoutTemplate[];
  selectedTemplateId: string | null;
  onSelect: (templateId: string) => void;
  className?: string;
}

export function TemplateSelector({
  templates,
  selectedTemplateId,
  onSelect,
  className,
}: TemplateSelectorProps) {
  // Group templates by side
  const offenseTemplates = templates.filter(t => t.side === 'offense');
  const defenseTemplates = templates.filter(t => t.side === 'defense');
  const specialTeamsTemplates = templates.filter(t => t.side === 'special_teams');
  const otherTemplates = templates.filter(t => !t.side || t.side === 'none');

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className="text-sm font-medium text-muted-foreground">Layout:</span>
      
      <Select
        value={selectedTemplateId || ''}
        onValueChange={onSelect}
      >
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Select layout" />
        </SelectTrigger>
        <SelectContent>
          {offenseTemplates.length > 0 && (
            <>
              <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">
                Offense
              </div>
              {offenseTemplates.map(t => (
                <SelectItem key={t.id} value={t.id}>
                  {t.displayName}
                </SelectItem>
              ))}
            </>
          )}
          
          {defenseTemplates.length > 0 && (
            <>
              <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">
                Defense
              </div>
              {defenseTemplates.map(t => (
                <SelectItem key={t.id} value={t.id}>
                  {t.displayName}
                </SelectItem>
              ))}
            </>
          )}
          
          {specialTeamsTemplates.length > 0 && (
            <>
              <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">
                Special Teams
              </div>
              {specialTeamsTemplates.map(t => (
                <SelectItem key={t.id} value={t.id}>
                  {t.displayName}
                </SelectItem>
              ))}
            </>
          )}
          
          {otherTemplates.length > 0 && (
            <>
              {(offenseTemplates.length > 0 || defenseTemplates.length > 0) && (
                <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">
                  Other
                </div>
              )}
              {otherTemplates.map(t => (
                <SelectItem key={t.id} value={t.id}>
                  {t.displayName}
                </SelectItem>
              ))}
            </>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
