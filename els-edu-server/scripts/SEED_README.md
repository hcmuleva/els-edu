# Demo Data Seed Script 🌱

This script creates complete demo data for testing the ELS application with organizations, users, and kits relationships.

## ⚡ Quick Start

```bash
# Terminal 1: Start the backend server
cd elsserver
npm run dev

# Terminal 2: Run the seed script (wait for server to be fully ready)
npm run seed
```

## 📋 What Gets Created

### 3 Organizations

1. **Tech Academy Pro**

   - Email: admin@techacademy.demo
   - Admin Password: AdminPass123!

2. **Digital Learn Hub**

   - Email: admin@digitallearn.demo
   - Admin Password: AdminPass123!

3. **Code Masters Institute**
   - Email: admin@codemasters.demo
   - Admin Password: AdminPass123!

### 15 Users (5 per org)

- 1 ADMIN user per organization
- 4 REGULAR users per organization

**Format:**

- Admin: `admin-orgN@demo.test` / `AdminPass123!`
- Students: `student{N}-{1-4}@demo.test` / `StudentPass123!`
- Phone: Auto-generated (10 digits)
- Experience Levels: Mixed (SCHOOL, COLLEGE, PROFESSIONAL)

### 6 Kits

1. **React Fundamentals** (FREE, FRONTEND, Level 1)
2. **Node.js Backend Development** (PAID, BACKEND, Level 2)
3. **Docker & Containerization** (PAID, DOCKER, Level 3)
4. **Python for Data Science** (FREE, LEARNING, Level 2)
5. **DevOps Essentials** (PAID, DEVOPS, Level 3)
6. **Testing Best Practices** (FREEMIUM, TESTING, Level 2)

**Assignment:** Each org gets 2 randomly assigned kits

## 🚀 Running the Seed

### Option 1: Using npm script (Recommended)

```bash
cd elsserver
npm run seed
```

### Option 2: Direct execution

```bash
cd elsserver
node scripts/seed-demo-data.js
```

### Option 3: With custom API URL

```bash
API_URL=http://localhost:3000 npm run seed
```

## 📊 Output Example

```
🌱 Starting demo data seeding...
API URL: http://localhost:1337

📚 Creating kits...
✓ React Fundamentals
✓ Node.js Backend Development
✓ Docker & Containerization
✓ Python for Data Science
✓ DevOps Essentials
✓ Testing Best Practices
Created 6/6 kits

🏢 Creating organizations and users...
✓ Tech Academy Pro (ID: abc123...)
  Creating 5 users...
    ✓ [ADMIN] Admin Org1
    ✓ [USER ] John Student1-1
    ✓ [USER ] Sarah Student1-2
    ✓ [USER ] Mike Student1-3
    ✓ [USER ] Emily Student1-4
[... more orgs ...]

🔗 Assigning kits to organizations...
✓ React Fundamentals → Tech Academy Pro
✓ Python for Data Science → Tech Academy Pro
[... more assignments ...]

✅ Seed completed successfully!

📊 Summary:
  Organizations: 3
  Users: 15
  Kits: 6

📋 Demo Login Credentials:

  Tech Academy Pro
    Email:    admin-org1@demo.test
    Password: AdminPass123!
    Users:    5

[... more orgs ...]

🚀 Ready for testing!
```

## ✅ Testing Your Flow

### 1. Login with Admin Account

- URL: `http://localhost:5173` (frontend)
- Email: `admin-org1@demo.test`
- Password: `AdminPass123!`
- Expected: Dashboard with organization management

### 2. Navigate to Organization Section

- Look for "Organizations" or "My Organization"
- Should see "Tech Academy Pro" or similar

### 3. View Organization Students

- Click on the organization
- See list of 5 users (1 admin + 4 students)

### 4. Test User Profile View

- Click "Action" or "View" on any student
- Should navigate to user profile
- Verify you see:
  - User details
  - Avatar
  - Enrolled kits
  - Progress stats

### 5. Test Kit Progress View

- From user profile, click on any kit (e.g., "React Fundamentals")
- Should navigate to kit progress view
- Should see:
  - Kit name and description
  - Overall progress
  - Levels and lessons
  - Duration info

### 6. Test Back Button Navigation ⚙️

