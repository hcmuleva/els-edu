# Quiz Result Analytics API Documentation

## Overview
The enhanced quiz-result API provides comprehensive analytics and tracking capabilities for quiz performance, user trends, and intelligent retake recommendations.

## API Endpoints

### 1. Submit Quiz Result
**POST** `/api/quiz-results/submit`

Submit a quiz attempt with comprehensive analytics tracking.

```json
{
  "quiz": "quiz_document_id",
  "user": "user_document_id",
  "answers": [
    {
      "questionId": "question_1_id",
      "selectedAnswer": "option_a",
      "correctAnswer": "option_b",
      "isCorrect": false,
      "timeSpent": 45,
      "questionType": "multiple_choice",
      "difficulty": "intermediate"
    }
  ],
  "timeTaken": 1200,
  "subject": "subject_document_id",
  "topic": "topic_document_id"
}
```

**Response:**
```json
{
  "data": {
    "documentId": "result_id",
    "percentage": 75,
    "score": 15,
    "totalQuestions": 20,
    "isPassed": true,
    "grade": "B",
    "timeTaken": 1200,
    "attemptNumber": 2,
    "weakAreas": ["algebra", "geometry"],
    "strongAreas": ["arithmetic", "statistics"],
    "retakeQuestions": ["question_3_id", "question_7_id"],
    "improvementSuggestions": [
      "Focus on algebraic expressions",
      "Practice geometry problems"
    ]
  }
}
```

### 2. Get User Performance Trends
**GET** `/api/quiz-results/trends/:userId`

Get comprehensive performance trends and analytics for a user.

**Query Parameters:**
- `period` (optional): "week", "month", "quarter", "year" (default: "month")
- `subject` (optional): Filter by subject ID
- `topic` (optional): Filter by topic ID

**Response:**
```json
{
  "data": {
    "performanceTrends": [
      {
        "period": "2024-01",
        "averageScore": 78,
        "attemptsCount": 5,
        "passRate": 80,
        "improvement": 5
      }
    ],
    "subjectPerformance": [
      {
        "subject": "Mathematics",
        "averageScore": 82,
        "attempts": 12,
        "trend": "improving"
      }
    ],
    "overallStats": {
      "totalAttempts": 25,
      "averageScore": 79,
      "passRate": 84,
      "recentTrend": "improving"
    },
    "streaks": {
      "currentStreak": 3,
      "longestStreak": 7,
      "streakType": "passing"
    }
  }
}
```

### 3. Get Performance Analytics
**GET** `/api/quiz-results/analytics/:userId`

Get detailed performance analytics including strengths, weaknesses, and recommendations.

**Response:**
```json
{
  "data": {
    "overview": {
      "totalAttempts": 25,
      "averageScore": 79,
      "passRate": 84,
      "recentTrend": "improving",
      "bestScore": 95,
      "worstScore": 45
    },
    "strengths": [
      {
        "type": "subject",
        "name": "Mathematics",
        "averageScore": 88,
        "attempts": 10
      }
    ],
    "weaknesses": [
      {
        "type": "subject",
        "name": "Physics",
        "averageScore": 65,
        "attempts": 8,
        "improvementNeeded": 5
      }
    ],
    "improvementAreas": [
      {
        "area": "multiple_choice questions",
        "currentAccuracy": 72,
        "attempts": 45,
        "recommendation": "Practice more multiple_choice type questions"
      }
    ],
    "recentPerformance": [
      {
        "quizTitle": "Algebra Basics",
        "percentage": 85,
        "passed": true,
        "date": "2024-01-15T10:30:00Z",
        "subject": "Mathematics"
      }
    ]
  }
}
```

### 4. Get Retake Questions
**GET** `/api/quiz-results/retake-questions/:userId`

Get intelligently recommended questions for retake based on performance analysis.

**Query Parameters:**
- `subject` (optional): Filter by subject ID
- `difficulty` (optional): "beginner", "intermediate", "advanced"
- `limit` (optional): Number of questions to return (default: 10)

**Response:**
```json
{
  "data": {
    "recommendedQuestions": [
      {
        "questionId": "question_3_id",
        "reason": "Consistently answered incorrectly",
        "attempts": 3,
        "successRate": 0,
        "lastAttempt": "2024-01-10T14:20:00Z",
        "difficulty": "intermediate",
        "topic": "Algebraic Equations"
      }
    ],
    "summary": {
      "totalRecommended": 8,
      "byDifficulty": {
        "beginner": 2,
        "intermediate": 4,
        "advanced": 2
      },
      "byTopic": {
        "Algebra": 4,
        "Geometry": 2,
        "Statistics": 2
      }
    },
    "studyPlan": [
      {
        "priority": "high",
        "topic": "Algebraic Equations",
        "questionsCount": 4,
        "estimatedTime": 20,
        "description": "Focus on solving linear and quadratic equations"
      }
    ]
  }
}
```

