# Update Subjects Creator Script

## Overview

This script updates all subjects in the database to have a specific creator (user). It's useful for bulk updates when you need to assign a default creator to all subjects.

## Usage

### Basic Usage

```bash
# Using npm script (recommended)
npm run update-subjects-creator

# Or directly with node
node scripts/update-subjects-creator.js
```

### Custom Creator Document ID

You can specify a different creator document ID using an environment variable:

```bash
CREATOR_DOCUMENT_ID=your_document_id_here npm run update-subjects-creator
```

Or modify the `CREATOR_DOCUMENT_ID` constant in the script file.

## Default Configuration

- **Default Creator Document ID**: `fx8zgcrfld6q6cr1s541i3am`

## What the Script Does

1. **Initializes Strapi** - Loads the Strapi application
2. **Finds Creator User** - Looks up the user by documentId
3. **Fetches All Subjects** - Retrieves all subjects from the database
4. **Updates Subjects** - Sets the creator field for each subject that doesn't already have this creator
5. **Verifies Updates** - Performs a sample check to confirm updates were successful
6. **Provides Summary** - Shows statistics about the migration

## Output

The script provides detailed logging:
- ✅ Success messages (green)
- ⚠️ Warnings (yellow)
- ❌ Errors (red)
- 📊 Summary statistics

Example output:
```
🚀 Starting Strapi application...
✅ Strapi initialized successfully
📋 Looking for creator with documentId: fx8zgcrfld6q6cr1s541i3am
✅ Found creator: admin@example.com (ID: 1, documentId: fx8zgcrfld6q6cr1s541i3am)
📚 Fetching all subjects...
📊 Found 150 subjects to process
⏳ Updated 10 subjects so far...
⏳ Updated 20 subjects so far...
...

============================================================
📊 Migration Summary
============================================================
Total subjects: 150
✅ Updated: 145
⏭️  Skipped (already correct): 5
❌ Errors: 0
============================================================

🔍 Verifying updates...
✅ Verification: Found 5 subjects with creator set (sample check)

✅ Script completed successfully!
```

## Safety Features

- **Skips Already Updated** - Subjects that already have the target creator are skipped
- **Error Handling** - Individual subject update errors don't stop the entire process
- **Verification** - Performs a sample check after updates
- **Detailed Logging** - Shows progress and errors for debugging

## Requirements

- Strapi server must be properly configured
- Database connection must be working
- The creator user must exist in the database
- Node.js 18+ required

## Troubleshooting

### Error: User not found
- Verify the creator documentId exists in the database
- Check that the user is in the `users-permissions` plugin

### Error: Strapi initialization failed
- Ensure the database is running and accessible
- Check that all Strapi dependencies are installed
- Verify the Strapi configuration files are correct

### No subjects updated
- Check if subjects already have the creator set
- Verify subjects exist in the database
- Check database connection

## Notes

- The script uses Strapi's `entityService` for proper data handling
- It uses numeric IDs for relations (Strapi v5 requirement)
- The script is idempotent - safe to run multiple times
- Subjects that already have the correct creator are skipped

