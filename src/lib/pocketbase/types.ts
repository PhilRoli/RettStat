/**
 * PocketBase Collection Types
 * Auto-generated types for all collections
 */

// Base record type from PocketBase
export interface BaseRecord {
  id: string;
  created: string;
  updated: string;
}

// User record (built-in auth collection)
export interface UserRecord extends BaseRecord {
  email: string;
  verified: boolean;
  emailVisibility: boolean;
  username?: string;
}

// Profile
export interface ProfileRecord extends BaseRecord {
  user: string; // relation to users
  first_name?: string | null;
  last_name?: string | null;
  phone?: string;
  avatar?: string; // file field
  service_id?: string;
  is_active: boolean;
  // Expanded fields from user relation
  email?: string; // From expanded user
  avatar_url?: string; // Computed/legacy field
  notification_preferences?: {
    email: {
      shifts: boolean;
      events: boolean;
      news: boolean;
    };
    push: {
      shifts: boolean;
      events: boolean;
      news: boolean;
    };
  };
}

// Unit
export interface UnitRecord extends BaseRecord {
  name: string;
  parent_unit?: string; // relation to units (self-reference)
  unit_type: "organization" | "station" | "group";
  description?: string;
}

// Vehicle Type
export interface VehicleTypeRecord extends BaseRecord {
  name: string;
  description?: string;
  required_qualifications: string[]; // relation to qualification_categories (multiple)
}

// Vehicle
export interface VehicleRecord extends BaseRecord {
  call_sign: string;
  vehicle_type: string; // relation to vehicle_types
  unit: string; // relation to units
  status: "active" | "maintenance" | "inactive";
  registration_number?: string;
}

// Assignment Category
export interface AssignmentCategoryRecord extends BaseRecord {
  name: string;
  color: string;
  description?: string;
  sort_order: number;
}

// Assignment
export interface AssignmentRecord extends BaseRecord {
  title: string;
  category: string; // relation to assignment_categories
  unit: string; // relation to units
  start_date: string;
  end_date?: string;
  description?: string;
  location?: string;
  max_participants?: number;
}

// User Assignment (junction table)
export interface UserAssignmentRecord extends BaseRecord {
  user: string; // relation to users
  assignment: string; // relation to assignments
  status: "pending" | "confirmed" | "declined";
  role?: string;
}

// Qualification Category
export interface QualificationCategoryRecord extends BaseRecord {
  name: string;
  description?: string;
  sort_order: number;
}

// Qualification
export interface QualificationRecord extends BaseRecord {
  name: string;
  category: string; // relation to qualification_categories
  description?: string;
  validity_months?: number;
}

// User Qualification (junction table)
export interface UserQualificationRecord extends BaseRecord {
  user: string; // relation to users
  qualification: string; // relation to qualifications
  obtained_date: string;
  expiry_date?: string;
  certificate_number?: string;
}

// Absence Category
export interface AbsenceCategoryRecord extends BaseRecord {
  name: string;
  color: string;
  requires_approval: boolean;
  description?: string;
}

// Absence
export interface AbsenceRecord extends BaseRecord {
  user: string; // relation to users
  category: string; // relation to absence_categories
  start_date: string;
  end_date: string;
  reason?: string;
  status: "pending" | "approved" | "rejected";
  approved_by?: string; // relation to users
}

// User Absence (for tracking)
export interface UserAbsenceRecord extends BaseRecord {
  user: string; // relation to users
  absence: string; // relation to absences
  notified: boolean;
}

// Tour Type
export interface TourTypeRecord extends BaseRecord {
  name: string;
  description?: string;
  default_duration_hours?: number;
}

// Shiftplan
export interface ShiftplanRecord extends BaseRecord {
  date: string;
  unit: string; // relation to units
  shift_lead?: string; // relation to profiles
  start_time: string; // shift start time
  end_time: string; // shift end time
  notes?: string;
  status: "draft" | "published" | "completed";
  created_by?: string; // relation to users
}

// Tour
export interface TourRecord extends BaseRecord {
  shiftplan: string; // relation to shiftplans
  vehicle?: string; // relation to vehicles (optional)
  tour_type?: string; // relation to tour_types
  driver?: string; // relation to profiles
  lead?: string; // relation to profiles
  student?: string; // relation to profiles
  name?: string; // tour name/identifier
  start_time: string;
  end_time: string;
  notes?: string;
}

// Permission
export interface PermissionRecord extends BaseRecord {
  name: string;
  description?: string;
  resource: string; // e.g., "shiftplans", "users", "vehicles"
  action: string; // e.g., "create", "read", "update", "delete"
}

// User Permission
export interface UserPermissionRecord extends BaseRecord {
  user: string; // relation to users
  permission: string; // relation to permissions
  unit?: string; // relation to units (permission scoped to unit)
  granted_by: string; // relation to users
  granted_at: string;
}

// Assignment Default Permission
export interface AssignmentDefaultPermissionRecord extends BaseRecord {
  assignment_category: string; // relation to assignment_categories
  permission: string; // relation to permissions
}

// News
export interface NewsRecord extends BaseRecord {
  title: string;
  content: string;
  author: string; // relation to users
  unit?: string; // relation to units
  published_at?: string;
  is_pinned: boolean;
  expires_at?: string;
}

// News Attachment
export interface NewsAttachmentRecord extends BaseRecord {
  news: string; // relation to news
  file: string; // file field
  filename: string;
  file_size: number;
}

// News Read Status
export interface NewsReadStatusRecord extends BaseRecord {
  news: string; // relation to news
  user: string; // relation to users
  read_at: string;
}

// Quick Link
export interface QuickLinkRecord extends BaseRecord {
  title: string;
  url: string;
  icon?: string;
  sort_order: number;
  unit?: string; // relation to units
  is_active: boolean;
}

// Collection type map for type-safe queries
export interface CollectionRecords {
  users: UserRecord;
  profiles: ProfileRecord;
  units: UnitRecord;
  vehicle_types: VehicleTypeRecord;
  vehicles: VehicleRecord;
  assignment_categories: AssignmentCategoryRecord;
  assignments: AssignmentRecord;
  user_assignments: UserAssignmentRecord;
  qualification_categories: QualificationCategoryRecord;
  qualifications: QualificationRecord;
  user_qualifications: UserQualificationRecord;
  absence_categories: AbsenceCategoryRecord;
  absences: AbsenceRecord;
  user_absences: UserAbsenceRecord;
  tour_types: TourTypeRecord;
  shiftplans: ShiftplanRecord;
  tours: TourRecord;
  permissions: PermissionRecord;
  user_permissions: UserPermissionRecord;
  assignment_default_permissions: AssignmentDefaultPermissionRecord;
  news: NewsRecord;
  news_attachments: NewsAttachmentRecord;
  news_read_status: NewsReadStatusRecord;
  quick_links: QuickLinkRecord;
}

// Helper type for getting record type by collection name
export type RecordType<T extends keyof CollectionRecords> = CollectionRecords[T];
