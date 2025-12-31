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

export interface School {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  address: string | null;
  zip: string | null;
  phone: string | null;
  website: string | null;
  district_id: string | null;
}

interface SchoolSearchComboboxProps {
  value?: School | null;
  onSelect: (school: School | null) => void;
  districtId?: string | null;
  placeholder?: string;
  disabled?: boolean;
}

export function SchoolSearchCombobox({
  value,
  onSelect,
  districtId,
  placeholder = "Search schools...",
  disabled = false
}: SchoolSearchComboboxProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: schools, isLoading } = useQuery({
    queryKey: ['school-search', searchQuery, districtId],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 2) return [];
      
      let query = supabase
        .from('schools')
        .select('id, name, city, state, address, zip, phone, website, district_id')
        .or(`name.ilike.%${searchQuery}%,city.ilike.%${searchQuery}%`)
        .order('name')
        .limit(20);

      if (districtId) {
        query = query.eq('district_id', districtId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as School[];
    },
    enabled: searchQuery.length >= 2
  });

  const handleSelect = useCallback((school: School) => {
    onSelect(school);
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
          disabled={disabled}
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
                Type to search schools
              </div>
            ) : isLoading ? (
              <div className="py-6 text-center">
                <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : schools && schools.length > 0 ? (
              <CommandGroup heading="Schools">
                {schools.map((school) => (
                  <CommandItem
                    key={school.id}
                    value={school.id}
                    onSelect={() => handleSelect(school)}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value?.id === school.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col">
                      <span className="font-medium">{school.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {[school.city, school.state].filter(Boolean).join(', ')}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : (
              <CommandEmpty>No schools found.</CommandEmpty>
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
