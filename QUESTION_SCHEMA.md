# Question Schema Documentation

## Unified Options Structure

We've implemented a clean, reusable JSON structure for question options that works across **all question types** (Single Choice, Multiple Choice, and True/False).

### Schema Structure

```json
{
  "questionText": "Your question here",
  "questionType": "SC | MCQ | TF",
  "options": [
    {
      "id": 1,
      "option": "Answer text",
      "isCorrect": true,
      "multimediaId": null
    }
  ],
  "explanation": "Optional explanation",
  "difficulty": "easy | medium | hard",
  "points": 1,
  "topicReference": "Optional topic/subject reference",
  "creator": 49
}
```

### Options Array Format

Each option in the `options` array contains:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | number | Yes | Unique identifier for the option |
| `option` | string | Yes | The text content of the option/answer |
| `isCorrect` | boolean | Yes | Whether this option is a correct answer |
| `multimediaId` | number/null | No | Reference to attached media (image/video/audio) |
| `label` | string | Optional | Display label (A, B, C, etc.) - UI only |

## Question Type Examples

### Single Choice (SC)
```json
{
  "questionType": "SC",
  "options": [
    { "id": 1, "option": "Paris", "isCorrect": true, "multimediaId": null },
    { "id": 2, "option": "London", "isCorrect": false, "multimediaId": null },
    { "id": 3, "option": "Berlin", "isCorrect": false, "multimediaId": null }
  ]
}
```

### Multiple Choice (MCQ)
```json
{
  "questionType": "MCQ",
  "options": [
    { "id": 1, "option": "Red", "isCorrect": true, "multimediaId": null },
    { "id": 2, "option": "Blue", "isCorrect": true, "multimediaId": null },
    { "id": 3, "option": "Green", "isCorrect": false, "multimediaId": null }
  ]
}
```

### True/False (TF)
```json
{
  "questionType": "TF",
  "questionText": "2 + 2 = 5",
  "options": [
    { "id": 1, "option": "Yes", "isCorrect": false, "multimediaId": null },
    { "id": 2, "option": "No", "isCorrect": true, "multimediaId": null }
  ]
}
```

## Benefits

✅ **Unified Structure**: Same format works for SC, MCQ, and TF
✅ **Clean & Simple**: No redundant fields like `correctAnswer` or `correctAnswers`
✅ **Extensible**: Easy to add multimedia support via `multimediaId`
✅ **Consistent**: All question types follow the same pattern
✅ **Flexible**: Can support multiple correct answers (MCQ) or single (SC/TF)

## Migration Notes

### Removed Fields
- ❌ `correctAnswer` (boolean) - Now uses `options[].isCorrect`
- ❌ `correctAnswers` (json) - Now uses `options[].isCorrect`

### Added Fields
- ✅ `topicReference` (string, optional) - For categorizing questions by topic

### Modified Fields
- `options` - Now uses `option` instead of `text` for answer content
- `options` - Includes `multimediaId` for future media attachment support
