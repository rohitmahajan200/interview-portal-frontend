export const StageCircle: React.FC<{ currentStage: string }> = ({ currentStage }) => {
  const stages = ["registered", "hr", "assessment", "tech", "manager", "feedback"];
  const currentIndex = stages.indexOf(currentStage);
  const percentage = Math.round(((currentIndex + 1) / stages.length) * 100);

  return (
    <div className="flex items-center gap-3">
      <div className="relative w-12 h-12">
        <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
          <path
            className="text-gray-300"
            stroke="currentColor"
            strokeWidth="3"
            fill="transparent"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
          <path
            className="text-blue-500"
            stroke="currentColor"
            strokeWidth="3"
            strokeDasharray={`${percentage}, 100`}
            strokeLinecap="round"
            fill="transparent"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-semibold text-blue-600">{percentage}%</span>
        </div>
      </div>
      <div>
        <div className="text-sm font-medium capitalize">{currentStage}</div>
        <div className="text-xs text-muted-foreground">
          Step {currentIndex + 1} of {stages.length}
        </div>
      </div>
    </div>
  );
};
