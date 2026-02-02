# PocketBase Setup Guide

## Quick Start

### 1. Start PocketBase Server

```bash
cd pocketbase
./pocketbase serve
```

The admin UI will be available at: **http://127.0.0.1:8090/_/**

### 2. Create Admin Account

On first run, navigate to http://127.0.0.1:8090/_/ and create your admin account.

### 3. Create Collections

Use the schema defined in `src/lib/pocketbase/schema.ts` to create collections through the Admin UI.

**Required Collections (24 total):**

- **Core**: users (built-in), profiles, units
- **Categories**: vehicle_types, assignment_categories, qualification_categories, absence_categories, tour_types
- **Entities**: assignments, qualifications, absences, vehicles
- **User Relations**: user_assignments, user_qualifications, user_absences
- **Shiftplans**: shiftplans, tours
- **Permissions**: permissions, user_permissions, assignment_default_permissions
- **News**: news, news_attachments, news_read_status
- **Utilities**: quick_links

### 4. Configure Collection Rules

Each collection needs access rules. Example for `profiles`:

```javascript
// List/Search Rule
@request.auth.id != "" // Authenticated users can list

// View Rule
@request.auth.id != "" // Authenticated users can view

// Create Rule
@request.auth.id != "" && @request.auth.id = user.id // Users can create their own profile

// Update Rule
@request.auth.id = user.id // Users can update their own profile

// Delete Rule
@request.auth.id = user.id // Users can delete their own profile
```

## Development

### Environment Variables

Add to `.env.local`:

```env
NEXT_PUBLIC_POCKETBASE_URL=http://127.0.0.1:8090
```

### Type-Safe Client Usage

```typescript
import { pb, collections } from "@/lib/pocketbase/client";

// Get all units
const units = await pb.collection(collections.units).getFullList();

// Get specific shiftplan
const shiftplan = await pb.collection(collections.shiftplans).getOne(id);

// Create new tour
const tour = await pb.collection(collections.tours).create({
  shiftplan: shiftplanId,
  vehicle: vehicleId,
  driver: driverId,
  start_time: new Date(),
  end_time: new Date(),
});
```

## Production Deployment

See `docker/README.md` for production setup with Docker Compose.

## Migration from Supabase

Phase 1: ✅ Setup & Schema - COMPLETE
Phase 2: Client Layer (next)
Phase 3: Auth Migration
Phase 4: Data Layer
Phase 5: Realtime
Phase 6: File Storage  
Phase 7: Admin Components
Phase 8: Deployment

See `/home/philipp/.copilot/session-state/336bf049-3053-4410-9b38-8a5d6844b0f0/plan.md` for full migration plan.
