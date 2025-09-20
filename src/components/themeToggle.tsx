// src/components/ui/ThemeToggleCard.tsx
import React from 'react';
import { MoonIcon, SunIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppSelector } from '@/hooks/useAuth';
import { setCurrentTheme } from '@/features/Candidate/theme/themeSlice';
import { useDispatch } from 'react-redux';
import type { RootState } from '@/app/store';

const ThemeToggleCard = () => {
  const currentStage = useAppSelector(
    (state: RootState) => state.theme.currentStage
  );
  const dispatch = useDispatch();

  const toggleTheme = () => {
    dispatch(setCurrentTheme(currentStage === "light" ? "dark" : "light"));
  };

  // Remove useEffect - it's now handled in the slice

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border rounded-lg space-y-3 sm:space-y-0">
      <div className="space-y-1 min-w-0 flex-1">
        <h3 className="font-medium text-sm sm:text-base flex items-center gap-2">
          {currentStage === "light" ? (
            <SunIcon className="h-4 w-4 text-yellow-500" />
          ) : (
            <MoonIcon className="h-4 w-4 text-blue-500" />
          )}
          Theme Preference
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Switch between light and dark modes for better viewing experience
        </p>
      </div>
      <Button 
        onClick={toggleTheme}
        variant="outline"
        className="w-full sm:w-auto justify-center sm:justify-start"
      >
        {currentStage === "light" ? (
          <>
            <MoonIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-2 flex-shrink-0" />
            <span className="truncate">Switch to Dark</span>
          </>
        ) : (
          <>
            <SunIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-2 flex-shrink-0" />
            <span className="truncate">Switch to Light</span>
          </>
        )}
      </Button>
    </div>
  );
};

export default ThemeToggleCard;
