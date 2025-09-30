import { useState } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

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

export const useGlory = (fixedRole: 'hr' | 'manager' | 'invigilator' | 'admin' = 'hr') => {
  const [gloryDialogOpen, setGloryDialogOpen] = useState(false);
  const [candidateForGlory, setCandidateForGlory] = useState<Candidate | null>(null);
  const [gloryGrades, setGloryGrades] = useState<GloryData>({});
  const [submittingGlory, setSubmittingGlory] = useState(false);
  const [loadingGlory, setLoadingGlory] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const gradeOptions = ["A+", "A", "B", "C", "D", "E"];

  const openGloryDialog = async (candidate: Candidate) => {
        setCandidateForGlory(candidate);
    setGloryDialogOpen(true);
    
    // Get current user info (you might need to adjust this based on your auth system)
    try {
      const userResponse = await api.get('org/me');
      setCurrentUser(userResponse.data.user);
    } catch (error) {
          }
    
    // Load existing glory grades for the fixed role
    if (candidate._id) {
      setLoadingGlory(true);
      try {
        const response = await api.get(`/org/${candidate._id}/glory`);
        if (response.data.success && response.data.data.glory) {
          // Load grades for the fixed role
          const roleData = response.data.data.glory[fixedRole];
          if (roleData && roleData.grades) {
            setGloryGrades(roleData.grades);
          } else {
            setGloryGrades({});
          }
        }
      } catch (error) {
                setGloryGrades({});
      } finally {
        setLoadingGlory(false);
      }
    }
  };

  const closeGloryDialog = () => {
    setGloryDialogOpen(false);
    setCandidateForGlory(null);
    setGloryGrades({});
    setCurrentUser(null);
  };

  const handleGloryGradeChange = (parameter: string, grade: string) => {
    setGloryGrades((prev) => ({ ...prev, [parameter]: grade }));
  };

const submitGloryGrades = async (onSuccess?: () => void) => {
  if (!candidateForGlory?._id) {
    toast.error('Candidate ID missing');
    return;
  }
  if (Object.keys(gloryGrades).length === 0) {
    toast.error('Please assign at least one grade');
    return;
  }

  // build the nested structure the back-end wants
  const payload = {
    glory: {
      [fixedRole]: {
        grades: gloryGrades,
        gradedAt: new Date().toISOString(),
        graderId: currentUser?._id,
        graderName: currentUser?.name,
        graderRole: fixedRole
      }
    },
    role: fixedRole
  };

  setSubmittingGlory(true);
  try {
    const res = await api.post(`/org/${candidateForGlory._id}/glory`, payload);

    if (res.data.success) {
      toast.success(`Glory grades assigned for ${fixedRole.toUpperCase()}`);
      closeGloryDialog();
      onSuccess?.();
    } else {
      toast.error(res.data.message || 'Failed to assign glory grades');
    }
    
  } catch (err: any) {
    toast.error(err?.response?.data?.message || 'API error assigning grades');
  } finally {
    setSubmittingGlory(false);
  }
};


  const getGradingParameters = async (jobId: string): Promise<string[]> => {
    try {
      const response = await api.get(`/org/${jobId}/grading-parameters`);
      if (response.data.success) {
        return response.data.data.gradingParameters || [];
      }
      return [];
    } catch (error) {
            return [];
    }
  };

  return {
    // State
    gloryDialogOpen,
    candidateForGlory,
    gloryGrades,
    selectedRole: fixedRole, // Return the fixed role
    submittingGlory,
    loadingGlory,
    gradeOptions,
    currentUser,
    
    // Actions
    openGloryDialog,
    closeGloryDialog,
    handleGloryGradeChange,
    submitGloryGrades,
    getGradingParameters,
  };
};
