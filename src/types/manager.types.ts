// src/types/manager.types.ts
type document ={
document_type:string
document_url:string
uploaded_at:string
_id:string
}

export interface ManagerCandidate {
  _id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  profile_photo_url?: {
    url: string;
    publicId: string;
  };
  documents:[document];
  applied_job: {
    _id: string;
    name: string;
    description?: any;
  };
  current_stage: string;
  status: 'active' | 'hired' | 'rejected' | 'withdrawn';
  
  // Populated fields
  assessments?: Array<{
    _id: string;
    total_score?: number;
    status: string;
    assigned_by: {
      name: string;
      role: string;
    };
  }>;
  
  // HR Questionnaire - can be either array or single object
  hrQuestionnaire?: Array<{
    _id: string;
    overallScore?: number;
    status: string;
    assigned_by: {
      name: string;
      role: string;
    };
  }> | {
    _id: string;
    overallScore?: number;
    status: string;
    assigned_by?: {
      name: string;
      role: string;
    };
  };
  
  interviews?: Array<{
    _id: string;
    title: string;
    scheduled_at: string;
    end_time: string;
    type: 'online' | 'offline';
    meeting_link?: string;
    address?: string;
    platform?: string;
    status: string;
    canJoinMeeting?: boolean;
    interviewers: Array<{
      _id: string;
      name: string;
      role: string;
    }>;
    remarks?: Array<{
      _id: string;
      provider: {
        _id: string;
        name: string;
        role: string;
      };
      remark: string;
      created_at: string;
    }>;
  }>;
  
  feedbacks?: Array<{
    _id: string;
    feedback_provider: {
      name: string;
      role: string;
    };
    content: string;
    feedback_type: string;
    createdAt: string;
  }>;
  
  stage_history?: Array<{
    _id: string;
    from_stage?: string;
    to_stage: string;
    changed_by?: {
      _id: string;
      name: string;
      role: string;
    };
    remarks: string;
    changed_at: string;
  }>;
}

export interface ManagerStats {
  total_candidates: number;
  active_candidates: number;
  interviewed_candidates: number;
  pending_feedback_candidates: number;
}

export interface ManagerInterview {
  _id: string;
  title: string;
  candidate: {
    _id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    profile_photo_url?: { url: string };
    applied_job: { name: string };
  };
  scheduled_at: string;
  end_time: string;
  type: 'online' | 'offline';
  meeting_link?: string;
  address?: string;
  platform?: string;
  status: string;
  can_join?: boolean;
  interviewers: Array<{
    name: string;
    role: string;
  }>;
}

export type ActionType = 'feedback' | 'hire' | 'reject' | 'stage' | 'hold';

export interface ActionModalState {
  open: boolean;
  candidate: ManagerCandidate | null;
  type: ActionType | '';
  loading: boolean;
}

