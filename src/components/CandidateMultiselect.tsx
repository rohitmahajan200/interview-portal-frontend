// CandidateMultiSelect Component
import { useState, useRef, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { Users } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface CandidateMultiSelectProps {
  candidates: any[];
  selectedCandidates: string[];
  onSelectionChange: (selected: string[]) => void;
  selectedJobId?: string;
}

const CandidateMultiSelect = ({ 
  candidates, 
  selectedCandidates, 
  onSelectionChange, 
  selectedJobId 
}: CandidateMultiSelectProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [triggerWidth, setTriggerWidth] = useState<number | undefined>(undefined);

  // Update trigger width when component mounts or resizes
  useEffect(() => {
    const updateWidth = () => {
      if (triggerRef.current) {
        setTriggerWidth(triggerRef.current.offsetWidth);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Update width when open state changes (ensures width is set correctly)
  useEffect(() => {
    if (open && triggerRef.current) {
      setTriggerWidth(triggerRef.current.offsetWidth);
    }
  }, [open]);

  const filteredCandidates = candidates.filter((candidate) => {
    const searchTerm = search.toLowerCase();
    return (
      candidate.first_name.toLowerCase().includes(searchTerm) ||
      candidate.last_name.toLowerCase().includes(searchTerm) ||
      candidate.email.toLowerCase().includes(searchTerm) ||
      candidate.applied_job?.title.toLowerCase().includes(searchTerm)
    );
  });

  const toggleCandidate = (candidateId: string) => {
    const newSelection = selectedCandidates.includes(candidateId)
      ? selectedCandidates.filter(id => id !== candidateId)
      : [...selectedCandidates, candidateId];
    onSelectionChange(newSelection);
  };

  const selectAll = () => {
    onSelectionChange(filteredCandidates.map(c => c._id));
  };

  const clearAll = () => {
    onSelectionChange([]);
  };

  const getSelectedCandidateNames = () => {
    return candidates
      .filter(c => selectedCandidates.includes(c._id))
      .map(c => `${c.first_name} ${c.last_name}`)
      .slice(0, 3);
  };

  return (
    <div className="space-y-2">
      {/* Popover Trigger Button */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={triggerRef}
            variant="outline"
            className="w-full justify-start text-left font-normal h-auto min-h-9 p-2 sm:p-3"
          >
            <Users className="w-4 h-4 mr-2 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              {selectedCandidates.length === 0 ? (
                <span className="text-muted-foreground dark:text-muted-foreground text-sm">
                  Select candidates...
                </span>
              ) : (
                <div className="flex flex-wrap gap-1">
                  <Badge variant="secondary" className="text-xs h-5">
                    {selectedCandidates.length} selected
                  </Badge>
                  {getSelectedCandidateNames().slice(0, 2).map((name, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs h-5">
                      {name}
                    </Badge>
                  ))}
                  {selectedCandidates.length > 2 && (
                    <Badge variant="outline" className="text-xs h-5">
                      +{selectedCandidates.length - 2} more
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </Button>
        </PopoverTrigger>

        <PopoverContent 
          className="p-0 border border-border dark:border-border bg-popover dark:bg-popover" 
          align="start"
          style={{ 
            width: triggerWidth ? `${triggerWidth}px` : 'auto',
            minWidth: '320px', // Minimum width for mobile
            maxWidth: '90vw'   // Maximum width for small screens
          }}
        >
          <Command className="rounded-lg border-none">
            <div className="flex items-center border-b border-border dark:border-border px-3 py-2">
              <CommandInput
                placeholder="Search by name, email, or job..."
                value={search}
                onValueChange={setSearch}
                className="flex-1 bg-transparent border-none focus:ring-0 text-foreground dark:text-foreground placeholder:text-muted-foreground dark:placeholder:text-muted-foreground"
              />
            </div>

            {/* Header with Select All/Clear */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-border dark:border-border bg-gray-50 dark:bg-gray-800">
              <span className="text-sm font-medium text-foreground dark:text-foreground">
                Candidates ({filteredCandidates.length})
              </span>
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={selectAll}
                  className="text-xs h-6 px-2"
                >
                  All
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearAll}
                  className="text-xs h-6 px-2"
                >
                  Clear
                </Button>
              </div>
            </div>

            <CommandList className="max-h-64 overflow-y-auto">
              <CommandEmpty className="py-6 text-center text-sm text-muted-foreground dark:text-muted-foreground">
                No candidates found.
              </CommandEmpty>
              <CommandGroup>
                {filteredCandidates.map((candidate) => {
                  const isSelected = selectedCandidates.includes(candidate._id);
                  const isJobMatch = selectedJobId && candidate.applied_job?._id === selectedJobId;
                  
                  return (
                    <CommandItem
                      key={candidate._id}
                      onSelect={() => toggleCandidate(candidate._id)}
                      className={`flex items-center space-x-3 p-2 cursor-pointer rounded-sm transition-colors
                        hover:bg-accent hover:text-accent-foreground 
                        focus:bg-accent focus:text-accent-foreground
                        ${isJobMatch 
                          ? 'bg-blue-50 dark:bg-blue-900/20 border-l-2 border-l-blue-500 dark:border-l-blue-400' 
                          : ''
                        }`}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleCandidate(candidate._id)}
                        className="flex-shrink-0"
                        onClick={(e) => e.stopPropagation()} // Prevent double toggle
                      />
                      <Avatar className="w-8 h-8 flex-shrink-0">
                        <AvatarImage src={candidate.profile_photo_url?.url} />
                        <AvatarFallback className="text-xs">
                          {candidate.first_name[0]}{candidate.last_name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate text-foreground dark:text-foreground">
                          {candidate.first_name} {candidate.last_name}
                        </div>
                        <div className="text-xs text-muted-foreground dark:text-muted-foreground truncate">
                          {candidate.email}
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          <Badge variant="outline" className="text-xs h-4">
                            {candidate.applied_job?.title}
                          </Badge>
                          {isJobMatch && (
                            <Badge variant="default" className="text-xs h-4 bg-blue-600">
                              ✓
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected Count Display */}
      {selectedCandidates.length > 0 && (
        <div className="text-xs text-muted-foreground dark:text-muted-foreground">
          {selectedCandidates.length} candidate{selectedCandidates.length !== 1 ? 's' : ''} selected
        </div>
      )}
    </div>
  );
};

export default CandidateMultiSelect;
