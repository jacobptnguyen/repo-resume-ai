// User Profile Types
export interface UserProfile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone: string;
  location?: string; // City, State
  linkedin_url?: string;
  github_url: string;
  portfolio_url?: string;
  signature_url: string;
  generations_used: number;
  generation_limit: number;
  generation_reset_date: string | null;
  created_at: string;
  updated_at: string;
}

// Education Entry Types
export interface EducationEntry {
  id: string;
  user_id: string;
  university: string;
  degree: string; // Degree type (e.g., B.S., M.S.)
  major?: string; // Major field of study (e.g., Computer Science)
  minor?: string; // Minor field of study (optional)
  location?: string; // School location (City, State)
  graduation_date: string; // ISO date string (can be expected or actual)
  gpa?: number;
  honors?: string; // Honors/distinctions (e.g., Dean's Honors List)
  coursework?: string; // Coursework as multi-line text (like work experience description)
  display_order: number;
  created_at: string;
}

// Work Experience Entry Types
export interface WorkExperienceEntry {
  id: string;
  user_id: string;
  company: string;
  job_title: string;
  start_date: string; // ISO date string
  end_date?: string | null; // ISO date string, null if current position
  description: string;
  display_order: number;
  created_at: string;
}

// GitHub Installation Types
export interface GitHubInstallation {
  id: string;
  user_id: string;
  installation_id: string;
  access_type: 'all' | 'selected';
  selected_repo_ids?: string[];
  access_token: string;
  token_expires_at: string | null;
  created_at: string;
  updated_at: string;
}

// Generation Request Types
export interface GenerationRequest {
  user_id: string;
  job_description: string;
  num_projects: number;
  font_size: number;
}

// Generation Response Types
export interface GenerationResponse {
  resume_html: string;
  cover_letter_html: string;
  selected_projects: SelectedProject[];
  extracted_skills: ExtractedSkills;
}

// Selected Project (from AI)
export interface SelectedProject {
  id: string;
  name: string;
  description: string;
  technologies: string[];
  url?: string;
}

// Extracted Skills (from AI)
export interface ExtractedSkills {
  languages: string[];
  frameworks: string[];
  tools: string[];
}

// Repository (from GitHub)
export interface Repository {
  id: string;
  name: string;
  description?: string;
  full_name: string;
  html_url: string;
  private: boolean;
}

