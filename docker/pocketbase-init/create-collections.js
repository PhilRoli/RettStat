#!/usr/bin/env node

const PB_URL = process.argv[2];
const ADMIN_TOKEN = process.argv[3];

if (!PB_URL || !ADMIN_TOKEN) {
  console.error('Usage: node create-collections.js <PB_URL> <ADMIN_TOKEN>');
  process.exit(1);
}

// Collection definitions from src/lib/pocketbase/schema.ts
// Ordered by dependency (no relations -> simple relations -> complex relations)
//
// API Rules:
// - "" (empty string) = public access
// - "@request.auth.id != ''" = any authenticated user
// - "user = @request.auth.id" = only record owner
// - null = superuser only (default)

const COLLECTIONS = [
  // Independent collections (no dependencies) - Reference data (read-only for users)
  {
    name: 'units',
    type: 'base',
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: null,
    updateRule: null,
    deleteRule: null,
    fields: [
      { name: 'name', type: 'text', required: true },
      { name: 'parent_unit', type: 'relation', collectionId: 'units', maxSelect: 1 }
    ]
  },
  {
    name: 'vehicle_types',
    type: 'base',
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: null,
    updateRule: null,
    deleteRule: null,
    fields: [
      { name: 'name', type: 'text', required: true },
      { name: 'description', type: 'text' },
      { name: 'icon', type: 'text' },
      { name: 'color', type: 'text' }
    ]
  },
  {
    name: 'assignment_categories',
    type: 'base',
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: null,
    updateRule: null,
    deleteRule: null,
    fields: [
      { name: 'name', type: 'text', required: true },
      { name: 'description', type: 'text' },
      { name: 'icon', type: 'text' }
    ]
  },
  {
    name: 'qualification_categories',
    type: 'base',
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: null,
    updateRule: null,
    deleteRule: null,
    fields: [
      { name: 'name', type: 'text', required: true },
      { name: 'description', type: 'text' },
      { name: 'icon', type: 'text' }
    ]
  },
  {
    name: 'absence_categories',
    type: 'base',
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: null,
    updateRule: null,
    deleteRule: null,
    fields: [
      { name: 'name', type: 'text', required: true },
      { name: 'description', type: 'text' },
      { name: 'icon', type: 'text' }
    ]
  },
  {
    name: 'tour_types',
    type: 'base',
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: null,
    updateRule: null,
    deleteRule: null,
    fields: [
      { name: 'name', type: 'text', required: true },
      { name: 'description', type: 'text' },
      { name: 'icon', type: 'text' }
    ]
  },
  {
    name: 'permissions',
    type: 'base',
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: null,
    updateRule: null,
    deleteRule: null,
    fields: [
      { name: 'name', type: 'text', required: true },
      { name: 'description', type: 'text' }
    ]
  },
  {
    name: 'quick_links',
    type: 'base',
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: null,
    updateRule: null,
    deleteRule: null,
    fields: [
      { name: 'title', type: 'text', required: true },
      { name: 'url', type: 'url', required: true },
      { name: 'icon', type: 'text' },
      { name: 'order', type: 'number', required: true },
      { name: 'is_enabled', type: 'bool', required: true }
    ]
  },

  // Push notification subscriptions
  {
    name: 'push_subscriptions',
    type: 'base',
    listRule: "user = @request.auth.id",
    viewRule: "user = @request.auth.id",
    createRule: "@request.auth.id != ''",
    updateRule: "user = @request.auth.id",
    deleteRule: "user = @request.auth.id",
    fields: [
      { name: 'user', type: 'relation', required: true, collectionId: '_pb_users_auth_', maxSelect: 1 },
      { name: 'endpoint', type: 'text', required: true },
      { name: 'p256dh', type: 'text', required: true },
      { name: 'auth', type: 'text', required: true },
      { name: 'user_agent', type: 'text' },
      { name: 'is_active', type: 'bool', required: true }
    ]
  },

  // Event categories
  {
    name: 'event_categories',
    type: 'base',
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: null,
    updateRule: null,
    deleteRule: null,
    fields: [
      { name: 'name', type: 'text', required: true },
      { name: 'description', type: 'text' },
      { name: 'color', type: 'text' },
      { name: 'icon', type: 'text' }
    ]
  },

  // Event groups
  {
    name: 'event_groups',
    type: 'base',
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: null,
    updateRule: null,
    deleteRule: null,
    fields: [
      { name: 'name', type: 'text', required: true },
      { name: 'description', type: 'text' }
    ]
  },

  // First-level relations (depend on users and categories)
  // User-owned data - profiles
  {
    name: 'profiles',
    type: 'base',
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: "@request.auth.id != ''",
    updateRule: "user = @request.auth.id",
    deleteRule: null,
    fields: [
      { name: 'user', type: 'relation', required: true, collectionId: '_pb_users_auth_', maxSelect: 1, cascadeDelete: true },
      { name: 'first_name', type: 'text' },
      { name: 'last_name', type: 'text' },
      { name: 'avatar', type: 'file', maxSelect: 1, maxSize: 5242880 }
    ]
  },
  // Reference data - assignments
  {
    name: 'assignments',
    type: 'base',
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: null,
    updateRule: null,
    deleteRule: null,
    fields: [
      { name: 'name', type: 'text', required: true },
      { name: 'category', type: 'relation', required: true, collectionId: 'assignment_categories', maxSelect: 1 },
      { name: 'description', type: 'text' },
      { name: 'icon', type: 'text' }
    ]
  },
  // Reference data - qualifications
  {
    name: 'qualifications',
    type: 'base',
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: null,
    updateRule: null,
    deleteRule: null,
    fields: [
      { name: 'name', type: 'text', required: true },
      { name: 'category', type: 'relation', required: true, collectionId: 'qualification_categories', maxSelect: 1 },
      { name: 'description', type: 'text' },
      { name: 'icon', type: 'text' },
      { name: 'level', type: 'number' }
    ]
  },
  // Reference data - absences
  {
    name: 'absences',
    type: 'base',
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: null,
    updateRule: null,
    deleteRule: null,
    fields: [
      { name: 'name', type: 'text', required: true },
      { name: 'category', type: 'relation', required: true, collectionId: 'absence_categories', maxSelect: 1 },
      { name: 'description', type: 'text' },
      { name: 'icon', type: 'text' }
    ]
  },
  // Reference data - vehicles
  {
    name: 'vehicles',
    type: 'base',
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: null,
    updateRule: null,
    deleteRule: null,
    fields: [
      { name: 'call_sign', type: 'text', required: true },
      { name: 'vehicle_type', type: 'relation', required: true, collectionId: 'vehicle_types', maxSelect: 1 },
      { name: 'primary_unit', type: 'relation', required: true, collectionId: 'units', maxSelect: 1 },
      { name: 'secondary_unit', type: 'relation', collectionId: 'units', maxSelect: 1 },
      { name: 'is_active', type: 'bool', required: true }
    ]
  },
  // Team/shared data - news
  {
    name: 'news',
    type: 'base',
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: "@request.auth.id != ''",
    updateRule: "@request.auth.id != ''",
    deleteRule: null,
    fields: [
      { name: 'title', type: 'text', required: true },
      { name: 'content', type: 'text', required: true },
      { name: 'author', type: 'relation', required: true, collectionId: '_pb_users_auth_', maxSelect: 1 },
      { name: 'published_at', type: 'date', required: true },
      { name: 'target_units', type: 'relation', collectionId: 'units', maxSelect: 999 }
    ]
  },

  // Second-level relations
  // User-owned data - user_assignments
  {
    name: 'user_assignments',
    type: 'base',
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: "@request.auth.id != ''",
    updateRule: "user = @request.auth.id",
    deleteRule: null,
    fields: [
      { name: 'user', type: 'relation', required: true, collectionId: '_pb_users_auth_', maxSelect: 1 },
      { name: 'assignment', type: 'relation', required: true, collectionId: 'assignments', maxSelect: 1 },
      { name: 'unit', type: 'relation', required: true, collectionId: 'units', maxSelect: 1 },
      { name: 'start_date', type: 'date', required: true }
    ]
  },
  // User-owned data - user_qualifications
  {
    name: 'user_qualifications',
    type: 'base',
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: "@request.auth.id != ''",
    updateRule: "user = @request.auth.id",
    deleteRule: null,
    fields: [
      { name: 'user', type: 'relation', required: true, collectionId: '_pb_users_auth_', maxSelect: 1 },
      { name: 'qualification', type: 'relation', required: true, collectionId: 'qualifications', maxSelect: 1 },
      { name: 'obtained_date', type: 'date', required: true }
    ]
  },
  // Team/shared data - shiftplans
  {
    name: 'shiftplans',
    type: 'base',
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: "@request.auth.id != ''",
    updateRule: "@request.auth.id != ''",
    deleteRule: null,
    fields: [
      { name: 'unit', type: 'relation', required: true, collectionId: 'units', maxSelect: 1 },
      { name: 'date', type: 'date', required: true },
      { name: 'shift_lead', type: 'relation', required: true, collectionId: '_pb_users_auth_', maxSelect: 1 },
      { name: 'start_time', type: 'date', required: true },
      { name: 'end_time', type: 'date', required: true },
      { name: 'notes', type: 'text' },
      { name: 'created_by', type: 'relation', collectionId: '_pb_users_auth_', maxSelect: 1 }
    ]
  },
  // User-owned data - user_permissions
  {
    name: 'user_permissions',
    type: 'base',
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: "@request.auth.id != ''",
    updateRule: "user = @request.auth.id",
    deleteRule: null,
    fields: [
      { name: 'user', type: 'relation', required: true, collectionId: '_pb_users_auth_', maxSelect: 1 },
      { name: 'permission', type: 'relation', required: true, collectionId: 'permissions', maxSelect: 1 },
      { name: 'unit', type: 'relation', collectionId: 'units', maxSelect: 1 }
    ]
  },
  // Reference/config data - assignment_default_permissions
  {
    name: 'assignment_default_permissions',
    type: 'base',
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: null,
    updateRule: null,
    deleteRule: null,
    fields: [
      { name: 'assignment', type: 'relation', required: true, collectionId: 'assignments', maxSelect: 1 },
      { name: 'permission', type: 'relation', required: true, collectionId: 'permissions', maxSelect: 1 }
    ]
  },
  // Team/shared data - news_attachments
  {
    name: 'news_attachments',
    type: 'base',
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: "@request.auth.id != ''",
    updateRule: "@request.auth.id != ''",
    deleteRule: null,
    fields: [
      { name: 'news', type: 'relation', required: true, collectionId: 'news', maxSelect: 1, cascadeDelete: true },
      { name: 'file', type: 'file', required: true, maxSelect: 1, maxSize: 10485760 },
      { name: 'filename', type: 'text', required: true }
    ]
  },
  // User-owned data - news_read_status
  {
    name: 'news_read_status',
    type: 'base',
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: "@request.auth.id != ''",
    updateRule: "user = @request.auth.id",
    deleteRule: null,
    fields: [
      { name: 'news', type: 'relation', required: true, collectionId: 'news', maxSelect: 1, cascadeDelete: true },
      { name: 'user', type: 'relation', required: true, collectionId: '_pb_users_auth_', maxSelect: 1 },
      { name: 'read_at', type: 'date', required: true }
    ]
  },

  // Third-level relations
  // User-owned data - user_absences
  {
    name: 'user_absences',
    type: 'base',
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: "@request.auth.id != ''",
    updateRule: "user = @request.auth.id",
    deleteRule: null,
    fields: [
      { name: 'user', type: 'relation', required: true, collectionId: '_pb_users_auth_', maxSelect: 1 },
      { name: 'absence', type: 'relation', required: true, collectionId: 'absences', maxSelect: 1 },
      { name: 'assignment', type: 'relation', required: true, collectionId: 'user_assignments', maxSelect: 1 },
      { name: 'start_date', type: 'date', required: true },
      { name: 'end_date', type: 'date', required: true },
      { name: 'notes', type: 'text' }
    ]
  },
  // Team/shared data - tours
  {
    name: 'tours',
    type: 'base',
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: "@request.auth.id != ''",
    updateRule: "@request.auth.id != ''",
    deleteRule: null,
    fields: [
      { name: 'shiftplan', type: 'relation', required: true, collectionId: 'shiftplans', maxSelect: 1, cascadeDelete: true },
      { name: 'tour_type', type: 'relation', collectionId: 'tour_types', maxSelect: 1 },
      { name: 'vehicle', type: 'relation', collectionId: 'vehicles', maxSelect: 1 },
      { name: 'name', type: 'text' },
      { name: 'start_time', type: 'date', required: true },
      { name: 'end_time', type: 'date', required: true },
      { name: 'driver', type: 'relation', collectionId: '_pb_users_auth_', maxSelect: 1 },
      { name: 'lead', type: 'relation', collectionId: '_pb_users_auth_', maxSelect: 1 },
      { name: 'student', type: 'relation', collectionId: '_pb_users_auth_', maxSelect: 1 },
      { name: 'notes', type: 'text' }
    ]
  },

  // Events (depend on event_categories, units, users)
  {
    name: 'events',
    type: 'base',
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: "@request.auth.id != ''",
    updateRule: "@request.auth.id != ''",
    deleteRule: null,
    fields: [
      { name: 'name', type: 'text', required: true },
      { name: 'description', type: 'text' },
      { name: 'category', type: 'relation', collectionId: 'event_categories', maxSelect: 1 },
      { name: 'unit', type: 'relation', collectionId: 'units', maxSelect: 1 },
      { name: 'group', type: 'relation', collectionId: 'event_groups', maxSelect: 1 },
      { name: 'start_date', type: 'date', required: true },
      { name: 'end_date', type: 'date', required: true },
      { name: 'start_time', type: 'text' },
      { name: 'end_time', type: 'text' },
      { name: 'location', type: 'text' },
      { name: 'max_participants', type: 'number' },
      { name: 'status', type: 'text', required: true },
      { name: 'notes', type: 'text' },
      { name: 'created_by', type: 'relation', collectionId: '_pb_users_auth_', maxSelect: 1 }
    ]
  },

  // Event positions (depend on events, qualifications)
  {
    name: 'event_positions',
    type: 'base',
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: "@request.auth.id != ''",
    updateRule: "@request.auth.id != ''",
    deleteRule: null,
    fields: [
      { name: 'event', type: 'relation', required: true, collectionId: 'events', maxSelect: 1, cascadeDelete: true },
      { name: 'name', type: 'text', required: true },
      { name: 'required_qualification', type: 'relation', collectionId: 'qualifications', maxSelect: 1 },
      { name: 'min_count', type: 'number' },
      { name: 'max_count', type: 'number' }
    ]
  },

  // Event registrations (depend on events, event_positions, users)
  {
    name: 'event_registrations',
    type: 'base',
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: "@request.auth.id != ''",
    updateRule: "user = @request.auth.id",
    deleteRule: "user = @request.auth.id",
    fields: [
      { name: 'event', type: 'relation', required: true, collectionId: 'events', maxSelect: 1, cascadeDelete: true },
      { name: 'position', type: 'relation', collectionId: 'event_positions', maxSelect: 1 },
      { name: 'user', type: 'relation', required: true, collectionId: '_pb_users_auth_', maxSelect: 1 },
      { name: 'status', type: 'text', required: true },
      { name: 'notes', type: 'text' }
    ]
  }
];

