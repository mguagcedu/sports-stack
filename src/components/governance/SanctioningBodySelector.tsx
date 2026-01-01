import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, ChevronsUpDown, Building2, Globe, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GoverningBody {
  id: string;
  name: string;
  short_name: string | null;
  type: string;
  state_code: string | null;
  is_seeded: boolean;
}

interface SanctioningBodySelectorProps {
  value?: string;
  onSelect: (body: GoverningBody | null) => void;
  stateCode?: string;
  placeholder?: string;
  disabled?: boolean;
}

const TYPE_LABELS: Record<string, string> = {
  state_primary: 'State Primary',
  state_private: 'Private Schools',
  city_public: 'City League',
  independent_schools: 'Independent',
  prep_conference: 'Prep Conference',
  charter: 'Charter',
  national: 'National',
  multi_state: 'Multi-State',
  other: 'Other',
};

export function SanctioningBodySelector({
  value,
  onSelect,
  stateCode,
  placeholder = 'Select sanctioning body...',
  disabled = false,
}: SanctioningBodySelectorProps) {
  const [open, setOpen] = useState(false);

  const { data: governingBodies, isLoading } = useQuery({
    queryKey: ['governing-bodies', stateCode],
    queryFn: async () => {
      let query = supabase
        .from('governing_bodies')
        .select('*')
        .eq('is_active', true)
        .order('type')
        .order('name');

      const { data, error } = await query;
      if (error) throw error;
      return data as GoverningBody[];
    },
  });

  // Group bodies by type and prioritize state-specific ones
  const groupedBodies = governingBodies?.reduce((acc, body) => {
    // Prioritize bodies matching the school's state
    const isStateMatch = stateCode && body.state_code === stateCode;
    const groupKey = isStateMatch ? 'state_match' : body.type;
    
    if (!acc[groupKey]) {
      acc[groupKey] = [];
    }
    acc[groupKey].push(body);
    return acc;
  }, {} as Record<string, GoverningBody[]>);

  const selectedBody = governingBodies?.find((b) => b.id === value);

  const getGroupLabel = (key: string) => {
    if (key === 'state_match') return `Your State (${stateCode})`;
    return TYPE_LABELS[key] || key;
  };

  const getIcon = (type: string) => {
    if (type === 'national' || type === 'multi_state') return <Globe className="h-4 w-4" />;
    if (type === 'state_primary' || type === 'state_private') return <MapPin className="h-4 w-4" />;
    return <Building2 className="h-4 w-4" />;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {selectedBody ? (
            <span className="flex items-center gap-2">
              {getIcon(selectedBody.type)}
              {selectedBody.short_name || selectedBody.name}
              {selectedBody.state_code && (
                <Badge variant="outline" className="ml-1 text-xs">
                  {selectedBody.state_code}
                </Badge>
              )}
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search sanctioning bodies..." />
          <CommandList>
            <CommandEmpty>
              {isLoading ? 'Loading...' : 'No sanctioning body found.'}
            </CommandEmpty>
            
            {/* State-matched bodies first */}
            {groupedBodies?.state_match && groupedBodies.state_match.length > 0 && (
              <CommandGroup heading={getGroupLabel('state_match')}>
                {groupedBodies.state_match.map((body) => (
                  <CommandItem
                    key={body.id}
                    value={`${body.name} ${body.short_name || ''}`}
                    onSelect={() => {
                      onSelect(body.id === value ? null : body);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === body.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex items-center gap-2 flex-1">
                      {getIcon(body.type)}
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {body.short_name || body.name}
                        </span>
                        {body.short_name && (
                          <span className="text-xs text-muted-foreground">
                            {body.name}
                          </span>
                        )}
                      </div>
                    </div>
                    {body.type === 'state_primary' && (
                      <Badge variant="default" className="text-xs">Primary</Badge>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {/* Other groups */}
            {Object.entries(groupedBodies || {})
              .filter(([key]) => key !== 'state_match')
              .map(([type, bodies]) => (
                <CommandGroup key={type} heading={getGroupLabel(type)}>
                  {bodies.map((body) => (
                    <CommandItem
                      key={body.id}
                      value={`${body.name} ${body.short_name || ''}`}
                      onSelect={() => {
                        onSelect(body.id === value ? null : body);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === body.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex items-center gap-2 flex-1">
                        {getIcon(body.type)}
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {body.short_name || body.name}
                          </span>
                          {body.short_name && (
                            <span className="text-xs text-muted-foreground">
                              {body.name}
                            </span>
                          )}
                        </div>
                      </div>
                      {body.state_code && (
                        <Badge variant="outline" className="text-xs">
                          {body.state_code}
                        </Badge>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
