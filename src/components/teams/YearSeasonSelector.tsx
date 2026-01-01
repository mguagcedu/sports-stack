import { useState, useMemo } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Calendar, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  SportSeasonType,
  SEASON_LABELS,
  getCurrentSeason,
  getCurrentSchoolYear,
  getSeasonYearLabel,
  getAvailableSchoolYears,
  getYearStatus,
} from '@/lib/seasonUtils';

interface YearSeasonSelectorProps {
  season: SportSeasonType;
  schoolYear: number;
  customSeasonLabel?: string;
  onSeasonChange: (season: SportSeasonType) => void;
  onSchoolYearChange: (year: number) => void;
  onCustomSeasonLabelChange?: (label: string) => void;
  suggestedSeason?: SportSeasonType;
  suggestedSeasonSource?: 'school' | 'state' | 'national' | 'unknown';
  disabled?: boolean;
  showHelperText?: boolean;
  compact?: boolean;
}

export function YearSeasonSelector({
  season,
  schoolYear,
  customSeasonLabel,
  onSeasonChange,
  onSchoolYearChange,
  onCustomSeasonLabelChange,
  suggestedSeason,
  suggestedSeasonSource,
  disabled = false,
  showHelperText = true,
  compact = false,
}: YearSeasonSelectorProps) {
  const [showExtendedYears, setShowExtendedYears] = useState(false);

  const currentSeason = getCurrentSeason();
  const currentSchoolYear = getCurrentSchoolYear();

  const availableYears = useMemo(() => {
    return getAvailableSchoolYears(showExtendedYears);
  }, [showExtendedYears]);

  const seasonOptions: SportSeasonType[] = ['fall', 'winter', 'spring', 'summer', 'year_round', 'custom'];

  const getYearBadge = (year: number) => {
    const status = getYearStatus(year);
    if (status === 'current') return <Badge variant="default" className="ml-2 text-xs">Current</Badge>;
    if (status === 'future') return <Badge variant="outline" className="ml-2 text-xs">Upcoming</Badge>;
    return null;
  };

  const getSeasonBadge = (s: SportSeasonType) => {
    if (s === currentSeason) {
      return <Badge variant="default" className="ml-2 text-xs">Now</Badge>;
    }
    if (s === suggestedSeason && suggestedSeasonSource) {
      const sourceLabels = {
        school: 'School Default',
        state: 'State Default',
        national: 'National Default',
        unknown: '',
      };
      if (sourceLabels[suggestedSeasonSource]) {
        return <Badge variant="secondary" className="ml-2 text-xs">{sourceLabels[suggestedSeasonSource]}</Badge>;
      }
    }
    return null;
  };

  return (
    <div className={cn("space-y-4", compact && "space-y-2")}>
      {showHelperText && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
          <Info className="h-4 w-4 mt-0.5 shrink-0" />
          <span>
            Season and year are auto-selected based on today's date and typical schedules. 
            You can change them at any time.
          </span>
        </div>
      )}

      <div className={cn("grid gap-4", compact ? "grid-cols-2" : "md:grid-cols-2")}>
        {/* Season Selector */}
        <div className="space-y-2">
          <Label>Season</Label>
          <Select
            value={season}
            onValueChange={(value) => onSeasonChange(value as SportSeasonType)}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select season" />
            </SelectTrigger>
            <SelectContent>
              {seasonOptions.map((s) => (
                <SelectItem key={s} value={s}>
                  <span className="flex items-center">
                    {SEASON_LABELS[s]}
                    {getSeasonBadge(s)}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Year Selector */}
        <div className="space-y-2">
          <Label>School Year</Label>
          <Select
            value={schoolYear.toString()}
            onValueChange={(value) => onSchoolYearChange(parseInt(value, 10))}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select year" />
            </SelectTrigger>
            <SelectContent>
              {availableYears.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  <span className="flex items-center">
                    {getSeasonYearLabel(year)}
                    {getYearBadge(year)}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Custom Season Label */}
      {season === 'custom' && onCustomSeasonLabelChange && (
        <div className="space-y-2">
          <Label>Custom Season Label</Label>
          <Input
            value={customSeasonLabel || ''}
            onChange={(e) => onCustomSeasonLabelChange(e.target.value)}
            placeholder="e.g., Preseason, Summer Conditioning, Offseason"
            disabled={disabled}
          />
          <p className="text-xs text-muted-foreground">
            Examples: Preseason, Offseason, Summer Conditioning, Tournament Season
          </p>
        </div>
      )}

      {/* Extended Years Toggle */}
      {!compact && (
        <Collapsible open={showExtendedYears} onOpenChange={setShowExtendedYears}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              {showExtendedYears ? 'Show fewer years' : 'View or add additional years'}
              <ChevronDown className={cn(
                "h-4 w-4 transition-transform",
                showExtendedYears && "rotate-180"
              )} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2">
            <p className="text-sm text-muted-foreground">
              Showing years from {getSeasonYearLabel(availableYears[0])} to {getSeasonYearLabel(availableYears[availableYears.length - 1])}.
              You can now select from 5 past years and up to 5 future years.
            </p>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}