### 5. Get Leaderboard
**GET** `/api/quiz-results/leaderboard`

Get competitive leaderboard with various ranking options.

**Query Parameters:**
- `type` (optional): "overall", "weekly", "monthly", "subject" (default: "overall")
- `subject` (optional): Subject ID for subject-specific leaderboard
- `limit` (optional): Number of users to return (default: 10)

**Response:**
```json
{
  "data": {
    "leaderboard": [
      {
        "rank": 1,
        "user": {
          "documentId": "user_id",
          "username": "john_doe",
          "firstName": "John",
          "lastName": "Doe"
        },
        "stats": {
          "averageScore": 92,
          "totalAttempts": 15,
          "passRate": 100,
          "totalPoints": 1380
        },
        "badges": ["quiz_master", "perfect_score", "consistent_performer"]
      }
    ],
    "currentUser": {
      "rank": 5,
      "percentile": 85,
      "pointsToNextRank": 120
    },
    "metadata": {
      "totalParticipants": 25,
      "period": "overall",
      "lastUpdated": "2024-01-15T16:45:00Z"
    }
  }
}
```

## Admin Analytics Endpoints

### 6. Get Quiz Statistics (Admin)
**GET** `/api/quiz-results/admin/quiz-stats/:quizId`

Get comprehensive statistics for a specific quiz (admin only).

**Response:**
```json
{
  "data": {
    "overview": {
      "totalAttempts": 150,
      "uniqueUsers": 45,
      "averageScore": 76,
      "passRate": 82,
      "averageTime": 1420,
      "retakeRate": 28
    },
    "questionPerformance": [
      {
        "questionId": "question_1_id",
        "successRate": 85,
        "averageTime": 65,
        "totalAttempts": 150,
        "difficulty": "beginner"
      }
    ],
    "performanceDistribution": [
      {
        "range": "81-100",
        "count": 45,
        "percentage": 30
      }
    ],
    "trends": [
      {
        "week": "2024-W03",
        "attempts": 25,
        "averageScore": 78,
        "passRate": 84
      }
    ],
    "recommendations": [
      {
        "type": "question_difficulty",
        "priority": "high",
        "message": "3 questions have success rates below 50%",
        "action": "review_questions"
      }
    ]
  }
}
```

## Data Models

### Quiz Result Schema
The enhanced quiz-result collection includes these key fields:

```json
{
  "quiz": "relation to quiz",
  "user": "relation to user", 
  "subject": "relation to subject",
  "topic": "relation to topic",
  "score": "integer",
  "totalQuestions": "integer",
  "percentage": "float",
  "timeTaken": "integer (seconds)",
  "isPassed": "boolean",
  "grade": "enumeration",
  "attemptNumber": "integer",
  "questionAnalysis": [
    {
      "questionId": "string",
      "isCorrect": "boolean",
      "timeSpent": "integer",
      "selectedAnswer": "string",
      "correctAnswer": "string",
      "difficulty": "enumeration",
      "questionType": "string"
    }
  ],
  "weakAreas": ["string"],
  "strongAreas": ["string"],
  "retakeQuestions": ["string"],
  "improvementSuggestions": ["text"],
  "deviceInfo": "json",
  "sessionData": "json",
  "completionRate": "float"
}
```

## Authentication
All endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

## Error Responses
Standard error responses follow this format:

```json
{
  "error": {
    "status": 400,
    "name": "ValidationError",
    "message": "Invalid quiz data provided",
    "details": {
      "field": "quiz",
      "message": "Quiz ID is required"
    }
  }
}
```

## Usage Examples

### Submit a Quiz Result
```javascript
const response = await fetch('/api/quiz-results/submit', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  },
  body: JSON.stringify({
    quiz: 'quiz_123',
    user: 'user_456',
    answers: answers,
    timeTaken: 1200
  })
});
```

### Get User Trends
```javascript
const trends = await fetch('/api/quiz-results/trends/user_456?period=month', {
  headers: {
    'Authorization': 'Bearer ' + token
  }
});
```

### Get Retake Recommendations
```javascript
const retakeQuestions = await fetch('/api/quiz-results/retake-questions/user_456?difficulty=intermediate&limit=5', {
  headers: {
    'Authorization': 'Bearer ' + token
  }
});
```

## Performance Considerations

1. **Pagination**: Large datasets are automatically paginated
2. **Caching**: Results are cached for performance
3. **Rate Limiting**: API calls are rate-limited per user
4. **Database Indexing**: Optimized queries with proper indexing

## Security Features

1. **User Isolation**: Users can only access their own data
2. **Admin Controls**: Administrative endpoints require admin role
3. **Input Validation**: All inputs are validated and sanitized
4. **Audit Logging**: All quiz submissions are logged for integrity

This comprehensive API provides everything needed for sophisticated quiz analytics, performance tracking, and intelligent learning recommendations.