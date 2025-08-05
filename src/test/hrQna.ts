
// Frontend dummy data for HR questions based on the updated model

export const hrQuestions = [
  // Text input questions
  {
    _id: "64f8b7e65fcb3e001f356a80",
    question: "Tell us about yourself and your professional background.",
    tags: ["introduction", "background", "experience"],
    created_by: "64f8b8b35fcb3e001f356a88",
    created_at: "2024-12-01T10:00:00.000Z",
    input_type: "text" as const
  },
  {
    _id: "64f8b7e65fcb3e001f356a81",
    question: "Why are you interested in this position and our company?",
    tags: ["motivation", "company-fit", "interest"],
    created_by: "64f8b8b35fcb3e001f356a88",
    created_at: "2024-12-01T10:05:00.000Z",
    input_type: "text" as const
  },
  {
    _id: "64f8b7e65fcb3e001f356a82",
    question: "What are your salary expectations for this role?",
    tags: ["compensation", "expectations", "negotiation"],
    created_by: "64f8b8b35fcb3e001f356a88",
    created_at: "2024-12-01T10:10:00.000Z",
    input_type: "text" as const
  },
  {
    _id: "64f8b7e65fcb3e001f356a83",
    question: "Describe a challenging situation you faced at work and how you handled it.",
    tags: ["problem-solving", "challenges", "experience"],
    created_by: "64f8b8b35fcb3e001f356a88",
    created_at: "2024-12-01T10:15:00.000Z",
    input_type: "text" as const
  },
  {
    _id: "64f8b7e65fcb3e001f356a84",
    question: "What are your strengths and how do they relate to this role?",
    tags: ["strengths", "self-assessment", "job-fit"],
    created_by: "64f8b8b35fcb3e001f356a88",
    created_at: "2024-12-01T10:20:00.000Z",
    input_type: "text" as const
  },

  // Audio input questions
  {
    _id: "64f8b7e65fcb3e001f356a85",
    question: "Please introduce yourself in your own voice. Tell us about your career journey and what motivates you professionally.",
    tags: ["introduction", "voice", "personality", "motivation"],
    created_by: "64f8b8b35fcb3e001f356a89",
    created_at: "2024-12-01T11:00:00.000Z",
    input_type: "audio" as const
  },
  {
    _id: "64f8b7e65fcb3e001f356a86",
    question: "Describe your ideal work environment and team dynamics. What kind of workplace culture do you thrive in?",
    tags: ["culture-fit", "teamwork", "environment", "preferences"],
    created_by: "64f8b8b35fcb3e001f356a89",
    created_at: "2024-12-01T11:05:00.000Z",
    input_type: "audio" as const
  },
  {
    _id: "64f8b7e65fcb3e001f356a87",
    question: "Tell us about a time when you had to work under pressure. How do you manage stress and tight deadlines?",
    tags: ["pressure", "stress-management", "deadlines", "performance"],
    created_by: "64f8b8b35fcb3e001f356a89",
    created_at: "2024-12-01T11:10:00.000Z",
    input_type: "audio" as const
  },
  {
    _id: "64f8b7e65fcb3e001f356a88",
    question: "What are your long-term career goals and how does this position align with them?",
    tags: ["career-goals", "future-plans", "alignment", "growth"],
    created_by: "64f8b8b35fcb3e001f356a89",
    created_at: "2024-12-01T11:15:00.000Z",
    input_type: "audio" as const
  },
  {
    _id: "64f8b7e65fcb3e001f356a89",
    question: "How do you handle feedback and criticism? Can you give us an example?",
    tags: ["feedback", "growth-mindset", "adaptability", "professional-development"],
    created_by: "64f8b8b35fcb3e001f356a89",
    created_at: "2024-12-01T11:20:00.000Z",
    input_type: "audio" as const
  },

  // Date input questions
  {
    _id: "64f8b7e65fcb3e001f356a8a",
    question: "What is your earliest possible start date if selected for this position?",
    tags: ["availability", "start-date", "timeline", "logistics"],
    created_by: "64f8b8b35fcb3e001f356a90",
    created_at: "2024-12-01T12:00:00.000Z",
    input_type: "date" as const
  },
  {
    _id: "64f8b7e65fcb3e001f356a8b",
    question: "When did you complete your most recent educational qualification?",
    tags: ["education", "timeline", "qualification", "background"],
    created_by: "64f8b8b35fcb3e001f356a90",
    created_at: "2024-12-01T12:05:00.000Z",
    input_type: "date" as const
  },
  {
    _id: "64f8b7e65fcb3e001f356a8c",
    question: "What was the end date of your most recent employment?",
    tags: ["employment-history", "timeline", "experience", "background"],
    created_by: "64f8b8b35fcb3e001f356a90",
    created_at: "2024-12-01T12:10:00.000Z",
    input_type: "date" as const
  },
  {
    _id: "64f8b7e65fcb3e001f356a8d",
    question: "When would you be available for the final interview round?",
    tags: ["availability", "interview", "scheduling", "timeline"],
    created_by: "64f8b8b35fcb3e001f356a90",
    created_at: "2024-12-01T12:15:00.000Z",
    input_type: "date" as const
  },
  {
    _id: "64f8b7e65fcb3e001f356a8e",
    question: "When did you first start working in your current field?",
    tags: ["experience", "career-start", "timeline", "background"],
    created_by: "64f8b8b35fcb3e001f356a90",
    created_at: "2024-12-01T12:20:00.000Z",
    input_type: "date" as const
  }
];

// Type definition for frontend use
export interface HRQuestion {
  _id: string;
  question: string;
  tags?: string[];
  created_by?: string;
  created_at?: string;
  input_type: "text" | "audio" | "date";
}