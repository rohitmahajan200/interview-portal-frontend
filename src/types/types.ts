export interface User {
  _id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth: string; // ISO date string
  gender: "male" | "female" | "other";
  address: string;
  profile_photo_url: string;
  applied_role: string;
  documents: string[];
  current_stage: string;
  email_verified: boolean;
  registration_date: string; // ISO date string
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
  applied_role: string;
  documents: Array<{
    document_type: string;
    document_url: string;
  }>;
  password: string;
}