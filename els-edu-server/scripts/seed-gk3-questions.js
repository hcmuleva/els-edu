const fetch = require("node-fetch");

const API_BASE_URL = "http://localhost:1337";
const BEARER_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzY0NjQ2NDUzLCJleHAiOjE3NjcyMzg0NTN9.jLD62cozlLtpijLSnWDQWRCU7BbCynMmGVQGZ12REgI";
const SUBJECT_ID = "gvzucbgegjcfiz5ojzugwj9l";

// Helper to create a question object
const createQuestion = (text, options, correct, type = "MCQ") => ({
  questionText: text,
  questionType: type,
  options: options,
  correctAnswers: correct, // Array of correct option IDs/indices
  points: 10,
  timeLimit: 30,
  difficulty: "easy",
  level: 1,
  isActive: true
});

// Questions Data (Level 1 - Basic)
const QUESTIONS_DATA = {
  "Ages": [
    createQuestion("If Ram is 10 years old and Shyam is 2 years older, how old is Shyam?",
      [{ id: "a", text: "8" }, { id: "b", text: "12" }, { id: "c", text: "10" }, { id: "d", text: "14" }],
      ["b"]),
    createQuestion("The sum of ages of A and B is 30. If A is 10, what is B's age?",
      [{ id: "a", text: "15" }, { id: "b", text: "20" }, { id: "c", text: "25" }, { id: "d", text: "10" }],
      ["b"]),
    createQuestion("Current age of a father is 40. What was his age 5 years ago?",
      [{ id: "a", text: "35" }, { id: "b", text: "45" }, { id: "c", text: "30" }, { id: "d", text: "40" }],
      ["a"])
  ],
  "Average": [
    createQuestion("What is the average of 2, 4, and 6?",
      [{ id: "a", text: "3" }, { id: "b", text: "4" }, { id: "c", text: "5" }, { id: "d", text: "6" }],
      ["b"]),
    createQuestion("Find the average of 10, 20, 30.",
      [{ id: "a", text: "15" }, { id: "b", text: "20" }, { id: "c", text: "25" }, { id: "d", text: "30" }],
      ["b"]),
    createQuestion("Average of first 3 natural numbers (1, 2, 3) is?",
      [{ id: "a", text: "1" }, { id: "b", text: "2" }, { id: "c", text: "3" }, { id: "d", text: "1.5" }],
      ["b"])
  ],
  "Percentage": [
    createQuestion("What is 50% of 100?",
      [{ id: "a", text: "25" }, { id: "b", text: "50" }, { id: "c", text: "75" }, { id: "d", text: "100" }],
      ["b"]),
    createQuestion("Convert 1/2 to percentage.",
      [{ id: "a", text: "25%" }, { id: "b", text: "50%" }, { id: "c", text: "75%" }, { id: "d", text: "100%" }],
      ["b"]),
    createQuestion("What is 10% of 50?",
      [{ id: "a", text: "5" }, { id: "b", text: "10" }, { id: "c", text: "15" }, { id: "d", text: "20" }],
      ["a"])
  ],
  "Area & Volume": [
    createQuestion("Area of a square with side 4cm is?",
      [{ id: "a", text: "8 cm²" }, { id: "b", text: "16 cm²" }, { id: "c", text: "12 cm²" }, { id: "d", text: "20 cm²" }],
      ["b"]),
    createQuestion("Volume of a cube with side 2cm is?",
      [{ id: "a", text: "4 cm³" }, { id: "b", text: "8 cm³" }, { id: "c", text: "6 cm³" }, { id: "d", text: "12 cm³" }],
      ["b"]),
    createQuestion("Formula for area of rectangle is?",
      [{ id: "a", text: "l + b" }, { id: "b", text: "l x b" }, { id: "c", text: "2(l+b)" }, { id: "d", text: "l/b" }],
      ["b"])
  ],
  // Add placeholders for other topics to ensure script runs for all 20
  "Interest": [
    createQuestion("Simple Interest formula is?", [{ id: "a", text: "PTR/100" }, { id: "b", text: "P(1+R/100)" }], ["a"]),
    createQuestion("Interest on 100 at 10% for 1 year?", [{ id: "a", text: "10" }, { id: "b", text: "100" }], ["a"]),
    createQuestion("Principal amount represents?", [{ id: "a", text: "Initial money" }, { id: "b", text: "Interest" }], ["a"])
  ],
  "Boats & Streams": [
    createQuestion("Speed downstream is?", [{ id: "a", text: "u + v" }, { id: "b", text: "u - v" }], ["a"]),
    createQuestion("Speed upstream is?", [{ id: "a", text: "u + v" }, { id: "b", text: "u - v" }], ["b"]),
    createQuestion("Still water means speed of stream is?", [{ id: "a", text: "0" }, { id: "b", text: "Max" }], ["a"])
  ],
  "Calendar": [
    createQuestion("How many days in a leap year?", [{ id: "a", text: "365" }, { id: "b", text: "366" }], ["b"]),
    createQuestion("January has how many days?", [{ id: "a", text: "30" }, { id: "b", text: "31" }], ["b"]),
    createQuestion("How many weeks in a year?", [{ id: "a", text: "52" }, { id: "b", text: "50" }], ["a"])
  ],
  "Clock": [
    createQuestion("Angle of a full circle is?", [{ id: "a", text: "180" }, { id: "b", text: "360" }], ["b"]),
    createQuestion("How many minutes in an hour?", [{ id: "a", text: "60" }, { id: "b", text: "100" }], ["a"]),
    createQuestion("Hour hand completes one rotation in?", [{ id: "a", text: "12 hrs" }, { id: "b", text: "24 hrs" }], ["a"])
  ],
  "Cubes": [
    createQuestion("A cube has how many faces?", [{ id: "a", text: "4" }, { id: "b", text: "6" }], ["b"]),
    createQuestion("A cube has how many corners?", [{ id: "a", text: "6" }, { id: "b", text: "8" }], ["b"]),
    createQuestion("Shape of a die is?", [{ id: "a", text: "Cube" }, { id: "b", text: "Sphere" }], ["a"])
  ],
  "Time & Distance": [
    createQuestion("Speed = ?", [{ id: "a", text: "Distance/Time" }, { id: "b", text: "Time/Distance" }], ["a"]),
    createQuestion("Distance = ?", [{ id: "a", text: "Speed x Time" }, { id: "b", text: "Speed/Time" }], ["a"]),
    createQuestion("Unit of speed is?", [{ id: "a", text: "km/hr" }, { id: "b", text: "km" }], ["a"])
  ],
  "Number Series": [
    createQuestion("Next in 2, 4, 6, ...?", [{ id: "a", text: "7" }, { id: "b", text: "8" }], ["b"]),
    createQuestion("Next in 1, 3, 5, ...?", [{ id: "a", text: "6" }, { id: "b", text: "7" }], ["b"]),
    createQuestion("Next in 10, 20, 30, ...?", [{ id: "a", text: "40" }, { id: "b", text: "50" }], ["a"])
  ],
  "Mixtures": [
    createQuestion("Mixture of milk and water is called?", [{ id: "a", text: "Solution" }, { id: "b", text: "Solid" }], ["a"]),
    createQuestion("Pure water is a?", [{ id: "a", text: "Mixture" }, { id: "b", text: "Compound" }], ["b"]),
    createQuestion("Alloy is a mixture of?", [{ id: "a", text: "Metals" }, { id: "b", text: "Gases" }], ["a"])
  ],
  "Trains": [
    createQuestion("Train length is considered as?", [{ id: "a", text: "Distance" }, { id: "b", text: "Speed" }], ["a"]),
    createQuestion("Relative speed in same direction?", [{ id: "a", text: "Add" }, { id: "b", text: "Subtract" }], ["b"]),
    createQuestion("Relative speed in opposite direction?", [{ id: "a", text: "Add" }, { id: "b", text: "Subtract" }], ["a"])
  ],
  "Numbers": [
    createQuestion("Smallest prime number?", [{ id: "a", text: "1" }, { id: "b", text: "2" }], ["b"]),
    createQuestion("Is 1 a prime number?", [{ id: "a", text: "Yes" }, { id: "b", text: "No" }], ["b"]),
    createQuestion("Even number is divisible by?", [{ id: "a", text: "2" }, { id: "b", text: "3" }], ["a"])
  ],
  "Time & Work": [
    createQuestion("If A does work in 2 days, 1 day work is?", [{ id: "a", text: "1/2" }, { id: "b", text: "2" }], ["a"]),
    createQuestion("More workers means time taken is?", [{ id: "a", text: "Less" }, { id: "b", text: "More" }], ["a"]),
    createQuestion("Work = ?", [{ id: "a", text: "Rate x Time" }, { id: "b", text: "Rate/Time" }], ["a"])
  ],
  "Partnership": [
    createQuestion("Profit is shared based on?", [{ id: "a", text: "Investment" }, { id: "b", text: "Age" }], ["a"]),
    createQuestion("Sleeping partner invests?", [{ id: "a", text: "Money" }, { id: "b", text: "Time" }], ["a"]),
    createQuestion("Active partner manages?", [{ id: "a", text: "Business" }, { id: "b", text: "Nothing" }], ["a"])
  ],
  "Probability": [
    createQuestion("Probability of Heads in coin toss?", [{ id: "a", text: "1/2" }, { id: "b", text: "1/4" }], ["a"]),
    createQuestion("Max probability value is?", [{ id: "a", text: "1" }, { id: "b", text: "100" }], ["a"]),
    createQuestion("Probability of impossible event?", [{ id: "a", text: "0" }, { id: "b", text: "1" }], ["a"])
  ],
  "Pipes & Cisterns": [
    createQuestion("Inlet pipe does what?", [{ id: "a", text: "Fills" }, { id: "b", text: "Empties" }], ["a"]),
    createQuestion("Outlet pipe does what?", [{ id: "a", text: "Fills" }, { id: "b", text: "Empties" }], ["b"]),
    createQuestion("Tank capacity is?", [{ id: "a", text: "Volume" }, { id: "b", text: "Area" }], ["a"])
  ],
  "Profit & Loss": [
    createQuestion("Profit = ?", [{ id: "a", text: "SP - CP" }, { id: "b", text: "CP - SP" }], ["a"]),
    createQuestion("Loss = ?", [{ id: "a", text: "SP - CP" }, { id: "b", text: "CP - SP" }], ["b"]),
    createQuestion("CP stands for?", [{ id: "a", text: "Cost Price" }, { id: "b", text: "Selling Price" }], ["a"])
  ],
  "Permutations": [
    createQuestion("Permutation means?", [{ id: "a", text: "Arrangement" }, { id: "b", text: "Selection" }], ["a"]),
    createQuestion("Combination means?", [{ id: "a", text: "Arrangement" }, { id: "b", text: "Selection" }], ["b"]),
    createQuestion("0! (Zero factorial) is?", [{ id: "a", text: "0" }, { id: "b", text: "1" }], ["b"])
  ]
};

