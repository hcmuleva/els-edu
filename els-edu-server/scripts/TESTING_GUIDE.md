# ELS Application Testing Guide 🧪

Complete guide for testing the ELS application with demo data.

## 🎯 Pre-Testing Checklist

- [ ] Backend server running (`npm run dev`)
- [ ] Frontend server running (`npm run dev` in elsclient)
- [ ] Demo data seeded (`npm run seed`)
- [ ] Browser cache cleared
- [ ] No other instances running

## 📱 Frontend URL

```
http://localhost:5173
```

## 👤 Demo Credentials

### Organization 1: Tech Academy Pro

```
Email:    admin-org1@demo.test
Password: AdminPass123!
Students: 4 (john.student1-1@demo.test, sarah.student1-2@demo.test, etc.)
```

### Organization 2: Digital Learn Hub

```
Email:    admin-org2@demo.test
Password: AdminPass123!
Students: 4 (john.student2-1@demo.test, sarah.student2-2@demo.test, etc.)
```

### Organization 3: Code Masters Institute

```
Email:    admin-org3@demo.test
Password: AdminPass123!
Students: 4 (john.student3-1@demo.test, sarah.student3-2@demo.test, etc.)
```

## 🧑‍🏫 Test Scenarios

### Test 1: Login and Dashboard

**Objective:** Verify admin login and dashboard functionality

**Steps:**

1. Navigate to `http://localhost:5173`
2. Click "Login" or "Sign In"
3. Enter email: `admin-org1@demo.test`
4. Enter password: `AdminPass123!`
5. Click "Login"

**Expected Results:**

- ✅ Successfully logs in
- ✅ Redirected to admin dashboard
- ✅ Shows organization information
- ✅ User profile shows correct name and org
- ✅ No authentication errors in console

**Test Outcome:** PASS / FAIL

---

### Test 2: View Organization and Students

**Objective:** Verify ability to view org and list students

**Steps:**

1. From dashboard, navigate to "Organization" section
2. Look for "Students" or "Members" view
3. Should see list of 5 users (1 admin + 4 students)
4. Verify student names and emails are correct

**Expected Results:**

- ✅ Organization name displayed: "Tech Academy Pro"
- ✅ Contact email visible: "admin@techacademy.demo"
- ✅ 5 users listed
- ✅ User details show name, email, role
- ✅ At least one user with ADMIN role
- ✅ Four users with USER role

**Test Outcome:** PASS / FAIL

---

### Test 3: View User Profile

**Objective:** Test user profile viewing and back navigation

**Steps:**

1. From students list, click "Action" or "View" on any student
2. Should navigate to user profile page
3. Observe profile details
4. Check enrolled kits
5. Click "Back" button

**Expected Results:**

- ✅ User profile loads
- ✅ Shows correct user name: "John Student1-1" (or similar)
- ✅ Shows email: "john.student1-1@demo.test"
- ✅ Shows experience level
- ✅ Shows avatar or placeholder
- ✅ Shows "Enrolled Kits" section with 2 kits
- ✅ Back button is visible
- ✅ Clicking "Back" returns to org students list ⭐ **CRITICAL**

**Test Outcome:** PASS / FAIL

---

### Test 4: View Kit Progress

**Objective:** Test kit progress view and navigation

**Steps:**

1. From user profile, click on any kit (e.g., "React Fundamentals")
2. Should navigate to kit progress page
3. Review kit details
4. Check levels and lessons
5. Click "Back to User Profile" button

**Expected Results:**

- ✅ Kit progress page loads
- ✅ Shows kit name: "React Fundamentals"
- ✅ Shows overall progress (0% for new users)
- ✅ Shows "Started On" date
- ✅ Shows levels and lessons sections
- ✅ Shows lessons count
- ✅ "Back to User Profile" button is visible
- ✅ Clicking back returns to user profile ⭐ **CRITICAL**

**Test Outcome:** PASS / FAIL

---

### Test 5: Navigation Flow (MOST IMPORTANT)

