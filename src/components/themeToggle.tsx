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
    <button onClick={toggleTheme} className="hover:cursor-pointer">
      {currentStage === "light" ? (
        <MoonIcon className="h-5 w-5" />
      ) : (
        <SunIcon className="h-5 w-5" />
      )}
    </button>
  );
};

export default ThemeToggle;
