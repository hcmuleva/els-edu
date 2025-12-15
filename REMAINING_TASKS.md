# Remaining Tasks Summary

## Issues to Fix:

### 1. **Sorting Not Updating** ❌
- Problem: When clicking sort headers, the data doesn't refetch
- Solution: Need to use `useEffect` to refetch when sortField or sortOrder changes

### 2. **Use React-Admin Filters** ❌  
- Problem: Using custom state instead of react-admin's built-in filtering
- Solution: Should use `useListContext` and proper filter props

### 3. **View Button Should Open Modal** ❌
- Problem: Currently redirects to separate page
- Solution: Create modal component to show question details inline

### 4. **Add Back Button** ❌
- Need back button in:
  - New Question page (/questions/create)
  - New Quiz page (/quizzes/create)  
  - New Course page (/courses/create)

## Current Status:

✅ Table with proper columns (ID, Question, Type, Difficulty, Correct Answer, Topic, Created, Actions)
✅ Numbering (1, 2, 3...)
✅ documentId handling for Strapi v5
✅ Edit using QuestionBuilder component
✅ Delete functionality
✅ Read-only fields filtered out on save

## Next Steps:

1. First, add back buttons to all create pages
2. Fix sorting with useEffect
3. Add modal for view functionality
4. (Optional) Migrate to react-admin filters if time permits

Would you like me to proceed with these fixes one by one?
