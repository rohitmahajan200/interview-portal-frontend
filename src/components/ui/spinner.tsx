import { LoaderIcon } from "lucide-react";

export default function Spinner() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/70 backdrop-blur-sm">
      <LoaderIcon className="h-10 w-10 animate-spin text-blue-600" />
    </div>
  );
}
