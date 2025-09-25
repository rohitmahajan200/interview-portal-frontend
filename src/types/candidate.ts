// src/types/candidate.ts
export interface CandidateDocument {
  _id: string;
  documenttype: string;
  documenturl: string;
  isVerified: boolean;
  uploadedat?: string;
  filename?: string;
  filepath?: string;
  mimetype?: string;
  size?: number;
}

export interface JobDescription {
  time?: string;
  country?: string;
  location?: string;
  expInYears?: string;
  salary?: string;
  jobId?: string;
}

export interface AppliedJob {
  _id: string;
  name: string;
  title?: string;
  description?: JobDescription;
  gradingParameters: string[];
  // Direct properties for backward compatibility
  location?: string;
  country?: string;
  expInYears?: string;
  salary?: string;
}

export interface InterviewType {
  _id: string;
  title?: string;
  status: string;
  scheduled_at?: string;
  type?: string;
  platform?: string;
  meeting_link?: string;
  canJoinMeeting?: boolean;
  interviewers?: Array<{
    _id: string;
    name: string;
  }>;
  remarks?: Array<{
    provider: {
      name: string;
    };
    remark: string;
    created_at: string;
  }>;
}

// HR Questionnaire Response interface
export interface HRQuestionnaireResponse {
  _id: string;
  overallScore: number;
  summary?: string;
}

// Assessment Response interface
export interface AssessmentResponse {
  _id: string;
  ai_score: number;
  total_score: number;
  status: string;
  evaluated_by?: {
    name: string;
  };
}

export interface ManagerCandidate {
  _id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  date_of_birth: string;
  gender: "male" | "female" | "other";
  address: string;
  current_stage: string;
  status: string;
  glory?: {
    [role: string]: {
      graderId?: string;
      graderName?: string;
      graderRole: "hr" | "manager" | "invigilator" | "admin";
      grades: { [parameter: string]: string };
      gradedAt: string;
    };
  };
  applied_job?: AppliedJob;
  profile_photo_url?: {
    url: string;
    publicId: string;
    _id: string;
  };
  portfolio_url?: string | null;
  documents?: CandidateDocument[];
  hired_docs?: CandidateDocument[];
  social_media_handles?: Record<string, string>;
  organizations?: Array<{
    name: string;
    appointment_letter?: string;
    relieving_letter?: string;
  }>;
  company_references?: Array<{
    company_name: string;
    email: string;
    phone: string;
  }>;
  hired_docs_present?: boolean;
  assessments?: Array<{
    _id: string;
    assigned_by: {
      _id: string;
      name: string;
      role: string;
    };
    due_at: string;
    status: string;
  }>;
  hrQuestionnaire?: string[];
  interviews?: InterviewType[];
  default_hr_responses?: Array<{
    question_text: string;
    response: string;
    input_type: string;
    _id: string;
  }>;
  stage_history?: string[];
  internal_feedback?: Array<{
    feedback_by: {
      _id: string;
      name: string;
      role: string;
    };
    feedback: string;
    _id: string;
    feedback_at: string;
  }>;
  shortlisted: boolean;
  email_verified: boolean;
  flagged_for_deletion: boolean;
  assigned_manager: boolean;
  registration_date: string;
  createdAt: string;
  updatedAt: string;
  last_login?: string;
  __v: number;
  progress_metrics?: {
    stages_completed: number;
    total_assessments: number;
    completed_interviews: number;
    pending_interviews: number;
    documents_uploaded: number;
    feedback_count: number;
    hr_questionnaire_completed: boolean;
    current_stage_duration: number;
  };
  _renderKey?: string;
}

export interface DetailedCandidate {
  _id: string;
  name: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  date_of_birth: string;
  gender: "male" | "female" | "other";
  address: string;
  current_stage: string;
  status: string;
  glory?: {
    [role: string]: {
      graderId?: string;
      graderName?: string;
      graderRole: "hr" | "manager" | "invigilator" | "admin";
      grades: { [parameter: string]: string };
      gradedAt: string;
    };
  };
  applied_job?: AppliedJob;
  profile_photo_url?: {
    url: string;
    publicId: string;
    _id: string;
  };
  portfolio_url?: string | null;
  documents: CandidateDocument[];
  hired_docs: CandidateDocument[];
  social_media_handles?: Record<string, string>;
  organizations?: Array<{
    name: string;
    appointment_letter?: string;
    relieving_letter?: string;
  }>;
  company_references?: Array<{
    company_name: string;
    email: string;
    phone: string;
  }>;
  hired_docs_present?: boolean;
  hrQuestionnaire: Array<{
    _id: string;
    assigned_by: {
      _id: string;
      name: string;
      role: string;
    };
    due_at: string;
    status: string;
  }>;
  hrQuestionnaireResponses?: HRQuestionnaireResponse[];
  assessmentResponses?: AssessmentResponse[];
  stage_history: Array<{
    _id: string;
    from_stage?: string;
    to_stage: string;
    changed_by?: string;
    action: string;
    remarks: string;
    changed_at: string;
  }>;
  interviews: Array<{
    _id: string;
    title?: string;
    status: string;
    scheduled_at?: string;
    type?: string;
    platform?: string;
    meeting_link?: string;
    canJoinMeeting?: boolean;
    interviewers?: Array<{
      _id: string;
      name: string;
    }>;
    remarks?: Array<{
      provider: {
        name: string;
      };
      remark: string;
      created_at: string;
    }>;
  }>;
  assessments?: Array<{
    _id: string;
    assigned_by: {
      _id: string;
      name: string;
      role: string;
    };
    due_at: string;
    status: string;
  }>;
  default_hr_responses?: Array<{
    question_text: string;
    response: string;
    input_type: string;
    _id: string;
  }>;
  internal_feedback?: Array<{
    feedback_by: {
      _id: string;
      name: string;
      role: string;
    };
    feedback: string;
    _id: string;
    feedback_at: string;
  }>;
  shortlisted: boolean;
  email_verified: boolean;
  flagged_for_deletion: boolean;
  assigned_manager: boolean;
  registration_date: string;
  createdAt: string;
  updatedAt: string;
  last_login?: string;
  __v: number;
  progress_metrics?: {
    stages_completed: number;
    total_assessments: number;
    completed_interviews: number;
    pending_interviews: number;
    documents_uploaded: number;
    feedback_count: number;
    hr_questionnaire_completed: boolean;
    current_stage_duration: number;
  };
}
