export type Stage = 'registered' | 'hr' | 'assessment' | 'tech' | 'manager' | 'feedback';
export interface User {
  _id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  date_of_birth?: string; // ISO date string
  gender: "male" | "female" | "other";
  address?: string;
  portfolio_url?: string;
  profile_photo_url: {
    url: string;
    publicId: string;
  };
  applied_job?: JobItem | null;
  documents: DocumentItem[];
  current_stage?: Stage;
  email_verified: boolean;
  registration_date?: string; // ISO date string
  status?: string;
  stage_history?: StageHistory []; // Add a type if you use stage history in UI
} 

export interface LoginResponse {
  success: true;
  user: User;
}

export interface RegisterDataSummary {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
}


export interface RegisterResponse {
  message: string;
  data: RegisterDataSummary;
  success: true;
}


// Payload structure for login
export interface LoginData {
  email: string;
  password: string;
}

// Payload structure for registration
export interface RegisterData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string; // International format
  date_of_birth: string; // "YYYY-MM-DD"
  gender: "male" | "female" | "other";
  address: string;
  profile_photo_url: string; // Cloudinary URL
  applied_job: string;
  documents: Array<{
    document_type: string;
    document_url: string;
  }>;
  password: string;
}


export interface StageHistory {
  candidate: string;
  from_stage?: Stage;
  to_stage: Stage;
  changed_by?: string;
  action?: string;
  remarks?: string;
  changed_at?: string;
}

export interface DocumentItem {
  _id: string;
  candidate: string;
  document_type: string;
  document_url: string;
  uploaded_at: string; // ISO date string
  public_id?: string;
}

export interface JobItem {
  _id: string;
  name: string;
  description?: string;
}