// Rules referencing schema fields (e.g. "user = @request.auth.id") fail
// validation at creation time because PocketBase hasn't fully registered
// the schema yet. These are stripped from the POST payload and applied
// via a PATCH in a second pass after the collection exists.
const DEFERRED_RULES = {};
for (const col of COLLECTIONS) {
  if (col.updateRule && col.updateRule.includes('@request.auth.id') && col.updateRule !== "@request.auth.id != ''") {
    DEFERRED_RULES[col.name] = { updateRule: col.updateRule };
    col.updateRule = null;
  }
}

async function createCollection(collection) {
  const response = await fetch(`${PB_URL}/api/collections`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': ADMIN_TOKEN
    },
    body: JSON.stringify(collection)
  });

  if (!response.ok) {
    const error = await response.text();
    // Ignore "already exists" errors and fetch the existing collection's ID
    if (error.includes('already exists') || error.includes('name must be unique')) {
      const getResponse = await fetch(`${PB_URL}/api/collections/${collection.name}`, {
        headers: { 'Authorization': ADMIN_TOKEN }
      });
      if (getResponse.ok) {
        const existing = await getResponse.json();
        return { status: 'exists', name: collection.name, id: existing.id };
      }
      return { status: 'exists', name: collection.name };
    }
    throw new Error(`Failed to create ${collection.name}: ${error}`);
  }

  const created = await response.json();
  return { status: 'created', name: collection.name, id: created.id };
}

