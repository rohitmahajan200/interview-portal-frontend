import React from 'react';
import { format, isValid } from 'date-fns';

// Types matching your data structure
export interface Stage {
  stage: string;
  date: string;
  status: "completed" | "current" | "pending";
  comment: string;
}

// Simplified stage configuration with minimal colors
const STAGE_CONFIG: Record<string, {
  order: number;
  label: string;
  icon: string;
}> = {
  registered: { order: 0, label: "Registered", icon: "📝" },
  hr: { order: 1, label: "HR Review", icon: "👥" },
  assessment: { order: 2, label: "Assessment", icon: "📊" },
  tech: { order: 3, label: "Technical", icon: "💻" },
  manager: { order: 4, label: "Manager Review", icon: "👔" },
  feedback: { order: 5, label: "Feedback", icon: "✅" }
};

// Helper function to safely parse dates
const safeParseDate = (dateString: string | undefined | null): Date | null => {
  if (!dateString) return null;
  
  try {
    const date = new Date(dateString);
    if (isValid(date)) return date;
    
    if (typeof dateString === 'string') {
      if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const parts = dateString.split('-');
        const parsedDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        return isValid(parsedDate) ? parsedDate : null;
      }
      
      if (dateString.includes('T')) {
        const isoDate = new Date(dateString);
        return isValid(isoDate) ? isoDate : null;
      }
    }
    
    return null;
  } catch {
    return null;
  }
};

// Helper function to safely format dates
const safeFormatDate = (dateString: string | undefined | null, formatStr: string = 'MMM dd'): string => {
  if (!dateString) return 'N/A';
  
  const date = safeParseDate(dateString);
  if (!date) return 'Invalid';
  
  try {
    return format(date, formatStr);
  } catch {
    return 'Invalid';
  }
};

// Helper function to determine action type
const getActionType = (currentIndex: number, stages: Stage[]): "promote" | "demote" | "maintain" | "registration" => {
  if (currentIndex === 0) return "registration";
  
  const currentStage = stages[currentIndex];
  const previousStage = stages[currentIndex - 1];
  
  const currentOrder = STAGE_CONFIG[currentStage.stage]?.order ?? -1;
  const previousOrder = STAGE_CONFIG[previousStage.stage]?.order ?? -1;
  
  if (currentOrder > previousOrder) return "promote";
  if (currentOrder < previousOrder) return "demote";
  return "maintain";
};

// Props interface
interface StageHistoryViewerProps {
  stages: Stage[];
}

const StageHistoryViewer: React.FC<StageHistoryViewerProps> = ({ stages }) => {
  if (!stages || stages.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <p className="text-sm">No application stages to display</p>
      </div>
    );
  }

  // Find current stage
  const currentStageItem = stages.find(stage => stage.status === "current");
  const currentStage = currentStageItem?.stage || stages[stages.length - 1]?.stage;
  const currentStageInfo = currentStage ? STAGE_CONFIG[currentStage] : null;

  // Sort stages by date (newest first)
  const sortedStages = [...stages].sort((a, b) => {
    const dateA = safeParseDate(a.date);
    const dateB = safeParseDate(b.date);
    
    if (!dateA && !dateB) return 0;
    if (!dateA) return 1;
    if (!dateB) return -1;
    
    return dateB.getTime() - dateA.getTime();
  });

  const getActionIcon = (actionType: string): string => {
    switch (actionType) {
      case 'promote': return '↗';
      case 'demote': return '↙';
      case 'registration': return '•';
      default: return '→';
    }
  };

  const getActionLabel = (actionType: string): string => {
    switch (actionType) {
      case 'promote': return 'Promoted';
      case 'demote': return 'Demoted';
      case 'registration': return 'Started';
      default: return 'Updated';
    }
  };

  const getActionTagStyle = (actionType: string): string => {
    switch (actionType) {
      case 'promote': 
        return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700';
      case 'demote': 
        return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-700';
      case 'registration': 
        return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700';
      default: 
        return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600';
    }
  };

  // Calculate original order for action types
  const originalOrderStages = [...stages].sort((a, b) => {
    const dateA = safeParseDate(a.date);
    const dateB = safeParseDate(b.date);
    
    if (!dateA && !dateB) return 0;
    if (!dateA) return 1;
    if (!dateB) return -1;
    
    return dateA.getTime() - dateB.getTime();
  });

  return (
    <div className="w-full">
      {/* Current Stage - Prominent Display */}
      {currentStageInfo && (
        <div className="mb-4">
          <div className="flex items-center justify-between p-4 bg-card rounded-lg border border-border">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm">{currentStageInfo.icon}</span>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">
                  {currentStageInfo.label}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Current stage • {safeFormatDate(currentStageItem?.date, 'MMM dd, yyyy')}
                </p>
              </div>
            </div>
            <div className="px-3 py-1 bg-primary text-primary-foreground rounded-full text-xs font-medium">
              Active
            </div>
          </div>
        </div>
      )}

      {/* Stage History - Clean List */}
      <div>
        <h4 className="font-medium text-foreground mb-3">Application Progress</h4>
        
        <div className="space-y-2">
          {sortedStages.map((stage, displayIndex) => {
            const originalIndex = originalOrderStages.findIndex(s => s.date === stage.date && s.stage === stage.stage);
            const actionType = getActionType(Math.max(0, originalIndex), originalOrderStages);
            const stageConfig = STAGE_CONFIG[stage.stage];
            
            if (!stageConfig) return null;

            return (
              <div 
                key={`${stage.stage}-${stage.date}-${displayIndex}`} 
                className={`
                  flex items-center gap-3 p-3 rounded-md transition-colors
                  ${stage.status === 'current' 
                    ? 'bg-primary/5 border border-primary/20' 
                    : 'bg-card hover:bg-muted/50 border border-border/50'
                  }
                `}
              >
                {/* Progress Indicator */}
                <div className={`
                  w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium
                  ${stage.status === 'current' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground'
                  }
                `}>
                  {stage.status === 'current' ? '•' : getActionIcon(actionType)}
                </div>

                {/* Stage Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-foreground">
                      {stageConfig.label}
                    </span>
                    
                    {/* Promotion/Demotion Tag */}
                    {actionType !== 'registration' && (
                      <span className={`
                        px-2 py-0.5 rounded-full text-xs font-medium border
                        ${getActionTagStyle(actionType)}
                      `}>
                        {getActionIcon(actionType)} {getActionLabel(actionType)}
                      </span>
                    )}
                    
                    {actionType === 'registration' && (
                      <span className={`
                        px-2 py-0.5 rounded-full text-xs font-medium border
                        ${getActionTagStyle(actionType)}
                      `}>
                        {getActionIcon(actionType)} {getActionLabel(actionType)}
                      </span>
                    )}
                    
                    {stage.status === 'current' && (
                      <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-medium">
                        Current
                      </span>
                    )}
                    
                    {stage.status === 'completed' && (
                      <span className="px-2 py-0.5 bg-muted text-muted-foreground rounded-full text-xs">
                        Completed
                      </span>
                    )}
                  </div>
                  
                  {stage.comment && stage.comment !== '-' && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {stage.comment}
                    </p>
                  )}
                </div>

                {/* Date */}
                <div className="text-sm text-muted-foreground">
                  {safeFormatDate(stage.date)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default StageHistoryViewer;