**Objective:** Verify correct back button navigation through views

**Steps:**

1. Start at: Organization Students List
2. Click on student "John Student1-1" → User Profile
3. Verify you're on user profile
4. Click "Back" button
5. Should return to: Organization Students List ✅
6. Click on same student again → User Profile
7. Click on kit "React Fundamentals" → Kit Progress
8. Verify you're on kit progress
9. Click "Back to User Profile" button
10. Should return to: User Profile ✅
11. Click "Back" button
12. Should return to: Organization Students List ✅

**Expected Results:**

- ✅ Step 5: Correctly navigates back to students list
- ✅ Step 10: Correctly navigates back to user profile
- ✅ Step 12: Correctly navigates back to org students ⭐ **CRITICAL**
- ✅ No redirect loops
- ✅ No 404 errors
- ✅ History stack works correctly

**Browser History:** Should look like:

```
Org Students → User Profile → Kit Progress → User Profile → Org Students
```

**Test Outcome:** PASS / FAIL ⭐ **THIS IS THE MAIN TEST FOR THE FIX**

---

### Test 6: Kit Duplication Check

**Objective:** Verify that starting a kit creates only 1 progress record

**Prerequisites:** User has not started any kit yet

**Steps:**

1. From user profile, find a kit not yet started
2. Look for "Start Kit" or "Enroll" button
3. Click "Start Kit"
4. Verify success message
5. Check backend database for kitprogress records

**Backend Check:**

```sql
-- In postgres, run:
SELECT user_id, kit_id, COUNT(*) as count
FROM kitprogresses
WHERE user_id = '<userId>' AND kit_id = '<kitId>'
GROUP BY user_id, kit_id
HAVING COUNT(*) > 1;

-- Should return NO rows (no duplicates)
```

**Expected Results:**

- ✅ "Start Kit" button is clickable
- ✅ Success message appears
- ✅ Kit status changes to "Active" or "Started"
- ✅ Only 1 kitprogress record created in database
- ✅ No duplicate records
- ✅ Progress tracking begins (0% → can update to 100%)

**Test Outcome:** PASS / FAIL

---

### Test 7: Multiple Organizations

**Objective:** Verify isolation and relationships between orgs

**Steps:**

1. Logout from admin-org1
2. Login as `admin-org2@demo.test` / `AdminPass123!`
3. Navigate to org students
4. Verify you see 5 different users for org 2
5. Verify users from org 1 are NOT visible
6. Repeat for org 3

**Expected Results:**

- ✅ Each org has 5 unique users
- ✅ Users only appear in their assigned org
- ✅ No user data leakage between orgs
- ✅ Each org has 2 assigned kits
- ✅ Kit lists may differ between orgs (randomly assigned)

**Test Outcome:** PASS / FAIL

---

### Test 8: Mobile Responsive

**Objective:** Verify UI works on mobile devices

**Steps:**

1. Open DevTools (F12)
2. Toggle Device Toolbar (Ctrl+Shift+M)
3. Select iPhone 12 or similar
4. Navigate through: Org → Student → Kit Progress
5. Test back button on mobile view
6. Verify all text is readable
7. Verify buttons are clickable
8. Test landscape orientation

**Expected Results:**

- ✅ Layout is responsive
- ✅ No text overflow
- ✅ Buttons are appropriately sized
- ✅ Navigation works in mobile view
- ✅ Back button is visible and functional
- ✅ Works in both portrait and landscape

**Test Outcome:** PASS / FAIL

---

### Test 9: GraphQL Queries Work

**Objective:** Verify GraphQL API is functioning

**Steps:**

1. Open browser DevTools (F12)
2. Go to Network tab
3. Filter by "graphql" or "api"
4. Navigate through the app
5. Click on GraphQL requests
6. Verify response status is 200
7. Check no errors in response

**Expected Results:**

- ✅ GraphQL requests return 200 status
- ✅ No error field in responses
- ✅ Data is properly populated
- ✅ No "Cannot read property" errors
- ✅ Queries complete in < 500ms