async function patchCollectionRules(collectionId, name, rules) {
  const response = await fetch(`${PB_URL}/api/collections/${collectionId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': ADMIN_TOKEN
    },
    body: JSON.stringify(rules)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to patch rules for ${name}: ${error}`);
  }
}

async function patchCollectionFields(collectionId, name, fields) {
  const response = await fetch(`${PB_URL}/api/collections/${collectionId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': ADMIN_TOKEN
    },
    body: JSON.stringify({ fields })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to patch fields for ${name}: ${error}`);
  }
}

async function main() {
  console.log(`Pass 1: Creating ${COLLECTIONS.length} collections (without relations)...`);

  let created = 0;
  let exists = 0;
  let failed = 0;
  const createdIds = {};
  const relationFields = {};

  // Pass 1: Create collections without relation fields
  for (const collection of COLLECTIONS) {
    // Extract relation fields for later
    const nonRelationFields = collection.fields.filter(f => f.type !== 'relation');
    const relFields = collection.fields.filter(f => f.type === 'relation');

    if (relFields.length > 0) {
      relationFields[collection.name] = relFields;
    }

    // Create collection with only non-relation fields
    const collectionToCreate = {
      ...collection,
      fields: nonRelationFields
    };

    try {
      const result = await createCollection(collectionToCreate);
      if (result.status === 'created') {
        console.log(`  ✓ Created: ${collection.name}`);
        createdIds[collection.name] = result.id;
        created++;
      } else {
        console.log(`  - Exists: ${collection.name}`);
        if (result.id) {
          createdIds[collection.name] = result.id;
        }
        exists++;
      }
    } catch (error) {
      console.error(`  ✗ Failed: ${collection.name} - ${error.message}`);
      failed++;
    }
  }

  // Pass 2: Add relation fields now that all collections exist
  const collectionsWithRelations = Object.keys(relationFields);
  if (collectionsWithRelations.length > 0) {
    console.log(`\nPass 2: Adding relation fields to ${collectionsWithRelations.length} collections...`);
    for (const name of collectionsWithRelations) {
      const id = createdIds[name];
      if (!id) {
        console.log(`  - Skipped: ${name} (not created this run)`);
        continue;
      }
      try {
        // Get original collection def and resolve collectionId names to IDs
        const originalCollection = COLLECTIONS.find(c => c.name === name);
        const fieldsWithResolvedIds = originalCollection.fields.map(field => {
          if (field.type === 'relation' && field.collectionId) {
            // If collectionId is a name (not an ID like _pb_users_auth_), resolve it
            const targetId = createdIds[field.collectionId];
            if (targetId) {
              return { ...field, collectionId: targetId };
            }
          }
          return field;
        });

        await patchCollectionFields(id, name, fieldsWithResolvedIds);
        console.log(`  ✓ Patched: ${name}`);
      } catch (error) {
        console.error(`  ✗ Failed: ${name} - ${error.message}`);
        failed++;
      }
    }
  }

  // Pass 3: Apply deferred owner-based rules
  const deferredNames = Object.keys(DEFERRED_RULES);
  if (deferredNames.length > 0) {
    console.log(`\nPass 3: Applying owner-based rules to ${deferredNames.length} collections...`);
    for (const name of deferredNames) {
      const id = createdIds[name];
      if (!id) {
        console.log(`  - Skipped: ${name} (not created this run)`);
        continue;
      }
      try {
        await patchCollectionRules(id, name, DEFERRED_RULES[name]);
        console.log(`  ✓ Patched: ${name}`);
      } catch (error) {
        console.error(`  ✗ Failed: ${name} - ${error.message}`);
        failed++;
      }
    }
  }

  console.log('');
  console.log(`Summary: ${created} created, ${exists} already existed, ${failed} failed`);

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
