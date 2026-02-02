/**
 * RettStat Database Types
 * Auto-generated from Supabase schema
 * Phase 4: Complete database structure for EMS shift management
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          role: "admin" | "manager" | "member";
          avatar_url: string | null;
          phone: string | null;
          date_of_birth: string | null;
          address: string | null;
          city: string | null;
          postal_code: string | null;
          emergency_contact_name: string | null;
          emergency_contact_phone: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          role?: "admin" | "manager" | "member";
          avatar_url?: string | null;
          phone?: string | null;
          date_of_birth?: string | null;
          address?: string | null;
          city?: string | null;
          postal_code?: string | null;
          emergency_contact_name?: string | null;
          emergency_contact_phone?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          role?: "admin" | "manager" | "member";
          avatar_url?: string | null;
          phone?: string | null;
          date_of_birth?: string | null;
          address?: string | null;
          city?: string | null;
          postal_code?: string | null;
          emergency_contact_name?: string | null;
          emergency_contact_phone?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      qualifications: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          abbreviation: string | null;
          color: string | null;
          requires_renewal: boolean;
          renewal_period_months: number | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          abbreviation?: string | null;
          color?: string | null;
          requires_renewal?: boolean;
          renewal_period_months?: number | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          abbreviation?: string | null;
          color?: string | null;
          requires_renewal?: boolean;
          renewal_period_months?: number | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_qualifications: {
        Row: {
          id: string;
          user_id: string;
          qualification_id: string;
          obtained_date: string;
          expiration_date: string | null;
          certificate_number: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          qualification_id: string;
          obtained_date: string;
          expiration_date?: string | null;
          certificate_number?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          qualification_id?: string;
          obtained_date?: string;
          expiration_date?: string | null;
          certificate_number?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      assignments: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          type: "station" | "vehicle" | "team" | "other";
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          type: "station" | "vehicle" | "team" | "other";
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          type?: "station" | "vehicle" | "team" | "other";
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_assignments: {
        Row: {
          id: string;
          user_id: string;
          assignment_id: string;
          assigned_date: string;
          end_date: string | null;
          is_primary: boolean;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          assignment_id: string;
          assigned_date?: string;
          end_date?: string | null;
          is_primary?: boolean;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          assignment_id?: string;
          assigned_date?: string;
          end_date?: string | null;
          is_primary?: boolean;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      shift_types: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          default_start_time: string | null;
          default_end_time: string | null;
          default_duration_hours: number | null;
          color: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          default_start_time?: string | null;
          default_end_time?: string | null;
          default_duration_hours?: number | null;
          color?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          default_start_time?: string | null;
          default_end_time?: string | null;
          default_duration_hours?: number | null;
          color?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      shifts: {
        Row: {
          id: string;
          user_id: string;
          shift_type_id: string | null;
          assignment_id: string | null;
          start_time: string;
          end_time: string;
          status: "scheduled" | "confirmed" | "completed" | "cancelled" | "no_show";
          notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          shift_type_id?: string | null;
          assignment_id?: string | null;
          start_time: string;
          end_time: string;
          status?: "scheduled" | "confirmed" | "completed" | "cancelled" | "no_show";
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          shift_type_id?: string | null;
          assignment_id?: string | null;
          start_time?: string;
          end_time?: string;
          status?: "scheduled" | "confirmed" | "completed" | "cancelled" | "no_show";
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      events: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          event_type: "emergency" | "training" | "community" | "competition" | "other";
          location: string | null;
          start_time: string;
          end_time: string;
          status: "planned" | "confirmed" | "in_progress" | "completed" | "cancelled";
          max_participants: number | null;
          registration_deadline: string | null;
          notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          event_type: "emergency" | "training" | "community" | "competition" | "other";
          location?: string | null;
          start_time: string;
          end_time: string;
          status?: "planned" | "confirmed" | "in_progress" | "completed" | "cancelled";
          max_participants?: number | null;
          registration_deadline?: string | null;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          event_type?: "emergency" | "training" | "community" | "competition" | "other";
          location?: string | null;
          start_time?: string;
          end_time?: string;
          status?: "planned" | "confirmed" | "in_progress" | "completed" | "cancelled";
          max_participants?: number | null;
          registration_deadline?: string | null;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      event_positions: {
        Row: {
          id: string;
          event_id: string;
          name: string;
          description: string | null;
          required_qualification_id: string | null;
          quantity_needed: number;
          quantity_filled: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          name: string;
          description?: string | null;
          required_qualification_id?: string | null;
          quantity_needed?: number;
          quantity_filled?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          name?: string;
          description?: string | null;
          required_qualification_id?: string | null;
          quantity_needed?: number;
          quantity_filled?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      event_registrations: {
        Row: {
          id: string;
          event_id: string;
          event_position_id: string | null;
          user_id: string;
          status: "registered" | "confirmed" | "attended" | "cancelled" | "no_show";
          registered_at: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          event_position_id?: string | null;
          user_id: string;
          status?: "registered" | "confirmed" | "attended" | "cancelled" | "no_show";
          registered_at?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          event_position_id?: string | null;
          user_id?: string;
          status?: "registered" | "confirmed" | "attended" | "cancelled" | "no_show";
          registered_at?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      news: {
        Row: {
          id: string;
          title: string;
          content: string;
          category: "general" | "emergency" | "training" | "event" | "maintenance" | "policy";
          priority: "low" | "normal" | "high" | "urgent";
          published_at: string | null;
          expires_at: string | null;
          is_pinned: boolean;
          author_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          content: string;
          category?: "general" | "emergency" | "training" | "event" | "maintenance" | "policy";
          priority?: "low" | "normal" | "high" | "urgent";
          published_at?: string | null;
          expires_at?: string | null;
          is_pinned?: boolean;
          author_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          content?: string;
          category?: "general" | "emergency" | "training" | "event" | "maintenance" | "policy";
          priority?: "low" | "normal" | "high" | "urgent";
          published_at?: string | null;
          expires_at?: string | null;
          is_pinned?: boolean;
          author_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      monthly_statistics: {
        Row: {
          id: string;
          user_id: string;
          year: number;
          month: number;
          total_shifts: number;
          total_hours: number;
          total_events: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          year: number;
          month: number;
          total_shifts?: number;
          total_hours?: number;
          total_events?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          year?: number;
          month?: number;
          total_shifts?: number;
          total_hours?: number;
          total_events?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Functions: {
      get_user_statistics: {
        Args: {
          p_user_id: string;
          p_start_date?: string | null;
          p_end_date?: string | null;
        };
        Returns: {
          total_shifts: number;
          total_hours: number;
          total_events: number;
          average_shift_hours: number;
        }[];
      };
      get_unit_statistics: {
        Args: {
          p_start_date?: string | null;
          p_end_date?: string | null;
        };
        Returns: {
          total_users: number;
          total_shifts: number;
          total_hours: number;
          total_events: number;
          average_shifts_per_user: number;
          average_hours_per_user: number;
        }[];
      };
      check_expiring_qualifications: {
        Args: {
          p_days_ahead?: number;
        };
        Returns: {
          user_id: string;
          user_name: string;
          qualification_name: string;
          expiration_date: string;
          days_until_expiration: number;
        }[];
      };
    };
  };
}

// Helper types for easier imports
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];
export type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

export type Qualification = Database["public"]["Tables"]["qualifications"]["Row"];
export type QualificationInsert = Database["public"]["Tables"]["qualifications"]["Insert"];
export type QualificationUpdate = Database["public"]["Tables"]["qualifications"]["Update"];

export type UserQualification = Database["public"]["Tables"]["user_qualifications"]["Row"];
export type UserQualificationInsert = Database["public"]["Tables"]["user_qualifications"]["Insert"];
export type UserQualificationUpdate = Database["public"]["Tables"]["user_qualifications"]["Update"];

export type Assignment = Database["public"]["Tables"]["assignments"]["Row"];
export type AssignmentInsert = Database["public"]["Tables"]["assignments"]["Insert"];
export type AssignmentUpdate = Database["public"]["Tables"]["assignments"]["Update"];

export type UserAssignment = Database["public"]["Tables"]["user_assignments"]["Row"];
export type UserAssignmentInsert = Database["public"]["Tables"]["user_assignments"]["Insert"];
export type UserAssignmentUpdate = Database["public"]["Tables"]["user_assignments"]["Update"];

export type ShiftType = Database["public"]["Tables"]["shift_types"]["Row"];
export type ShiftTypeInsert = Database["public"]["Tables"]["shift_types"]["Insert"];
export type ShiftTypeUpdate = Database["public"]["Tables"]["shift_types"]["Update"];

export type Shift = Database["public"]["Tables"]["shifts"]["Row"];
export type ShiftInsert = Database["public"]["Tables"]["shifts"]["Insert"];
export type ShiftUpdate = Database["public"]["Tables"]["shifts"]["Update"];

export type Event = Database["public"]["Tables"]["events"]["Row"];
export type EventInsert = Database["public"]["Tables"]["events"]["Insert"];
export type EventUpdate = Database["public"]["Tables"]["events"]["Update"];

export type EventPosition = Database["public"]["Tables"]["event_positions"]["Row"];
export type EventPositionInsert = Database["public"]["Tables"]["event_positions"]["Insert"];
export type EventPositionUpdate = Database["public"]["Tables"]["event_positions"]["Update"];

export type EventRegistration = Database["public"]["Tables"]["event_registrations"]["Row"];
export type EventRegistrationInsert = Database["public"]["Tables"]["event_registrations"]["Insert"];
export type EventRegistrationUpdate = Database["public"]["Tables"]["event_registrations"]["Update"];

export type News = Database["public"]["Tables"]["news"]["Row"];
export type NewsInsert = Database["public"]["Tables"]["news"]["Insert"];
export type NewsUpdate = Database["public"]["Tables"]["news"]["Update"];

export type MonthlyStatistic = Database["public"]["Tables"]["monthly_statistics"]["Row"];
export type MonthlyStatisticInsert = Database["public"]["Tables"]["monthly_statistics"]["Insert"];
export type MonthlyStatisticUpdate = Database["public"]["Tables"]["monthly_statistics"]["Update"];

// Enum types for easier use
export type UserRole = Database["public"]["Tables"]["profiles"]["Row"]["role"];
export type AssignmentType = Database["public"]["Tables"]["assignments"]["Row"]["type"];
export type ShiftStatus = Database["public"]["Tables"]["shifts"]["Row"]["status"];
export type EventType = Database["public"]["Tables"]["events"]["Row"]["event_type"];
export type EventStatus = Database["public"]["Tables"]["events"]["Row"]["status"];
export type EventRegistrationStatus =
  Database["public"]["Tables"]["event_registrations"]["Row"]["status"];
export type NewsCategory = Database["public"]["Tables"]["news"]["Row"]["category"];
export type NewsPriority = Database["public"]["Tables"]["news"]["Row"]["priority"];

// Function return types
export type UserStatistics = Database["public"]["Functions"]["get_user_statistics"]["Returns"][0];
export type UnitStatistics = Database["public"]["Functions"]["get_unit_statistics"]["Returns"][0];
export type ExpiringQualification =
  Database["public"]["Functions"]["check_expiring_qualifications"]["Returns"][0];