This is the critical test for the navigation fix:

1. Start at: Org Students List
2. Click on a student → User Profile
3. Click "Back" → Should return to Org Students
4. Click on the same student again → User Profile
5. Click on a kit → Kit Progress View
6. Click "Back to User Profile" → Should return to User Profile
7. Click "Back" → Should return to Org Students ✓

**Expected behavior:**

- Back button history should work correctly
- Each back button should go to the previous page
- No loops or incorrect navigation

## 🔍 Troubleshooting

### Error: "ECONNREFUSED"

- Backend server is not running
- Make sure `npm run dev` is running before seed script
- Wait 5-10 seconds for server to fully initialize

### Error: "Email already exists"

- Demo data already exists in database
- Delete the data from Strapi admin panel or reset database
- Or modify email addresses in the script

### Error: "Failed to assign user to org"

- User creation succeeded but org assignment failed
- Check user model has `org` field
- Verify database permissions

### Users don't appear in organization

- Clear browser cache
- Refresh the page
- Check browser dev console for GraphQL errors

### Kits not showing in organization

- Kits created but not assigned to org
- Check if kit creation succeeded in output
- Manually assign kits from Strapi admin panel

## 🗑️ Cleaning Up Demo Data

### Option 1: From Strapi Admin Panel

1. Navigate to Content Manager
2. Delete organizations (cascades to users)
3. Delete kits
4. Delete any related data

### Option 2: Reset Database

```bash
# In Strapi admin panel
Settings → Database → Reset All Data
```

### Option 3: Manual Database Cleanup

```sql
-- BACKUP your database first!
DELETE FROM orgs WHERE org_name LIKE '%Academy%' OR org_name LIKE '%Learn%' OR org_name LIKE '%Masters%';
DELETE FROM users_permissions_user WHERE email LIKE '%@demo.test%';
DELETE FROM kits WHERE name IN ('React Fundamentals', 'Node.js Backend Development', ...);
```

## 📝 Customizing Demo Data

To customize the data:

### Change organization names/details

Edit `DEMO_ORGS` array in `seed-demo-data.js`

### Add more users per organization

Edit `generateUsersForOrg()` function

### Change kit assignments

Modify the kit selection logic in the assignment step

### Add more kits

Edit `DEMO_KITS` array with new kit objects

Example:

```javascript
const DEMO_ORGS = [
  {
    org_name: "My Custom Organization",
    contact_email: "contact@myorg.demo",
    contact_phone: 1234567890,
    org_status: "ACTIVE",
    description: "My custom description",
  },
];
```

## 🔗 API Endpoints Used

The script uses these endpoints:

- `POST /api/kits` - Create kits
- `POST /api/orgs` - Create organizations
- `POST /api/auth/local/register` - Create users
- `PUT /api/users/{id}` - Assign user to org
- `PUT /api/kits/{id}` - Assign kit to org

## ⚙️ Script Features

✅ **Automatic retry** - Retries requests if server is not ready
✅ **Sequential execution** - Creates data in order for stability
✅ **Error handling** - Continues if individual operations fail
✅ **Progress tracking** - Shows what's being created
✅ **Color-coded output** - Easy to read results
✅ **Comprehensive logging** - Details on what succeeded/failed
✅ **Fast execution** - Completes in 5-10 seconds

## 📈 Next Steps

After seeding:

1. ✅ Login with demo admin account
2. ✅ Navigate through organization views
3. ✅ Test user profile viewing
4. ✅ Test kit progress tracking
5. ✅ Test back button navigation
6. ✅ Start a kit and verify progress creation
7. ✅ Check for any GraphQL/API errors

## 🐛 Reporting Issues

If you encounter issues:

1. Check the script output for error messages
2. Look at browser dev console (F12)
3. Check backend logs (`npm run dev` terminal)
4. Verify database connectivity
5. Ensure all npm packages are installed

## 📚 Related Files

- `/elsserver/scripts/seed-demo-data.js` - Main seed script
- `/elsserver/package.json` - npm scripts configuration
- `/elsclient/src/pages/profile/UserProfileView.jsx` - User profile component
- `/elsclient/src/pages/profile/AdminUserKitProgressView.jsx` - Kit progress component

Happy testing! 🚀
