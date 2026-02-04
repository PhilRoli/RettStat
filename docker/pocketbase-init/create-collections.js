#!/usr/bin/env node

const PB_URL = process.argv[2];
const ADMIN_TOKEN = process.argv[3];

if (!PB_URL || !ADMIN_TOKEN) {
  console.error('Usage: node create-collections.js <PB_URL> <ADMIN_TOKEN>');
  process.exit(1);
}

// Collection definitions from src/lib/pocketbase/schema.ts
// Ordered by dependency (no relations -> simple relations -> complex relations)
const COLLECTIONS = [
  // Independent collections (no dependencies)
  {
    name: 'units',
    type: 'base',
    schema: [
      { name: 'name', type: 'text', required: true },
      { name: 'parent_unit', type: 'relation', options: { collectionId: 'units', maxSelect: 1 } }
    ]
  },
  {
    name: 'vehicle_types',
    type: 'base',
    schema: [
      { name: 'name', type: 'text', required: true },
      { name: 'description', type: 'text' },
      { name: 'icon', type: 'text' },
      { name: 'color', type: 'text' }
    ]
  },
  {
    name: 'assignment_categories',
    type: 'base',
    schema: [
      { name: 'name', type: 'text', required: true },
      { name: 'description', type: 'text' },
      { name: 'icon', type: 'text' }
    ]
  },
  {
    name: 'qualification_categories',
    type: 'base',
    schema: [
      { name: 'name', type: 'text', required: true },
      { name: 'description', type: 'text' },
      { name: 'icon', type: 'text' }
    ]
  },
  {
    name: 'absence_categories',
    type: 'base',
    schema: [
      { name: 'name', type: 'text', required: true },
      { name: 'description', type: 'text' },
      { name: 'icon', type: 'text' }
    ]
  },
  {
    name: 'tour_types',
    type: 'base',
    schema: [
      { name: 'name', type: 'text', required: true },
      { name: 'description', type: 'text' },
      { name: 'icon', type: 'text' }
    ]
  },
  {
    name: 'permissions',
    type: 'base',
    schema: [
      { name: 'name', type: 'text', required: true },
      { name: 'description', type: 'text' }
    ]
  },
  {
    name: 'quick_links',
    type: 'base',
    schema: [
      { name: 'title', type: 'text', required: true },
      { name: 'url', type: 'url', required: true },
      { name: 'icon', type: 'text' },
      { name: 'order', type: 'number', required: true },
      { name: 'is_enabled', type: 'bool', required: true }
    ]
  },

  // First-level relations (depend on users and categories)
  {
    name: 'profiles',
    type: 'base',
    schema: [
      {
        name: 'user',
        type: 'relation',
        required: true,
        options: { collectionId: '_pb_users_auth_', maxSelect: 1, cascadeDelete: true }
      },
      { name: 'first_name', type: 'text' },
      { name: 'last_name', type: 'text' },
      { name: 'avatar', type: 'file', options: { maxSelect: 1, maxSize: 5242880 } }
    ]
  },
  {
    name: 'assignments',
    type: 'base',
    schema: [
      { name: 'name', type: 'text', required: true },
      {
        name: 'category',
        type: 'relation',
        required: true,
        options: { collectionId: 'assignment_categories', maxSelect: 1 }
      },
      { name: 'description', type: 'text' },
      { name: 'icon', type: 'text' }
    ]
  },
  {
    name: 'qualifications',
    type: 'base',
    schema: [
      { name: 'name', type: 'text', required: true },
      {
        name: 'category',
        type: 'relation',
        required: true,
        options: { collectionId: 'qualification_categories', maxSelect: 1 }
      },
      { name: 'description', type: 'text' },
      { name: 'icon', type: 'text' },
      { name: 'level', type: 'number' }
    ]
  },
  {
    name: 'absences',
    type: 'base',
    schema: [
      { name: 'name', type: 'text', required: true },
      {
        name: 'category',
        type: 'relation',
        required: true,
        options: { collectionId: 'absence_categories', maxSelect: 1 }
      },
      { name: 'description', type: 'text' },
      { name: 'icon', type: 'text' }
    ]
  },
  {
    name: 'vehicles',
    type: 'base',
    schema: [
      { name: 'call_sign', type: 'text', required: true },
      {
        name: 'vehicle_type',
        type: 'relation',
        required: true,
        options: { collectionId: 'vehicle_types', maxSelect: 1 }
      },
      {
        name: 'primary_unit',
        type: 'relation',
        required: true,
        options: { collectionId: 'units', maxSelect: 1 }
      },
      {
        name: 'secondary_unit',
        type: 'relation',
        options: { collectionId: 'units', maxSelect: 1 }
      },
      { name: 'is_active', type: 'bool', required: true }
    ]
  },
  {
    name: 'news',
    type: 'base',
    schema: [
      { name: 'title', type: 'text', required: true },
      { name: 'content', type: 'text', required: true },
      {
        name: 'author',
        type: 'relation',
        required: true,
        options: { collectionId: '_pb_users_auth_', maxSelect: 1 }
      },
      { name: 'published_at', type: 'date', required: true },
      {
        name: 'target_units',
        type: 'relation',
        options: { collectionId: 'units', maxSelect: 999 }
      }
    ]
  },

  // Second-level relations
  {
    name: 'user_assignments',
    type: 'base',
    schema: [
      {
        name: 'user',
        type: 'relation',
        required: true,
        options: { collectionId: '_pb_users_auth_', maxSelect: 1 }
      },
      {
        name: 'assignment',
        type: 'relation',
        required: true,
        options: { collectionId: 'assignments', maxSelect: 1 }
      },
      {
        name: 'unit',
        type: 'relation',
        required: true,
        options: { collectionId: 'units', maxSelect: 1 }
      },
      { name: 'start_date', type: 'date', required: true }
    ]
  },
  {
    name: 'user_qualifications',
    type: 'base',
    schema: [
      {
        name: 'user',
        type: 'relation',
        required: true,
        options: { collectionId: '_pb_users_auth_', maxSelect: 1 }
      },
      {
        name: 'qualification',
        type: 'relation',
        required: true,
        options: { collectionId: 'qualifications', maxSelect: 1 }
      },
      { name: 'obtained_date', type: 'date', required: true }
    ]
  },
  {
    name: 'shiftplans',
    type: 'base',
    schema: [
      {
        name: 'unit',
        type: 'relation',
        required: true,
        options: { collectionId: 'units', maxSelect: 1 }
      },
      { name: 'date', type: 'date', required: true },
      {
        name: 'shift_lead',
        type: 'relation',
        required: true,
        options: { collectionId: '_pb_users_auth_', maxSelect: 1 }
      },
      { name: 'start_time', type: 'date', required: true },
      { name: 'end_time', type: 'date', required: true },
      { name: 'notes', type: 'text' },
      {
        name: 'created_by',
        type: 'relation',
        options: { collectionId: '_pb_users_auth_', maxSelect: 1 }
      }
    ]
  },
  {
    name: 'user_permissions',
    type: 'base',
    schema: [
      {
        name: 'user',
        type: 'relation',
        required: true,
        options: { collectionId: '_pb_users_auth_', maxSelect: 1 }
      },
      {
        name: 'permission',
        type: 'relation',
        required: true,
        options: { collectionId: 'permissions', maxSelect: 1 }
      },
      { name: 'unit', type: 'relation', options: { collectionId: 'units', maxSelect: 1 } }
    ]
  },
  {
    name: 'assignment_default_permissions',
    type: 'base',
    schema: [
      {
        name: 'assignment',
        type: 'relation',
        required: true,
        options: { collectionId: 'assignments', maxSelect: 1 }
      },
      {
        name: 'permission',
        type: 'relation',
        required: true,
        options: { collectionId: 'permissions', maxSelect: 1 }
      }
    ]
  },
  {
    name: 'news_attachments',
    type: 'base',
    schema: [
      {
        name: 'news',
        type: 'relation',
        required: true,
        options: { collectionId: 'news', maxSelect: 1, cascadeDelete: true }
      },
      { name: 'file', type: 'file', required: true, options: { maxSelect: 1, maxSize: 10485760 } },
      { name: 'filename', type: 'text', required: true }
    ]
  },
  {
    name: 'news_read_status',
    type: 'base',
    schema: [
      {
        name: 'news',
        type: 'relation',
        required: true,
        options: { collectionId: 'news', maxSelect: 1, cascadeDelete: true }
      },
      {
        name: 'user',
        type: 'relation',
        required: true,
        options: { collectionId: '_pb_users_auth_', maxSelect: 1 }
      },
      { name: 'read_at', type: 'date', required: true }
    ]
  },

  // Third-level relations
  {
    name: 'user_absences',
    type: 'base',
    schema: [
      {
        name: 'user',
        type: 'relation',
        required: true,
        options: { collectionId: '_pb_users_auth_', maxSelect: 1 }
      },
      {
        name: 'absence',
        type: 'relation',
        required: true,
        options: { collectionId: 'absences', maxSelect: 1 }
      },
      {
        name: 'assignment',
        type: 'relation',
        required: true,
        options: { collectionId: 'user_assignments', maxSelect: 1 }
      },
      { name: 'start_date', type: 'date', required: true },
      { name: 'end_date', type: 'date', required: true },
      { name: 'notes', type: 'text' }
    ]
  },
  {
    name: 'tours',
    type: 'base',
    schema: [
      {
        name: 'shiftplan',
        type: 'relation',
        required: true,
        options: { collectionId: 'shiftplans', maxSelect: 1, cascadeDelete: true }
      },
      {
        name: 'tour_type',
        type: 'relation',
        options: { collectionId: 'tour_types', maxSelect: 1 }
      },
      { name: 'vehicle', type: 'relation', options: { collectionId: 'vehicles', maxSelect: 1 } },
      { name: 'name', type: 'text' },
      { name: 'start_time', type: 'date', required: true },
      { name: 'end_time', type: 'date', required: true },
      {
        name: 'driver',
        type: 'relation',
        options: { collectionId: '_pb_users_auth_', maxSelect: 1 }
      },
      {
        name: 'lead',
        type: 'relation',
        options: { collectionId: '_pb_users_auth_', maxSelect: 1 }
      },
      {
        name: 'student',
        type: 'relation',
        options: { collectionId: '_pb_users_auth_', maxSelect: 1 }
      },
      { name: 'notes', type: 'text' }
    ]
  }
];

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
    // Ignore "already exists" errors
    if (error.includes('already exists') || error.includes('name must be unique')) {
      return { status: 'exists', name: collection.name };
    }
    throw new Error(`Failed to create ${collection.name}: ${error}`);
  }

  return { status: 'created', name: collection.name };
}

async function main() {
  console.log(`Creating ${COLLECTIONS.length} collections...`);
  
  let created = 0;
  let exists = 0;
  let failed = 0;

  for (const collection of COLLECTIONS) {
    try {
      const result = await createCollection(collection);
      if (result.status === 'created') {
        console.log(`  ✓ Created: ${collection.name}`);
        created++;
      } else {
        console.log(`  - Exists: ${collection.name}`);
        exists++;
      }
    } catch (error) {
      console.error(`  ✗ Failed: ${collection.name} - ${error.message}`);
      failed++;
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
