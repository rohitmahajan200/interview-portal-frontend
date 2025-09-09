import { Button } from '@/components/ui/button';
import { Star } from 'lucide-react';

interface GloryButtonProps {
  candidate: any;
  onOpenGlory: (candidate: any) => void; // NEW: Accept function as prop
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "default" | "lg";
  className?: string;
}

const GloryButton: React.FC<GloryButtonProps> = ({ 
  candidate, 
  onOpenGlory, // NEW: Use prop instead of hook
  variant = "outline", 
  size = "sm",
  className = "" 
}) => {
  const handleClick = () => {
    console.log("Glory button clicked for candidate:", candidate);
    onOpenGlory(candidate); // Use prop function
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      className={`text-purple-600 hover:text-purple-700 ${className}`}
    >
      <Star className="h-4 w-4 mr-1" />
      Glory
    </Button>
  );
};

export default GloryButton;
