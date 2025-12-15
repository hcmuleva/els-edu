# Database Reset Guide

## Overview

The database reset script automates the entire process of:

1. **Stopping** the Strapi server
2. **Dropping** the old database
3. **Creating** a new database
4. **Restoring** from backup (`els_backup_db_18_nov.sql`)
5. **Starting** the server
6. **Seeding** demo data automatically

This ensures you always have a clean, consistent testing environment.

## Quick Start

### Option 1: Using npm script (Recommended)

```bash
cd elsserver
npm run reset-db
```

### Option 2: Direct bash script

```bash
cd elsserver
bash scripts/reset-db-and-seed.sh
```

## Prerequisites

✅ PostgreSQL installed locally
✅ PostgreSQL server running
✅ Backup file exists: `elsserver/db_backup/els_backup_db_18_nov.sql`
✅ Port 5432 available (default PostgreSQL port)
✅ Strapi and npm dependencies installed

### If PostgreSQL is not running:

**On Linux:**

```bash
sudo service postgresql start
```

**On Mac (with Homebrew):**

```bash
brew services start postgresql
```

**On Windows (with PostgreSQL installed):**

- Start PostgreSQL service from Services app
- Or use: `pg_ctl -D "C:\Program Files\PostgreSQL\15\data" start`

## What Happens Step-by-Step

### 1. Prerequisites Check

- ✓ Verifies `psql` is installed
- ✓ Checks backup file exists
- ✓ Checks seed script exists
- ✓ Tests PostgreSQL connection

### 2. Stop Server

- Kills any running Strapi processes (`npm run dev`)
- Ensures clean database operations

### 3. Database Reset

```sql
DROP DATABASE IF EXISTS els_db;
CREATE DATABASE els_db;
```

### 4. Restore from Backup

```bash
psql -U postgres -d els_db < db_backup/els_backup_db_18_nov.sql
```

This imports all tables, schemas, and data from the backup file

### 5. Start Server

- Starts `npm run dev` in background
- Waits for Strapi to be ready (max 60 seconds)
- Confirms server is responding at `http://localhost:1337`

### 6. Create Demo Data

- Runs `node scripts/seed-demo-data.js`
- Creates 3 demo organizations
- Creates 15 demo users (5 per org)
- Creates 6 demo kits
- Assigns kits randomly across orgs

## Output Example

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔄 ELS Database Reset & Seed
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ℹ This script will:
ℹ   1. Stop Strapi server
ℹ   2. Drop and recreate database
ℹ   3. Restore backup data
ℹ   4. Start Strapi server
ℹ   5. Create demo data (seed)

Continue? (y/n) y

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Checking Prerequisites
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ psql found
✓ Backup file found: /home/dhruv/work-dhruv/hph/els-work/els/elsserver/db_backup/els_backup_db_18_nov.sql
✓ Seed script found
✓ PostgreSQL connection successful

... (more output) ...

✅ Database Reset Complete!
✓ Database has been reset and seeded with demo data
ℹ Frontend: http://localhost:5173
ℹ Backend: http://localhost:1337
ℹ Demo credentials available in QUICK_START.md
```

## Troubleshooting

### Error: "psql not found"

**Solution:** Install PostgreSQL client tools

```bash
# Ubuntu/Debian
sudo apt-get install postgresql-client

# Mac with Homebrew
brew install postgresql

# Windows: Download from https://www.postgresql.org/download/windows/
```

### Error: "Cannot connect to PostgreSQL"

**Solution:** Make sure PostgreSQL is running

```bash
# Check if PostgreSQL is running
psql -U postgres -c "\q"

# If not running, start it
sudo service postgresql start  # Linux
brew services start postgresql  # Mac
```

### Error: "Backup file not found"

**Solution:** Verify backup file exists in correct location

```bash
ls -la elsserver/db_backup/els_backup_db_18_nov.sql
```

If missing, you can create a new backup:

```bash
# Backup current database
pg_dump -U postgres els_db > elsserver/db_backup/els_backup_db_TIMESTAMP.sql

# Then update the script to reference the new backup file
```

### Error: "Cannot drop database - other users connected"

**Solution:** Kill existing connections

```bash
# Manually kill connections
PGPASSWORD=postgres psql -U postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'els_db';"

# Then run reset again
npm run reset-db
```

### Server times out after 60 seconds

**Solution:** Check Strapi logs

```bash
tail -100 /tmp/strapi-server.log
```

Common causes:

- PostgreSQL not running
- Port 1337 already in use
- Insufficient disk space

## Running Only Seed (Without Reset)

If you want to keep your database but just add demo data:

```bash
npm run seed
```

## Manual Database Reset (If Script Fails)

If the automated script fails, you can do it manually:

```bash
# 1. Stop the server
pkill -f "npm.*dev"
sleep 3

# 2. Reset database
PGPASSWORD=postgres psql -U postgres -c "DROP DATABASE IF EXISTS els_db; CREATE DATABASE els_db;"

# 3. Restore backup
PGPASSWORD=postgres psql -U postgres -d els_db < elsserver/db_backup/els_backup_db_18_nov.sql

# 4. Start server
cd elsserver
npm run dev

