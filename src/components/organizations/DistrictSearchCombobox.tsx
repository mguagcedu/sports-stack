import { useState, useCallback } from 'react';
import { Check, ChevronsUpDown, Search, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
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
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

export interface District {
  id: string;
  name: string;
  city: string | null;
  state: string;
  address: string | null;
  zip: string | null;
  phone: string | null;
  website: string | null;
}

interface DistrictSearchComboboxProps {
  value?: District | null;
  onSelect: (district: District | null) => void;
  placeholder?: string;
}

export function DistrictSearchCombobox({
  value,
  onSelect,
  placeholder = "Search districts..."
}: DistrictSearchComboboxProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: districts, isLoading } = useQuery({
    queryKey: ['district-search', searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 2) return [];
      
      const { data, error } = await supabase
        .from('districts')
        .select('id, name, city, state, address, zip, phone, website')
        .or(`name.ilike.%${searchQuery}%,city.ilike.%${searchQuery}%`)
        .order('name')
        .limit(20);

      if (error) throw error;
      return data as District[];
    },
    enabled: searchQuery.length >= 2
  });

  const handleSelect = useCallback((district: District) => {
    onSelect(district);
    setOpen(false);
    setSearchQuery('');
  }, [onSelect]);

  const handleClear = useCallback(() => {
    onSelect(null);
    setSearchQuery('');
  }, [onSelect]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          {value ? (
            <span className="truncate">
              {value.name} - {value.city}, {value.state}
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder="Type at least 2 characters..." 
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            {searchQuery.length < 2 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                <Search className="mx-auto h-8 w-8 mb-2 opacity-50" />
                Type to search districts
              </div>
            ) : isLoading ? (
              <div className="py-6 text-center">
                <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : districts && districts.length > 0 ? (
              <CommandGroup heading="Districts">
                {districts.map((district) => (
                  <CommandItem
                    key={district.id}
                    value={district.id}
                    onSelect={() => handleSelect(district)}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value?.id === district.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col">
                      <span className="font-medium">{district.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {[district.city, district.state].filter(Boolean).join(', ')}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : (
              <CommandEmpty>No districts found.</CommandEmpty>
            )}
          </CommandList>
          {value && (
            <div className="border-t p-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full text-muted-foreground"
                onClick={handleClear}
              >
                Clear selection
              </Button>
            </div>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
}
