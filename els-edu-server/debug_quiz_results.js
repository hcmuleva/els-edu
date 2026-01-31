const { MongoClient } = require("mongodb");

// MongoDB Connection
const MONGO_URI =
  "mongodb://admin:password@localhost:27018/els_mongo?authSource=admin";

async function debugQuizResults() {
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db("els_mongo");
    // Mongoose pluralizes to lowercase usually: 'UserQuiz' -> 'userquizzes'
    // But let's check what's there
    const collections = await db.listCollections().toArray();
    console.log(
      "Collections:",
      collections.map((c) => c.name),
    );

    const collectionName = collections.find(
      (c) =>
        c.name === "userquizzes" ||
        c.name === "userQuizs" ||
        c.name === "UserQuiz",
    )?.name;

    if (!collectionName) {
      console.log("Could not find user quiz collection.");
      return;
    }

    console.log(`Using collection: ${collectionName}`);
    const collection = db.collection(collectionName);

    // Fetch latest quiz
    const quiz = await collection.findOne({}, { sort: { createdAt: -1 } });

    if (quiz) {
      console.log("\n=== LATEST QUIZ RESULT ===");
      console.log(`ID: ${quiz._id}`);
      console.log(`UserDocumentId: ${quiz.userDocumentId}`);
      console.log(`Type: ${quiz.type}`);

      const questionDetails = quiz.questionDetails || [];
      console.log(`\nQuestion Details (${questionDetails.length} items):`);

      const q = questionDetails[0];
      if (q) {
        console.log("\nSample Question #1:");
        console.log(
          `  QuestionId: ${q.questionId} (Type: ${typeof q.questionId})`,
        );
        console.log(
          `  SelectedAnswer: ${q.selectedAnswer} (Type: ${typeof q.selectedAnswer})`,
        );
        console.log(
          `  CorrectAnswer: ${q.correctAnswer} (Type: ${typeof q.correctAnswer})`,
        );
        console.log(`  QuestionText (Stored): ${q.questionText || "N/A"}`);
        console.log(
          `  SelectedAnswerText (Stored): ${q.selectedAnswerText || "N/A"}`,
        );
      }

      // Check for one with answer, just in case
      const answeredQ = questionDetails.find((qd) => qd.selectedAnswer);
      if (answeredQ && answeredQ !== q) {
        console.log("\nSample Answered Question:");
        console.log(`  QuestionId: ${answeredQ.questionId}`);
        console.log(`  SelectedAnswer: ${answeredQ.selectedAnswer}`);
      }
    } else {
      console.log("No quizzes found.");
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.close();
  }
}

debugQuizResults();