# 5. In another terminal, run seed
npm run seed
```

## Database Status Checks

### Check database exists

```bash
PGPASSWORD=postgres psql -U postgres -l | grep els_db
```

### Check database size

```bash
PGPASSWORD=postgres psql -U postgres -d els_db -c "SELECT pg_size_pretty(pg_database_size('els_db'));"
```

### Check table count

```bash
PGPASSWORD=postgres psql -U postgres -d els_db -c "\dt"
```

### Check user count

```bash
PGPASSWORD=postgres psql -U postgres -d els_db -c "SELECT COUNT(*) as user_count FROM up_user;"
```

### Check kit count

```bash
PGPASSWORD=postgres psql -U postgres -d els_db -c "SELECT COUNT(*) as kit_count FROM kit;"
```

## Testing After Reset

After running the reset, test the following:

1. **Access Frontend:**

   ```
   http://localhost:5173
   ```

2. **Access Backend:**

   ```
   http://localhost:1337/admin
   ```

3. **Login with Demo Credentials:**

   - Email: `admin-org1@demo.test`
   - Password: `AdminPass123!`

4. **Verify Demo Data Created:**
   - Should see 3 organizations
   - Should see 15 users total (5 per org)
   - Should see 6 kits assigned

See `QUICK_START.md` for full testing instructions.

## Backup Management

### Creating a New Backup

If you make changes you want to preserve:

```bash
# With server running
PGPASSWORD=postgres pg_dump -U postgres els_db > elsserver/db_backup/els_backup_db_$(date +%Y%m%d_%H%M%S).sql

# Without server (direct dump)
PGPASSWORD=postgres pg_dump -U postgres els_db > elsserver/db_backup/els_backup_db_backup.sql
```

### Backing Up Current State

```bash
# Create timestamped backup
PGPASSWORD=postgres pg_dump -U postgres els_db > elsserver/db_backup/els_backup_db_$(date +%Y-%m-%d).sql

# List all backups
ls -lh elsserver/db_backup/
```

### Using Different Backup

Edit `reset-db-and-seed.sh` and change:

```bash
BACKUP_FILE="$(pwd)/db_backup/YOUR_BACKUP_FILE.sql"
```

## Workflow Example

### Fresh Development Session

```bash
# Terminal 1: Reset database
cd elsserver
npm run reset-db

# Terminal 2: Once reset completes, start frontend
cd elsclient
npm run dev

# Both backend (1337) and frontend (5173) now running with fresh data
```

### Testing Kit Duplication Fix

```bash
# Reset to clean state
npm run reset-db

# Login: admin-org1@demo.test / AdminPass123!
# Navigate to a kit and click "Start Kit"
# Check that only 1 kit progress record is created
# Verify by checking database:
PGPASSWORD=postgres psql -U postgres -d els_db -c "SELECT COUNT(*) FROM kit_progress WHERE kit_id = 1;"
# Should show: 1 (not 2 or more)
```

### Testing Navigation

```bash
# Reset to clean state
npm run reset-db

# Login and navigate: Org → Student Profile → Kit Progress
# Click back button at each step
# Verify it returns to previous page (not kit progress again)
```

## Automation Options

### Run Every 24 Hours (Linux/Mac)

Add to crontab:

```bash
crontab -e
# Add line:
0 2 * * * cd /home/dhruv/work-dhruv/hph/els-work/els/elsserver && bash scripts/reset-db-and-seed.sh > /tmp/reset-db.log 2>&1
```

### Run with Git Pre-commit Hook

Create `.git/hooks/pre-commit`:

```bash
#!/bin/bash
# Reset database before committing
cd elsserver
npm run reset-db
```

## Key Files

- **Script:** `elsserver/scripts/reset-db-and-seed.sh`
- **Backup:** `elsserver/db_backup/els_backup_db_18_nov.sql`
- **Seed Script:** `elsserver/scripts/seed-demo-data.js`
- **Server Logs:** `/tmp/strapi-server.log`
- **Server PID:** `/tmp/strapi-server.pid`

## Performance Notes

**Typical Reset Time:**

- Database operations: 5-10 seconds
- Server startup: 15-30 seconds
- Demo data seeding: 5-10 seconds
- **Total: 25-50 seconds**

**Database Size After Reset:**

- Base backup: ~5-10 MB
- With demo data: ~10-15 MB

## FAQ

**Q: Why does the script ask for confirmation?**
A: To prevent accidental database resets. Press `y` to continue.

**Q: Does it reset the frontend too?**
A: No, only the backend database. Frontend state will reset when you refresh the browser.

**Q: Can I run this while frontend is open?**
A: Yes, but the frontend will lose connection. Refresh the page after reset completes.

**Q: What if I need to keep some data?**
A: Don't run the reset script. Just run `npm run seed` to add demo data to existing database.

**Q: How do I know when it's finished?**
A: The script will output `✅ Database Reset Complete!` and return to command prompt.

**Q: Can I stop it in the middle?**
A: Press Ctrl+C to stop. If it fails, the database will be in a reset state. You may need to manually restart the server.

## Next Steps

1. Run the reset: `npm run reset-db`
2. Wait for completion (25-50 seconds)
3. Access frontend: `http://localhost:5173`
4. Follow test cases in `TESTING_GUIDE.md`
5. Report any issues

---

**Last Updated:** November 18, 2025
**Backup Source:** `els_backup_db_18_nov.sql`
**Version:** 1.0
