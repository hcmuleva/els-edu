# JNVST Question Bank Seeder

## Overview
This script seeds Jawahar Navodaya Vidyalaya Selection Test (JNVST) questions for Class 6 entrance exam into your Strapi backend with proper exam and year tagging.

## Features
- ✅ **15 Sample Questions** across 3 sections:
  - Mental Ability (5 questions): Coding, Series, Patterns, Logic
  - Arithmetic (5 questions): Time & Work, Percentage, Speed, Mensuration, BODMAS
  - Language (5 questions): Grammar, Vocabulary, Spelling

- ✅ **Automatic Tagging**:
  - Tags questions with exam: "JNVST"
  - Tags questions with year: 2023
  - Creates tags if they don't exist

- ✅ **Many-to-Many Relations**:
  - Each question can be associated with multiple exams
  - Each question can be associated with multiple years
  - Easy filtering and querying by exam/year

## Prerequisites

1. Strapi server running on `http://localhost:1337`
2. Python 3.x installed
3. `requests` library: `pip install requests`

## Setup

###  1. Get Strapi API Token

```bash
# Login to Strapi admin panel
# Go to: Settings > API Tokens > Create new API Token
# Name: JNVST Seeder
# Token type: Full access
# Copy the generated token
```

### 2. Update Script with Token

Edit `seed-jnvst-questions.py` and replace the token:

```python
API_TOKEN = "your-actual-strapi-token-here"
```

## Usage

### Run the Script

```bash
cd /Users/harishmuleva/projects/els_all_in_one/elsserver/scripts
python3 seed-jnvst-questions.py
```

### Expected Output

```
============================================================
JNVST Question Seeding Script
============================================================

Checking for exam tag: JNVST
Created exam tag: JNVST (ID: 1)
Checking for year tag: 2023
Created year tag: 2023 (ID: 1)

============================================================
Creating Questions
============================================================

--- Mental Ability Questions ---
Creating question 1/5: If in a certain code, MOTHER is written as NPUIFS...
✓ Created (ID: 1)
...

============================================================
Summary
============================================================
Total questions created: 15
Total questions failed: 0

✓ JNVST questions successfully seeded!
✓ Tagged with Exam: JNVST (ID: 1)
✓ Tagged with Year: 2023 (ID: 1)
```

## Question Structure

Each question includes:
- **Question Text**: The actual question
- **Question Type**: Single Choice (SC)
- **Options**: Array of 4 options with one correct answer
- **Correct Answer**: Marked in options
- **Explanation**: Detailed solution
- **Difficulty**: easy/medium/hard
- **Subject**: Mental Ability / Arithmetic / Language
- **Chapter**: Specific topic within subject
- **Time Limit**: 60 seconds per question
- **Points**: 1 point per question
- **Exam Tag**: JNVST
- **Year Tag**: 2023

## Querying Tagged Questions

### Get all JNVST questions

```javascript
// API call
GET /api/questions?filters[tag_exams][tag_exam][$eq]=JNVST&populate=tag_exams,tag_years
```

### Get JNVST 2023 questions

```javascript
// API call
GET /api/questions?filters[tag_exams][tag_exam][$eq]=JNVST&filters[tag_years][year][$eq]=2023&populate=*
```

### Get by subject

```javascript
// API call
GET /api/questions?filters[tag_exams][tag_exam][$eq]=JNVST&filters[subject][$eq]=Mental Ability
```

## Adding More Questions

To add more JNVST questions, edit the `JNVST_QUESTIONS` dictionary in the script:

```python
JNVST_QUESTIONS = {
    "Mental Ability": [
        {
            "questionText": "Your question here...",
            "options": [
                {"text": "Option A", "isCorrect": False},
                {"text": "Option B", "isCorrect": True},
                {"text": "Option C", "isCorrect": False},
                {"text": "Option D", "isCorrect": False}
            ],
            "explanation": "Explanation here...",
            "difficulty": "medium",
            "subject": "Mental Ability",
            "chapter": "Chapter name"
        }
    ]
}
```

## For Multiple Years

To seed questions for different years (e.g., 2022, 2024):

1. Modify the script:
```python
year_id = create_or_get_tag_year(2024)  # Change year
```

2. Or create a loop:
```python
for year in [2022, 2023, 2024]:
    year_id = create_or_get_tag_year(year)
    # seed questions...
```

## Troubleshooting

### Authentication Error
- Verify API token is correct
- Ensure token has full access permissions

### Connection Error
- Check Strapi is running on `http://localhost:1337`
- Verify no firewall blocking

### Questions Not Creating
- Check Strapi logs for validation errors
- Ensure all required fields are provided
- Verify tag_exams and tag_years relations exist in schema

## Next Steps

1. **Create Quizzes**: Group these questions into actual quizzes
2. **Add More Years**: Seed historical papers (2020, 2021, 2022)
3. **Add More Exams**: Create tags for other entrance exams
4. **Add Images**: For pattern recognition and diagram questions
5. **Add Hindi Questions**: For language section in Hindi medium

## License
Internal use for BeBrainee learning platform
