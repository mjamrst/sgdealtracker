export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "admin" | "founder";
export type MemberRole = "founder" | "team";
export type ProspectFunction = "marketing" | "insights" | "partnerships" | "other";
export type ProspectStage =
  | "new"
  | "intro_made"
  | "responded_yes"
  | "responded_no"
  | "meeting_scheduled"
  | "demo_completed_yes"
  | "demo_completed_no"
  | "proposal_sent"
  | "closed_won"
  | "closed_lost";
export type MaterialType = "pitch_deck" | "trend_report" | "other";
export type ActivityType =
  | "stage_change"
  | "note_added"
  | "material_uploaded"
  | "prospect_created"
  | "prospect_updated";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          role: UserRole;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          role?: UserRole;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          role?: UserRole;
          created_at?: string;
        };
      };
      startups: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          category: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          category?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          category?: string | null;
          created_at?: string;
        };
      };
      startup_members: {
        Row: {
          id: string;
          startup_id: string;
          user_id: string;
          role: MemberRole;
          created_at: string;
        };
        Insert: {
          id?: string;
          startup_id: string;
          user_id: string;
          role?: MemberRole;
          created_at?: string;
        };
        Update: {
          id?: string;
          startup_id?: string;
          user_id?: string;
          role?: MemberRole;
          created_at?: string;
        };
      };
      products: {
        Row: {
          id: string;
          startup_id: string;
          name: string;
          description: string | null;
          pricing: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          startup_id: string;
          name: string;
          description?: string | null;
          pricing?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          startup_id?: string;
          name?: string;
          description?: string | null;
          pricing?: string | null;
          created_at?: string;
        };
      };
      prospects: {
        Row: {
          id: string;
          startup_id: string;
          company_name: string;
          contact_name: string | null;
          contact_email: string | null;
          industry: string | null;
          function: ProspectFunction;
          estimated_value: number | null;
          stage: ProspectStage;
          notes: string | null;
          next_action: string | null;
          next_action_due: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          startup_id: string;
          company_name: string;
          contact_name?: string | null;
          contact_email?: string | null;
          industry?: string | null;
          function?: ProspectFunction;
          estimated_value?: number | null;
          stage?: ProspectStage;
          notes?: string | null;
          next_action?: string | null;
          next_action_due?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          startup_id?: string;
          company_name?: string;
          contact_name?: string | null;
          contact_email?: string | null;
          industry?: string | null;
          function?: ProspectFunction;
          estimated_value?: number | null;
          stage?: ProspectStage;
          notes?: string | null;
          next_action?: string | null;
          next_action_due?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      materials: {
        Row: {
          id: string;
          startup_id: string;
          name: string;
          type: MaterialType;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          startup_id: string;
          name: string;
          type?: MaterialType;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          startup_id?: string;
          name?: string;
          type?: MaterialType;
          notes?: string | null;
          created_at?: string;
        };
      };
      material_versions: {
        Row: {
          id: string;
          material_id: string;
          version_number: number;
          file_path: string;
          file_name: string;
          uploaded_by: string;
          uploaded_at: string;
        };
        Insert: {
          id?: string;
          material_id: string;
          version_number: number;
          file_path: string;
          file_name: string;
          uploaded_by: string;
          uploaded_at?: string;
        };
        Update: {
          id?: string;
          material_id?: string;
          version_number?: number;
          file_path?: string;
          file_name?: string;
          uploaded_by?: string;
          uploaded_at?: string;
        };
      };
      activity_log: {
        Row: {
          id: string;
          startup_id: string;
          prospect_id: string | null;
          user_id: string;
          action_type: ActivityType;
          description: string;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          startup_id: string;
          prospect_id?: string | null;
          user_id: string;
          action_type: ActivityType;
          description: string;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          startup_id?: string;
          prospect_id?: string | null;
          user_id?: string;
          action_type?: ActivityType;
          description?: string;
          metadata?: Json | null;
          created_at?: string;
        };
      };
      invites: {
        Row: {
          id: string;
          email: string;
          startup_id: string;
          role: MemberRole;
          token: string;
          invited_by: string;
          expires_at: string;
          accepted_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          startup_id: string;
          role?: MemberRole;
          token?: string;
          invited_by: string;
          expires_at?: string;
          accepted_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          startup_id?: string;
          role?: MemberRole;
          token?: string;
          invited_by?: string;
          expires_at?: string;
          accepted_at?: string | null;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      user_role: UserRole;
      member_role: MemberRole;
      prospect_function: ProspectFunction;
      prospect_stage: ProspectStage;
      material_type: MaterialType;
      activity_type: ActivityType;
    };
  };
}

// Helper types for easier usage
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Startup = Database["public"]["Tables"]["startups"]["Row"];
export type StartupMember = Database["public"]["Tables"]["startup_members"]["Row"];
export type Product = Database["public"]["Tables"]["products"]["Row"];
export type Prospect = Database["public"]["Tables"]["prospects"]["Row"];
export type Material = Database["public"]["Tables"]["materials"]["Row"];
export type MaterialVersion = Database["public"]["Tables"]["material_versions"]["Row"];
export type ActivityLog = Database["public"]["Tables"]["activity_log"]["Row"];
export type Invite = Database["public"]["Tables"]["invites"]["Row"];
