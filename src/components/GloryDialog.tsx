import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Star, Calendar } from 'lucide-react';

// Add missing interfaces
interface GloryData {
  [parameter: string]: string;
}

interface GloryRoleData {
  graderId?: string;
  graderName?: string;
  graderRole: 'hr' | 'manager' | 'invigilator' | 'admin';
  grades: GloryData;
  gradedAt: string;
}

interface CandidateGlory {
  [role: string]: GloryRoleData;
}

interface Candidate {
  _id: string;
  first_name: string;
  last_name: string;
  email: string;
  profile_photo_url?: {
    url: string;
  };
  applied_job?: {
    _id: string;
    name: string;
    gradingParameters?: string[];
  };
  current_stage?: string;
  glory?: CandidateGlory;
}

interface CurrentUser {
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface GloryDialogProps {
  isOpen: boolean;
  candidate: Candidate | null;
  gloryGrades: GloryData;
  selectedRole: 'hr' | 'manager' | 'invigilator' | 'admin';
  submittingGlory: boolean;
  loadingGlory: boolean;
  gradeOptions: string[];
  currentUser: CurrentUser | null;
  onClose: () => void;
  role: 'hr' | 'manager' | 'invigilator' | 'admin'; // Fixed role prop
  onGradeChange: (parameter: string, grade: string) => void;
  onSubmit: () => void;
  getGradingParameters: (jobId: string) => Promise<string[]>;
}

const GloryDialog: React.FC<GloryDialogProps> = ({
  isOpen,
  candidate,
  gloryGrades,
  selectedRole, // This will be the hardcoded role
  submittingGlory,
  loadingGlory,
  gradeOptions,
  currentUser,
  onClose,
  onGradeChange,
  onSubmit,
  getGradingParameters,
}) => {
  const [gradingParameters, setGradingParameters] = useState<string[]>([]);
  const [existingGloryData, setExistingGloryData] = useState<CandidateGlory | null>(null);

  useEffect(() => {
    const loadGradingParameters = async () => {
      if (candidate?.applied_job?._id) {
        const params = await getGradingParameters(candidate.applied_job._id);
        setGradingParameters(params);
      } else if (candidate?.applied_job?.gradingParameters) {
        setGradingParameters(candidate.applied_job.gradingParameters);
      } else {
        // Default parameters
        setGradingParameters(['Overall']);
      }
    };

    if (isOpen && candidate) {
      loadGradingParameters();
      // Load existing glory data for display
      if (candidate.glory) {
        setExistingGloryData(candidate.glory);
      }
    }
  }, [isOpen, candidate, getGradingParameters]);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case "A+": return "bg-green-100 text-green-800";
      case "A": return "bg-green-100 text-green-700";
      case "B": return "bg-blue-100 text-blue-700";
      case "C": return "bg-yellow-100 text-yellow-700";
      case "D": return "bg-orange-100 text-orange-700";
      case "E": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "hr": return "bg-purple-100 text-purple-800";
      case "manager": return "bg-blue-100 text-blue-800";
      case "invigilator": return "bg-green-100 text-green-800";
      case "admin": return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (!candidate) return null;

  const candidateName = `${candidate.first_name || ''} ${candidate.last_name || ''}`.trim() ||
    'Unknown Candidate';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto mx-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-purple-600" />
            Assign Glory Grades - {candidateName}
          </DialogTitle>
          <DialogDescription>
            Rate the candidate on each parameter using the A+ to E grading scale as {selectedRole.toUpperCase()}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Candidate Info */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/30 dark:to-blue-900/30 p-4 rounded-lg">
            <div className="flex items-center gap-3">
              <Avatar className="w-12 h-12">
                <AvatarImage src={candidate.profile_photo_url?.url} />
                <AvatarFallback>
                  {getInitials(candidateName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-lg">{candidateName}</h3>
                <p className="text-sm text-muted-foreground">
                  {candidate.email}
                </p>
                {candidate.current_stage && (
                  <Badge variant="outline">
                    {candidate.current_stage.toUpperCase()}
                  </Badge>
                )}
              </div>
            </div>
          </div>


          {/* Existing Glory Data Preview */}
          {existingGloryData && Object.keys(existingGloryData).length > 0 && (
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Star className="h-4 w-4 text-purple-600" />
                Existing Glory Grades
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(existingGloryData).map(([role, roleData]) => (
                  <div key={role} className="bg-white dark:bg-gray-700 p-3 rounded border">
                    <div className="flex items-center justify-between mb-2">
                      <Badge className={getRoleColor(role)} variant="outline">
                        {role.toUpperCase()}
                      </Badge>
                      {roleData.gradedAt && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {new Date(roleData.gradedAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                    {roleData.graderName && (
                      <p className="text-xs text-muted-foreground mb-2">
                        By: {roleData.graderName}
                      </p>
                    )}
                    {roleData.grades && Object.keys(roleData.grades).length > 0 ? (
                      <div className="grid grid-cols-2 gap-1">
                        {Object.entries(roleData.grades).map(([param, grade]) => (
                          <div key={param} className="flex items-center justify-between text-xs">
                            <span className="truncate">{param}:</span>
                            <Badge className={`${getGradeColor(grade)} text-xs`} variant="secondary">
                              {grade}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">No grades assigned</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Loading State */}
          {loadingGlory && (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              <span className="ml-2">Loading existing grades for {selectedRole.toUpperCase()}...</span>
            </div>
          )}

          {/* Grading Parameters */}
          {!loadingGlory && gradingParameters.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">Grading Parameters</h3>
                <Badge className={getRoleColor(selectedRole)} variant="outline">
                  Grading as {selectedRole.toUpperCase()}
                </Badge>
              </div>
              {gradingParameters.map((parameter, index) => (
                <div
                  key={index}
                  className="space-y-2 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800"
                >
                  <Label className="text-base font-medium">
                    {parameter}
                  </Label>
                  <Select
                    value={gloryGrades[parameter] || ""}
                    onValueChange={(value) => onGradeChange(parameter, value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select grade" />
                    </SelectTrigger>
                    <SelectContent>
                      {gradeOptions.map((grade) => (
                        <SelectItem key={grade} value={grade}>
                          <div className="flex items-center space-x-2">
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold ${getGradeColor(grade)}`}
                            >
                              {grade}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {gloryGrades[parameter] && (
                    <div className="text-sm text-muted-foreground">
                      Current grade:{" "}
                      <span className={`font-semibold px-2 py-1 rounded ${getGradeColor(gloryGrades[parameter])}`}>
                        {gloryGrades[parameter]}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : !loadingGlory && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                No grading parameters defined for this position.
              </p>
            </div>
          )}

          {/* Grade Summary */}
          {Object.keys(gloryGrades).length > 0 && (
            <div className="bg-purple-50 dark:bg-purple-900/30 p-4 rounded-lg">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Star className="h-4 w-4 text-purple-600" />
                Grade Summary for {selectedRole.toUpperCase()}
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(gloryGrades).map(([param, grade]) => (
                  <div key={param} className="flex justify-between items-center">
                    <span className="text-sm">{param}:</span>
                    <span className={`px-2 py-1 rounded text-xs font-bold ${getGradeColor(grade)}`}>
                      {grade}
                    </span>
                  </div>
                ))}
              </div>
              {currentUser && (
                <div className="mt-2 pt-2 border-t">
                  <p className="text-xs text-muted-foreground">
                    Will be saved by: {currentUser.name} ({selectedRole.toUpperCase()})
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={submittingGlory}
          >
            Cancel
          </Button>
          <Button
            onClick={onSubmit}
            disabled={submittingGlory || Object.keys(gloryGrades).length === 0}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {submittingGlory ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Saving as {selectedRole.toUpperCase()}...
              </>
            ) : (
              <>
                <Star className="h-4 w-4 mr-2" />
                Save Grades as {selectedRole.toUpperCase()}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GloryDialog;
