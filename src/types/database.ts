/**
 * RettStat Database Types v2
 * Generated from Supabase schema v2
 * Complete database structure for EMS shift management
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

// ============================================================================
// ENUMS
// ============================================================================

export type UserRole = "admin" | "manager" | "member";
export type AssignmentType = "station" | "vehicle" | "team" | "other";
export type EventStatus = "planned" | "confirmed" | "in_progress" | "completed" | "cancelled";
export type RegistrationStatus = "registered" | "confirmed" | "attended" | "cancelled" | "no_show";
export type NewsCategory =
  | "general"
  | "emergency"
  | "training"
  | "event"
  | "maintenance"
  | "policy";
export type NewsPriority = "low" | "normal" | "high" | "urgent";

// ============================================================================
// DATABASE INTERFACE
// ============================================================================

export interface Database {
  public: {
    Tables: {
      // ======================================================================
      // CORE TABLES
      // ======================================================================

      units: {
        Row: {
          id: string;
          name: string;
          parent_unit_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          parent_unit_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          parent_unit_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };

      profiles: {
        Row: {
          id: string;
          email: string;
          first_name: string | null;
          last_name: string | null;
          service_id: string | null;
          role: UserRole;
          avatar_url: string | null;
          phone: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          first_name?: string | null;
          last_name?: string | null;
          service_id?: string | null;
          role?: UserRole;
          avatar_url?: string | null;
          phone?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          first_name?: string | null;
          last_name?: string | null;
          service_id?: string | null;
          role?: UserRole;
          avatar_url?: string | null;
          phone?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };

      // ======================================================================
      // CATEGORY TABLES (Master Data)
      // ======================================================================

      assignment_categories: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          icon: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          icon?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          icon?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };

      qualification_categories: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          icon: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          icon?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          icon?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };

      vehicle_types: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          icon: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          icon?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          icon?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };

      absence_categories: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          icon: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          icon?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          icon?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };

      tour_types: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          icon: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          icon?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          icon?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };

      event_categories: {
        Row: {
          id: string;
          name: string;
          order: number;
          icon: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          order?: number;
          icon?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          order?: number;
          icon?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };

      // ======================================================================
      // ENTITY TABLES
      // ======================================================================

      assignments: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          category_id: string | null;
          icon: string | null;
          type: AssignmentType;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          category_id?: string | null;
          icon?: string | null;
          type: AssignmentType;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          category_id?: string | null;
          icon?: string | null;
          type?: AssignmentType;
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
          category_id: string | null;
          level: number | null;
          icon: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          abbreviation?: string | null;
          category_id?: string | null;
          level?: number | null;
          icon?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          abbreviation?: string | null;
          category_id?: string | null;
          level?: number | null;
          icon?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };

      vehicles: {
        Row: {
          id: string;
          vehicle_type_id: string;
          call_sign: string;
          primary_unit_id: string;
          secondary_unit_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          vehicle_type_id: string;
          call_sign: string;
          primary_unit_id: string;
          secondary_unit_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          vehicle_type_id?: string;
          call_sign?: string;
          primary_unit_id?: string;
          secondary_unit_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };

      absences: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          category_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          category_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          category_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };

      event_groups: {
        Row: {
          id: string;
          event_category_id: string | null;
          name: string;
          order: number;
          icon: string | null;
          color: string | null;
          is_admin_group: boolean;
          is_break_group: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          event_category_id?: string | null;
          name: string;
          order?: number;
          icon?: string | null;
          color?: string | null;
          is_admin_group?: boolean;
          is_break_group?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          event_category_id?: string | null;
          name?: string;
          order?: number;
          icon?: string | null;
          color?: string | null;
          is_admin_group?: boolean;
          is_break_group?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };

      // ======================================================================
      // USER RELATIONSHIP TABLES
      // ======================================================================

      user_qualifications: {
        Row: {
          id: string;
          user_id: string;
          qualification_id: string;
          obtained_date: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          qualification_id: string;
          obtained_date: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          qualification_id?: string;
          obtained_date?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };

      user_assignments: {
        Row: {
          id: string;
          user_id: string;
          assignment_id: string;
          unit_id: string;
          assigned_date: string;
          is_primary: boolean;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          assignment_id: string;
          unit_id: string;
          assigned_date?: string;
          is_primary?: boolean;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          assignment_id?: string;
          unit_id?: string;
          assigned_date?: string;
          is_primary?: boolean;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };

      user_absences: {
        Row: {
          id: string;
          user_assignment_id: string;
          absence_id: string;
          start_date: string;
          end_date: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_assignment_id: string;
          absence_id: string;
          start_date: string;
          end_date?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_assignment_id?: string;
          absence_id?: string;
          start_date?: string;
          end_date?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };

      // ======================================================================
      // SHIFTPLAN TABLES
      // ======================================================================

      shiftplans: {
        Row: {
          id: string;
          unit_id: string;
          shift_lead_id: string;
          start_time: string;
          end_time: string;
          notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          unit_id: string;
          shift_lead_id: string;
          start_time: string;
          end_time: string;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          unit_id?: string;
          shift_lead_id?: string;
          start_time?: string;
          end_time?: string;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };

      tours: {
        Row: {
          id: string;
          shiftplan_id: string;
          tour_type_id: string | null;
          vehicle_id: string | null;
          name: string | null;
          start_time: string;
          end_time: string;
          driver_id: string | null;
          lead_id: string | null;
          student_id: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          shiftplan_id: string;
          tour_type_id?: string | null;
          vehicle_id?: string | null;
          name?: string | null;
          start_time: string;
          end_time: string;
          driver_id?: string | null;
          lead_id?: string | null;
          student_id?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          shiftplan_id?: string;
          tour_type_id?: string | null;
          vehicle_id?: string | null;
          name?: string | null;
          start_time?: string;
          end_time?: string;
          driver_id?: string | null;
          lead_id?: string | null;
          student_id?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };

      // ======================================================================
      // EVENT TABLES
      // ======================================================================

      events: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          category_id: string | null;
          location: string | null;
          start_time: string;
          end_time: string;
          status: EventStatus;
          notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          category_id?: string | null;
          location?: string | null;
          start_time: string;
          end_time: string;
          status?: EventStatus;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          category_id?: string | null;
          location?: string | null;
          start_time?: string;
          end_time?: string;
          status?: EventStatus;
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
          group_id: string | null;
          name: string;
          description: string | null;
          icon: string | null;
          minimum_qualification_ids: string[] | null;
          is_group_lead: boolean;
          quantity_needed: number;
          quantity_filled: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          group_id?: string | null;
          name: string;
          description?: string | null;
          icon?: string | null;
          minimum_qualification_ids?: string[] | null;
          is_group_lead?: boolean;
          quantity_needed?: number;
          quantity_filled?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          group_id?: string | null;
          name?: string;
          description?: string | null;
          icon?: string | null;
          minimum_qualification_ids?: string[] | null;
          is_group_lead?: boolean;
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
          status: RegistrationStatus;
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
          status?: RegistrationStatus;
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
          status?: RegistrationStatus;
          registered_at?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };

      admin_events: {
        Row: {
          id: string;
          event_id: string;
          created_by: string;
          description: string;
          timestamp: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          created_by: string;
          description: string;
          timestamp: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          created_by?: string;
          description?: string;
          timestamp?: string;
          created_at?: string;
        };
      };

      // ======================================================================
      // NEWS & STATISTICS TABLES
      // ======================================================================

      news: {
        Row: {
          id: string;
          title: string;
          content: string;
          category: NewsCategory;
          priority: NewsPriority;
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
          category?: NewsCategory;
          priority?: NewsPriority;
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
          category?: NewsCategory;
          priority?: NewsPriority;
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
          obtained_date: string;
          days_since_obtained: number;
        }[];
      };
    };
  };
}

// ============================================================================
// HELPER TYPE EXPORTS
// ============================================================================

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];
export type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

export type Unit = Database["public"]["Tables"]["units"]["Row"];
export type UnitInsert = Database["public"]["Tables"]["units"]["Insert"];
export type UnitUpdate = Database["public"]["Tables"]["units"]["Update"];

export type AssignmentCategory = Database["public"]["Tables"]["assignment_categories"]["Row"];
export type AssignmentCategoryInsert =
  Database["public"]["Tables"]["assignment_categories"]["Insert"];
export type AssignmentCategoryUpdate =
  Database["public"]["Tables"]["assignment_categories"]["Update"];

export type QualificationCategory = Database["public"]["Tables"]["qualification_categories"]["Row"];
export type QualificationCategoryInsert =
  Database["public"]["Tables"]["qualification_categories"]["Insert"];
export type QualificationCategoryUpdate =
  Database["public"]["Tables"]["qualification_categories"]["Update"];

export type VehicleType = Database["public"]["Tables"]["vehicle_types"]["Row"];
export type VehicleTypeInsert = Database["public"]["Tables"]["vehicle_types"]["Insert"];
export type VehicleTypeUpdate = Database["public"]["Tables"]["vehicle_types"]["Update"];

export type AbsenceCategory = Database["public"]["Tables"]["absence_categories"]["Row"];
export type AbsenceCategoryInsert = Database["public"]["Tables"]["absence_categories"]["Insert"];
export type AbsenceCategoryUpdate = Database["public"]["Tables"]["absence_categories"]["Update"];

export type TourType = Database["public"]["Tables"]["tour_types"]["Row"];
export type TourTypeInsert = Database["public"]["Tables"]["tour_types"]["Insert"];
export type TourTypeUpdate = Database["public"]["Tables"]["tour_types"]["Update"];

export type EventCategory = Database["public"]["Tables"]["event_categories"]["Row"];
export type EventCategoryInsert = Database["public"]["Tables"]["event_categories"]["Insert"];
export type EventCategoryUpdate = Database["public"]["Tables"]["event_categories"]["Update"];

export type Assignment = Database["public"]["Tables"]["assignments"]["Row"];
export type AssignmentInsert = Database["public"]["Tables"]["assignments"]["Insert"];
export type AssignmentUpdate = Database["public"]["Tables"]["assignments"]["Update"];

export type Qualification = Database["public"]["Tables"]["qualifications"]["Row"];
export type QualificationInsert = Database["public"]["Tables"]["qualifications"]["Insert"];
export type QualificationUpdate = Database["public"]["Tables"]["qualifications"]["Update"];

export type Vehicle = Database["public"]["Tables"]["vehicles"]["Row"];
export type VehicleInsert = Database["public"]["Tables"]["vehicles"]["Insert"];
export type VehicleUpdate = Database["public"]["Tables"]["vehicles"]["Update"];

export type Absence = Database["public"]["Tables"]["absences"]["Row"];
export type AbsenceInsert = Database["public"]["Tables"]["absences"]["Insert"];
export type AbsenceUpdate = Database["public"]["Tables"]["absences"]["Update"];

export type EventGroup = Database["public"]["Tables"]["event_groups"]["Row"];
export type EventGroupInsert = Database["public"]["Tables"]["event_groups"]["Insert"];
export type EventGroupUpdate = Database["public"]["Tables"]["event_groups"]["Update"];

export type UserQualification = Database["public"]["Tables"]["user_qualifications"]["Row"];
export type UserQualificationInsert = Database["public"]["Tables"]["user_qualifications"]["Insert"];
export type UserQualificationUpdate = Database["public"]["Tables"]["user_qualifications"]["Update"];

export type UserAssignment = Database["public"]["Tables"]["user_assignments"]["Row"];
export type UserAssignmentInsert = Database["public"]["Tables"]["user_assignments"]["Insert"];
export type UserAssignmentUpdate = Database["public"]["Tables"]["user_assignments"]["Update"];

export type UserAbsence = Database["public"]["Tables"]["user_absences"]["Row"];
export type UserAbsenceInsert = Database["public"]["Tables"]["user_absences"]["Insert"];
export type UserAbsenceUpdate = Database["public"]["Tables"]["user_absences"]["Update"];

export type Shiftplan = Database["public"]["Tables"]["shiftplans"]["Row"];
export type ShiftplanInsert = Database["public"]["Tables"]["shiftplans"]["Insert"];
export type ShiftplanUpdate = Database["public"]["Tables"]["shiftplans"]["Update"];

export type Tour = Database["public"]["Tables"]["tours"]["Row"];
export type TourInsert = Database["public"]["Tables"]["tours"]["Insert"];
export type TourUpdate = Database["public"]["Tables"]["tours"]["Update"];

export type Event = Database["public"]["Tables"]["events"]["Row"];
export type EventInsert = Database["public"]["Tables"]["events"]["Insert"];
export type EventUpdate = Database["public"]["Tables"]["events"]["Update"];

export type EventPosition = Database["public"]["Tables"]["event_positions"]["Row"];
export type EventPositionInsert = Database["public"]["Tables"]["event_positions"]["Insert"];
export type EventPositionUpdate = Database["public"]["Tables"]["event_positions"]["Update"];

export type EventRegistration = Database["public"]["Tables"]["event_registrations"]["Row"];
export type EventRegistrationInsert = Database["public"]["Tables"]["event_registrations"]["Insert"];
export type EventRegistrationUpdate = Database["public"]["Tables"]["event_registrations"]["Update"];

export type AdminEvent = Database["public"]["Tables"]["admin_events"]["Row"];
export type AdminEventInsert = Database["public"]["Tables"]["admin_events"]["Insert"];
export type AdminEventUpdate = Database["public"]["Tables"]["admin_events"]["Update"];

export type News = Database["public"]["Tables"]["news"]["Row"];
export type NewsInsert = Database["public"]["Tables"]["news"]["Insert"];
export type NewsUpdate = Database["public"]["Tables"]["news"]["Update"];

export type MonthlyStatistics = Database["public"]["Tables"]["monthly_statistics"]["Row"];
export type MonthlyStatisticsInsert = Database["public"]["Tables"]["monthly_statistics"]["Insert"];
export type MonthlyStatisticsUpdate = Database["public"]["Tables"]["monthly_statistics"]["Update"];

// ============================================================================
// FUNCTION RETURN TYPES
// ============================================================================

export type UserStatistics = Database["public"]["Functions"]["get_user_statistics"]["Returns"][0];
export type UnitStatistics = Database["public"]["Functions"]["get_unit_statistics"]["Returns"][0];
export type ExpiringQualification =
  Database["public"]["Functions"]["check_expiring_qualifications"]["Returns"][0];
