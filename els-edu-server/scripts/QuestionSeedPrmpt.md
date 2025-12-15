You are an expert educator and question-creator. 
Generate 10 high-quality, creative, concept-testing questions for the subject with ID "pmbwp36a1m1njlsmgfdmrk03" and the topic with documentId "nwrm9dm201bio8cof4ee4gi0".

The questions must:
- Be tricky, logical, or counterintuitive, like classic lateral-thinking or conceptual physics/math puzzles.
- Follow the example:
  Example: 
  “A person walks 1 km south, then 1 km east, then 1 km north and returns to the starting point. Is this possible? Explain.”
  Answer: “Yes. This is possible at the North Pole because ...”

- Each question must require reasoning, explanation, or deeper conceptual understanding.
- Provide the answer and explanation for each question.
- Questions should cover different categories such as:
  - Logic
  - Math concepts
  - Physics concepts
  - Geometry thinking
  - Real-world paradoxes
  - Lateral thinking
  - Space/Earth related thought experiments
  - Assumption-breaking scenarios

Format:
1. Question
   Answer:
   Explanation:
2. Question
   Answer:
   Explanation:

Example:
“A person walks 1 km south, then 1 km east, then 1 km north and returns to the starting point. Is this possible? Explain.”
Answer: “Yes. It is possible if the person starts from the North Pole…”

Your output MUST strictly follow this JSON structure for **each** question:

{
  "data": {
    "documentId": "<auto-generate unique ID>",
    "questionText": "...",
    "questionType": "MCQ",
    "points": 10,
    "timeLimit": 45,
    "explanation": "...",
    "difficulty": "medium",
    "tags": [],
    "subject": "pmbwp36a1m1njlsmgfdmrk03",
    "chapter": "nwrm9dm201bio8cof4ee4gi0",
    "learningObjective": null,
    "hints": [],
    "options": [
      { "id": "a", "text": "..." },
      { "id": "b", "text": "..." },
      { "id": "c", "text": "..." },
      { "id": "d", "text": "..." }
    ],
    "correctAnswers": ["<a|b|c|d>"],
    "partialCredit": false,
    "shuffleOptions": true,
    "caseSensitive": false,
    "order": null,
    "metadata": null,
    "isActive": true,
    "level": 2
  }
}

Rules:
- MUST generate 10 questions.
- Each question must be logical, tricky, conceptual, or counterintuitive.
- Categories must vary: logic, math, physics, real-world paradoxes, lateral thinking, geometry, assumptions, etc.
- Provide explanation for each question.
- Ensure options are meaningful and only one correct answer exists.
- Keep difficulty between medium and hard but solvable.
- Make documentId a random unique string (UUID or similar).
- Do NOT include any extra text outside the JSON list.
- Final output must be an array: [ {...}, {...}, ... ]

