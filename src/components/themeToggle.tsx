import type { RootState } from "@/app/store";
import { setCurrentTheme } from "@/features/theme/themeSlice";
import { useAppSelector } from "@/hooks/useAuth";
import { MoonIcon, SunIcon } from "lucide-react";
import  { useEffect } from "react";
import { useDispatch } from "react-redux";


const ThemeToggle = () => {
  const currentStage = useAppSelector(
    (state: RootState) => state.theme.currentStage
  );
  const dispatch = useDispatch();

  const toggleTheme = () => {
    dispatch(setCurrentTheme(currentStage === "light" ? "dark" : "light"));
  };

  useEffect(()=>{
    const root=document.documentElement;
    if(currentStage=="dark"){
      root.classList.add('dark');
    }else{
      root.classList.remove('dark');
    }
    localStorage.setItem("theme", currentStage);
  },[currentStage])

  return (
    <button onClick={toggleTheme} 
    className="fixed top-4 right-4 z-50 p-2 
    rounded-full bg-white dark:bg-gray-800 
    shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl 
    transition-all duration-200 hover:scale-105"
>
      {currentStage === "light" ? (
        <MoonIcon className="h-5 w-5" />
      ) : (
        <SunIcon className="h-5 w-5" />
      )}
    </button>
  );
};

export default ThemeToggle;