async function seedLevel1Questions() {
  console.log("🚀 Starting GK3 Level 1 Question Seeding...");

  // 1. Fetch GK3 Topics
  console.log(`📦 Fetching GK3 Topics...`);
  let gk3Topics = [];
  try {
    const response = await fetch(`${API_BASE_URL}/api/subjects/${SUBJECT_ID}?populate=topics`, {
      headers: { "Authorization": `Bearer ${BEARER_TOKEN}` }
    });
    const json = await response.json();
    if (json.data && json.data.topics) {
      gk3Topics = json.data.topics;
    }
  } catch (error) {
    console.error("❌ Failed to fetch GK3 topics:", error);
    return;
  }

  console.log(`✅ Found ${gk3Topics.length} Topics.`);

  // 2. Create Questions for each Topic
  for (const topic of gk3Topics) {
    const topicName = topic.name;
    const questions = QUESTIONS_DATA[topicName];

    if (!questions) {
      console.warn(`⚠️ No questions defined for topic: ${topicName}`);
      continue;
    }

    console.log(`\n📝 Creating 3 questions for topic: ${topicName}`);

    for (const qData of questions) {
      try {
        const payload = {
          data: {
            ...qData,
            subjectRef: SUBJECT_ID,
            topicRef: topic.documentId,
            subject: "GK3", // Legacy field
            chapter: topicName // Legacy field
          }
        };

        const response = await fetch(`${API_BASE_URL}/api/questions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${BEARER_TOKEN}`
          },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          process.stdout.write("✅");
        } else {
          const error = await response.json();
          console.error(`\n❌ Failed to create question:`, JSON.stringify(error));
        }
      } catch (err) {
        console.error(`\n❌ Error:`, err.message);
      }
      // Rate limit
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  console.log("\n\n✨ Level 1 Seeding Completed!");
}

seedLevel1Questions();
