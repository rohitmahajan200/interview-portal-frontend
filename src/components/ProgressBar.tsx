import { CheckCircle, Clock, Circle, User, FileText, Monitor, Users, MessageSquare, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

type StageStatus = "completed" | "current" | "pending" | "failed";

interface Stage {
  stage: string;
  status: StageStatus;
  date?: string;
  comment?: string;
}

interface Props {
  stages: Stage[];
}

// Stage mapping from backend to frontend
const STAGE_MAPPING = {
  'registered': 'Registration',
  'hr': 'HR Screening',
  'assessment': 'Assessment',
  'tech': 'Interview',
  'manager': 'Managerial Review',
  'feedback': 'Feedback'
} as const;

// All possible stages in order
const ALL_STAGES = ['registered', 'hr', 'assessment', 'tech', 'manager', 'feedback'] as const;

// Stage icons mapping
const stageIcons = {
  'registered': User,
  'hr': Users,
  'assessment': FileText,
  'tech': Monitor,
  'manager': UserCheck,
  'feedback': MessageSquare
} as const;

// Status styling
const getStatusConfig = (status: StageStatus) => {
  switch (status) {
    case "completed":
      return {
        icon: CheckCircle,
        iconClass: "text-white",
        bgClass: "bg-green-500 border-green-500 shadow-green-200",
        lineClass: "bg-green-500",
        textClass: "text-green-700",
        badgeVariant: "default" as const
      };
    case "current":
      return {
        icon: Clock,
        iconClass: "text-white",
        bgClass: "bg-blue-500 border-blue-500 shadow-blue-200 animate-pulse",
        lineClass: "bg-blue-500",
        textClass: "text-blue-700",
        badgeVariant: "secondary" as const
      };
    case "failed":
      return {
        icon: Circle,
        iconClass: "text-white",
        bgClass: "bg-red-500 border-red-500 shadow-red-200",
        lineClass: "bg-red-500",
        textClass: "text-red-700",
        badgeVariant: "destructive" as const
      };
    default:
      return {
        icon: Circle,
        iconClass: "text-gray-400",
        bgClass: "bg-gray-100 border-gray-300 shadow-gray-100",
        lineClass: "bg-gray-300",
        textClass: "text-gray-500",
        badgeVariant: "outline" as const
      };
  }
};

// Helper function to ensure all stages are shown
const normalizeStages = (inputStages: Stage[]): Stage[] => {
  const stageMap = new Map(inputStages.map(stage => [stage.stage.toLowerCase(), stage]));
  
  return ALL_STAGES.map(stageKey => {
    // Try to find matching stage by mapped name or original key
    const mappedName = STAGE_MAPPING[stageKey];
    const existingStage = 
      stageMap.get(mappedName.toLowerCase()) || 
      stageMap.get(stageKey) ||
      inputStages.find(s => s.stage.toLowerCase().includes(stageKey));
    
    if (existingStage) {
      return {
        ...existingStage,
        stage: mappedName // Use mapped name
      };
    }
    
    // Create pending stage if not found
    return {
      stage: mappedName,
      status: "pending" as StageStatus,
      date: undefined,
      comment: undefined
    };
  });
};

export const ProgressBar: React.FC<Props> = ({ stages }) => {
  const normalizedStages = normalizeStages(stages);

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground mb-2">Application Progress</h2>
          <p className="text-muted-foreground">Track your application status through our hiring process</p>
        </div>
        
        <div className="relative">
          <div className="flex items-center justify-between relative">
            {normalizedStages.map((stage, idx) => {
              const config = getStatusConfig(stage.status);
              const StageIcon = stageIcons[ALL_STAGES[idx]] || User;
              const StatusIcon = config.icon;
              
              return (
                <div key={idx} className="relative flex flex-col items-center group">
                  {/* Connection Line */}
                  {idx > 0 && (
                    <div
                      className={cn(
                        "absolute right-1/2 top-4 h-1 w-full -z-10 transition-all duration-500",
                        normalizedStages[idx - 1].status === "completed" || 
                        normalizedStages[idx - 1].status === "current"
                          ? getStatusConfig(normalizedStages[idx - 1].status).lineClass
                          : "bg-gray-200"
                      )}
                    />
                  )}

                  {/* Stage Circle */}
                  <div className="relative mb-3">
                    <div
                      className={cn(
                        "relative w-12 h-12 rounded-full border-3 flex items-center justify-center shadow-lg transition-all duration-300 group-hover:scale-110",
                        config.bgClass
                      )}
                    >
                      {stage.status === "completed" ? (
                        <StatusIcon className={cn("w-6 h-6", config.iconClass)} />
                      ) : stage.status === "current" ? (
                        <StatusIcon className={cn("w-6 h-6", config.iconClass)} />
                      ) : (
                        <StageIcon className={cn("w-5 h-5", config.iconClass)} />
                      )}
                    </div>
                    
                    {/* Status Badge */}
                    <Badge 
                      variant={config.badgeVariant}
                      className="absolute -top-1 -right-1 px-1 py-0 text-xs h-5 min-w-5"
                    >
                      {idx + 1}
                    </Badge>
                  </div>

                  {/* Stage Info */}
                  <div className="text-center max-w-[120px]">
                    <h3 className={cn(
                      "font-semibold text-sm mb-1 transition-colors",
                      config.textClass
                    )}>
                      {stage.stage}
                    </h3>
                    
                    <p className="text-xs text-muted-foreground mb-1">
                      {formatDate(stage.date)}
                    </p>
                    
                    {stage.comment && (
                      <p className="text-xs text-muted-foreground break-words leading-tight">
                        {stage.comment}
                      </p>
                    )}
                    
                    {stage.status === "current" && (
                      <div className="mt-2">
                        <Badge variant="secondary" className="text-xs animate-pulse">
                          In Progress
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Progress Summary */}
          <div className="mt-8 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Progress: {normalizedStages.filter(s => s.status === "completed").length} of {normalizedStages.length} stages completed
              </span>
              <div className="flex gap-2">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-xs text-muted-foreground">Completed</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span className="text-xs text-muted-foreground">Current</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                  <span className="text-xs text-muted-foreground">Pending</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

function formatDate(date?: string): string {
  if (!date) return "Pending";
  const d = new Date(date);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  });
}
