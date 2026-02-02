/**
 * PocketBase Schema Configuration
 *
 * This file documents the PocketBase collections that replace the Supabase tables.
 * Collections are created through the PocketBase Admin UI at http://localhost:8090/_/
 *
 * To apply this schema:
 * 1. Start PocketBase: `./pocketbase/pocketbase serve`
 * 2. Open http://localhost:8090/_/
 * 3. Create collections as documented below
 *
 * Or use the PocketBase SDK to create collections programmatically (see scripts/setup-pocketbase-schema.ts)
 */

export const POCKETBASE_SCHEMA = {
  /**
   * CORE COLLECTIONS
   */

  // users - Built-in PocketBase auth collection (do not create manually)
  // Fields added to base: service_id, phone, is_active

  profiles: {
    name: "profiles",
    type: "base",
    schema: [
      {
        name: "user",
        type: "relation",
        required: true,
        options: { collectionId: "_pb_users_auth_", maxSelect: 1, cascadeDelete: true },
      },
      { name: "first_name", type: "text" },
      { name: "last_name", type: "text" },
      { name: "avatar", type: "file", options: { maxSelect: 1, maxSize: 5242880 } }, // 5MB
    ],
  },

  /**
   * ORGANIZATIONAL STRUCTURE
   */

  units: {
    name: "units",
    type: "base",
    schema: [
      { name: "name", type: "text", required: true },
      { name: "parent_unit", type: "relation", options: { collectionId: "units", maxSelect: 1 } },
    ],
  },

  /**
   * CATEGORY COLLECTIONS (Master Data)
   */

  vehicle_types: {
    name: "vehicle_types",
    type: "base",
    schema: [
      { name: "name", type: "text", required: true },
      { name: "description", type: "text" },
      { name: "icon", type: "text" },
      { name: "color", type: "text" }, // For calendar visualization
    ],
  },

  assignment_categories: {
    name: "assignment_categories",
    type: "base",
    schema: [
      { name: "name", type: "text", required: true },
      { name: "description", type: "text" },
      { name: "icon", type: "text" },
    ],
  },

  qualification_categories: {
    name: "qualification_categories",
    type: "base",
    schema: [
      { name: "name", type: "text", required: true },
      { name: "description", type: "text" },
      { name: "icon", type: "text" },
    ],
  },

  absence_categories: {
    name: "absence_categories",
    type: "base",
    schema: [
      { name: "name", type: "text", required: true },
      { name: "description", type: "text" },
      { name: "icon", type: "text" },
    ],
  },

  tour_types: {
    name: "tour_types",
    type: "base",
    schema: [
      { name: "name", type: "text", required: true },
      { name: "description", type: "text" },
      { name: "icon", type: "text" },
    ],
  },

  /**
   * ENTITY COLLECTIONS
   */

  assignments: {
    name: "assignments",
    type: "base",
    schema: [
      { name: "name", type: "text", required: true },
      {
        name: "category",
        type: "relation",
        required: true,
        options: { collectionId: "assignment_categories", maxSelect: 1 },
      },
      { name: "description", type: "text" },
      { name: "icon", type: "text" },
    ],
  },

  qualifications: {
    name: "qualifications",
    type: "base",
    schema: [
      { name: "name", type: "text", required: true },
      {
        name: "category",
        type: "relation",
        required: true,
        options: { collectionId: "qualification_categories", maxSelect: 1 },
      },
      { name: "description", type: "text" },
      { name: "icon", type: "text" },
      { name: "level", type: "number" },
    ],
  },

  absences: {
    name: "absences",
    type: "base",
    schema: [
      { name: "name", type: "text", required: true },
      {
        name: "category",
        type: "relation",
        required: true,
        options: { collectionId: "absence_categories", maxSelect: 1 },
      },
      { name: "description", type: "text" },
      { name: "icon", type: "text" },
    ],
  },

  vehicles: {
    name: "vehicles",
    type: "base",
    schema: [
      { name: "call_sign", type: "text", required: true },
      {
        name: "vehicle_type",
        type: "relation",
        required: true,
        options: { collectionId: "vehicle_types", maxSelect: 1 },
      },
      {
        name: "primary_unit",
        type: "relation",
        required: true,
        options: { collectionId: "units", maxSelect: 1 },
      },
      {
        name: "secondary_unit",
        type: "relation",
        options: { collectionId: "units", maxSelect: 1 },
      },
      { name: "is_active", type: "bool", required: true },
    ],
  },

  /**
   * USER RELATIONSHIP COLLECTIONS
   */

  user_assignments: {
    name: "user_assignments",
    type: "base",
    schema: [
      {
        name: "user",
        type: "relation",
        required: true,
        options: { collectionId: "_pb_users_auth_", maxSelect: 1 },
      },
      {
        name: "assignment",
        type: "relation",
        required: true,
        options: { collectionId: "assignments", maxSelect: 1 },
      },
      {
        name: "unit",
        type: "relation",
        required: true,
        options: { collectionId: "units", maxSelect: 1 },
      },
      { name: "start_date", type: "date", required: true },
    ],
  },

  user_qualifications: {
    name: "user_qualifications",
    type: "base",
    schema: [
      {
        name: "user",
        type: "relation",
        required: true,
        options: { collectionId: "_pb_users_auth_", maxSelect: 1 },
      },
      {
        name: "qualification",
        type: "relation",
        required: true,
        options: { collectionId: "qualifications", maxSelect: 1 },
      },
      { name: "obtained_date", type: "date", required: true },
    ],
  },

  user_absences: {
    name: "user_absences",
    type: "base",
    schema: [
      {
        name: "user",
        type: "relation",
        required: true,
        options: { collectionId: "_pb_users_auth_", maxSelect: 1 },
      },
      {
        name: "absence",
        type: "relation",
        required: true,
        options: { collectionId: "absences", maxSelect: 1 },
      },
      {
        name: "assignment",
        type: "relation",
        required: true,
        options: { collectionId: "user_assignments", maxSelect: 1 },
      },
      { name: "start_date", type: "date", required: true },
      { name: "end_date", type: "date", required: true },
      { name: "notes", type: "text" },
    ],
  },

  /**
   * SHIFTPLAN COLLECTIONS
   */

  shiftplans: {
    name: "shiftplans",
    type: "base",
    schema: [
      {
        name: "unit",
        type: "relation",
        required: true,
        options: { collectionId: "units", maxSelect: 1 },
      },
      { name: "date", type: "date", required: true },
      {
        name: "shift_lead",
        type: "relation",
        required: true,
        options: { collectionId: "_pb_users_auth_", maxSelect: 1 },
      },
      { name: "start_time", type: "date", required: true },
      { name: "end_time", type: "date", required: true },
      { name: "notes", type: "text" },
      {
        name: "created_by",
        type: "relation",
        options: { collectionId: "_pb_users_auth_", maxSelect: 1 },
      },
    ],
  },

  tours: {
    name: "tours",
    type: "base",
    schema: [
      {
        name: "shiftplan",
        type: "relation",
        required: true,
        options: { collectionId: "shiftplans", maxSelect: 1, cascadeDelete: true },
      },
      {
        name: "tour_type",
        type: "relation",
        options: { collectionId: "tour_types", maxSelect: 1 },
      },
      { name: "vehicle", type: "relation", options: { collectionId: "vehicles", maxSelect: 1 } },
      { name: "name", type: "text" },
      { name: "start_time", type: "date", required: true },
      { name: "end_time", type: "date", required: true },
      {
        name: "driver",
        type: "relation",
        options: { collectionId: "_pb_users_auth_", maxSelect: 1 },
      },
      {
        name: "lead",
        type: "relation",
        options: { collectionId: "_pb_users_auth_", maxSelect: 1 },
      },
      {
        name: "student",
        type: "relation",
        options: { collectionId: "_pb_users_auth_", maxSelect: 1 },
      },
      { name: "notes", type: "text" },
    ],
  },

  /**
   * PERMISSION SYSTEM
   */

  permissions: {
    name: "permissions",
    type: "base",
    schema: [
      { name: "name", type: "text", required: true },
      { name: "description", type: "text" },
    ],
  },

  user_permissions: {
    name: "user_permissions",
    type: "base",
    schema: [
      {
        name: "user",
        type: "relation",
        required: true,
        options: { collectionId: "_pb_users_auth_", maxSelect: 1 },
      },
      {
        name: "permission",
        type: "relation",
        required: true,
        options: { collectionId: "permissions", maxSelect: 1 },
      },
      { name: "unit", type: "relation", options: { collectionId: "units", maxSelect: 1 } }, // NULL = global
    ],
  },

  assignment_default_permissions: {
    name: "assignment_default_permissions",
    type: "base",
    schema: [
      {
        name: "assignment",
        type: "relation",
        required: true,
        options: { collectionId: "assignments", maxSelect: 1 },
      },
      {
        name: "permission",
        type: "relation",
        required: true,
        options: { collectionId: "permissions", maxSelect: 1 },
      },
    ],
  },

  /**
   * NEWS SYSTEM
   */

  news: {
    name: "news",
    type: "base",
    schema: [
      { name: "title", type: "text", required: true },
      { name: "content", type: "text", required: true },
      {
        name: "author",
        type: "relation",
        required: true,
        options: { collectionId: "_pb_users_auth_", maxSelect: 1 },
      },
      { name: "published_at", type: "date", required: true },
      {
        name: "target_units",
        type: "relation",
        options: { collectionId: "units", maxSelect: 999 },
      }, // Multiple units or empty for all
    ],
  },

  news_attachments: {
    name: "news_attachments",
    type: "base",
    schema: [
      {
        name: "news",
        type: "relation",
        required: true,
        options: { collectionId: "news", maxSelect: 1, cascadeDelete: true },
      },
      { name: "file", type: "file", required: true, options: { maxSelect: 1, maxSize: 10485760 } }, // 10MB
      { name: "filename", type: "text", required: true },
    ],
  },

  news_read_status: {
    name: "news_read_status",
    type: "base",
    schema: [
      {
        name: "news",
        type: "relation",
        required: true,
        options: { collectionId: "news", maxSelect: 1, cascadeDelete: true },
      },
      {
        name: "user",
        type: "relation",
        required: true,
        options: { collectionId: "_pb_users_auth_", maxSelect: 1 },
      },
      { name: "read_at", type: "date", required: true },
    ],
  },

  /**
   * UTILITIES
   */

  quick_links: {
    name: "quick_links",
    type: "base",
    schema: [
      { name: "title", type: "text", required: true },
      { name: "url", type: "url", required: true },
      { name: "icon", type: "text" },
      { name: "order", type: "number", required: true },
      { name: "is_enabled", type: "bool", required: true },
    ],
  },
};

export default POCKETBASE_SCHEMA;
