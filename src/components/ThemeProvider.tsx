// src/components/ThemeProvider.tsx
import { useEffect } from 'react';
import { useAppSelector } from '@/hooks/useAuth';
import type { RootState } from '@/app/store';

const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const currentTheme = useAppSelector((state: RootState) => state.theme.currentStage);

  useEffect(() => {
    const root = document.documentElement;
    if (currentTheme === "dark") {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem("theme", currentTheme);
  }, [currentTheme]);

  return <>{children}</>;
};

export default ThemeProvider;