**Test Outcome:** PASS / FAIL

---

### Test 10: Console Errors

**Objective:** Ensure no JS errors or warnings

**Steps:**

1. Open browser Console (F12)
2. Clear console
3. Reload page
4. Navigate through entire app
5. Look for red errors or warnings
6. Note any errors found

**Expected Results:**

- ✅ No red errors in console
- ✅ No TypeErrors
- ✅ No ReferenceErrors
- ✅ No "undefined" errors
- ✅ Max 1-2 warnings (expected)

**Test Outcome:** PASS / FAIL

---

## 📊 Test Results Summary

Create a summary table:

| Test # | Test Name                  | Status    | Notes       |
| ------ | -------------------------- | --------- | ----------- |
| 1      | Login and Dashboard        | PASS/FAIL |             |
| 2      | View Organization Students | PASS/FAIL |             |
| 3      | View User Profile          | PASS/FAIL |             |
| 4      | View Kit Progress          | PASS/FAIL |             |
| 5      | Navigation Flow            | PASS/FAIL | ⭐ Critical |
| 6      | Kit Duplication Check      | PASS/FAIL |             |
| 7      | Multiple Organizations     | PASS/FAIL |             |
| 8      | Mobile Responsive          | PASS/FAIL |             |
| 9      | GraphQL Queries            | PASS/FAIL |             |
| 10     | Console Errors             | PASS/FAIL |             |

## ✅ Criteria for Success

All tests pass: **READY FOR PRODUCTION** ✅

Critical tests (5, 6) pass: **READY FOR STAGING** ⚠️

Some tests fail: **NEEDS FIXES** ❌

## 🐛 If Tests Fail

### Navigation Flow Fails (Test 5)

**Issue:** Back button not working correctly

**Debugging Steps:**

1. Check browser history: Press Alt+Left to go back
2. Check browser console for routing errors
3. Check if `navigate()` function is being called
4. Verify `AdminUserKitProgressView.jsx` has `navigate(-1)`
5. Check `UserProfileView.jsx` also has `navigate(-1)`

**Fix Location:**

- `/elsclient/src/pages/profile/AdminUserKitProgressView.jsx` - Line ~57
- `/elsclient/src/pages/profile/UserProfileView.jsx` - Line ~151

### Kit Duplication (Test 6)

**Issue:** Multiple kitprogress records created

**Debugging Steps:**

1. Check backend logs for duplicate creation
2. Verify frontend uses `startKitAPI` not GraphQL
3. Check if mutation is still being called
4. Verify deduplication logic in backend

**Fix Location:**

- `/elsclient/src/services/progressApi.js` - Check `startKitAPI`
- `/elsserver/src/api/custom-progress-update/services/progress-service.js`

### GraphQL Errors (Test 9)

**Issue:** GraphQL requests failing

**Debugging Steps:**

1. Check Network tab for response
2. Look for "errors" array in response
3. Check backend logs
4. Verify schema is correct
5. Check authentication token is valid

**Common Issues:**

- Missing authentication header
- Wrong query syntax
- Field doesn't exist in schema
- Type mismatch

## 📝 Notes for Developers

- Demo credentials are hardcoded in seed script
- Data expires when database is reset
- Always backup production data before seeding
- Test in incognito mode to avoid cache issues
- Use "npm run seed" to regenerate test data

## 🔄 Continuous Testing

After any code changes:

1. Run seed script: `npm run seed`
2. Test navigation (Test 5)
3. Test kit duplication (Test 6)
4. Check console for errors (Test 10)
5. Verify GraphQL (Test 9)

Minimum: Tests 5, 6, 10 must pass

## 📞 Contact for Issues

If issues persist:

1. Check git branch is correct
2. Pull latest code
3. Clear node_modules and reinstall
4. Reset database
5. Run seed again
6. Check all ports are available (1337, 5173, 3306)

---

**Last Updated:** November 18, 2025  
**Tested with:** Node v18+, npm v8+, Chrome/Firefox latest
