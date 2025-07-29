import { CheckCircle, AlertCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const statusIcon = {
  completed: <CheckCircle className="text-green-500" size={20} />,
  current: <Clock className="text-blue-500" size={20} />,
  failed: <AlertCircle className="text-red-500" size={20} />,
};

export const ProgressBar = ({ stages }) => {
  return (
    <div className="w-full overflow-x-auto">
      <h2 className="text-xl font-semibold mb-4">Application Status</h2>
      <div className="relative flex min-w-[700px] sm:min-w-full items-start justify-between">
        {stages.map((stage, idx) => (
          <div key={idx} className="relative flex flex-col items-center text-center w-full">
            {/* Connector Line BEFORE current stage */}
            {idx > 0 && (
              <div
                className={cn(
                  "absolute -left-1/2 top-3 h-0.5 w-full z-0",
                  stages[idx - 1].status === "completed"
                    ? "bg-green-500"
                    : stages[idx - 1].status === "failed"
                    ? "bg-red-500"
                    : "bg-gray-300"
                )}
              />
            )}

            {/* Icon */}
            <div className="z-10 w-6 h-6 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center">
              {statusIcon[stage.status] || <Clock className="text-gray-400" size={20} />}
            </div>

            {/* Label */}
            <div className="mt-2 text-sm font-medium capitalize">{stage.stage}</div>
            <div className="text-xs text-muted-foreground">{formatDate(stage.date)}</div>

            {/* Comment */}
            {stage.comment && (
              <div className="mt-1 text-xs text-gray-500 w-32 break-words">{stage.comment}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

function formatDate(date) {
  if (!date) return "-";
  const d = new Date(date);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  });
}
