// Create database and collections
db = db.getSiblingDB('els_database');

// Create collections
db.createCollection('users');
db.createCollection('subjects');
db.createCollection('topics');
db.createCollection('questions');
db.createCollection('quizzes');

// Create indexes for better performance
db.users.createIndex({ "email": 1 }, { unique: true });
db.subjects.createIndex({ "code": 1 }, { unique: true });
db.questions.createIndex({ "subject_id": 1, "topic_id": 1 });
db.quizzes.createIndex({ "created_by": 1 });

// Insert sample data
db.users.insertOne({
    name: "Admin User",
    email: "admin@els-system.com",
    role: "admin",
    created_at: new Date()
});

db.subjects.insertOne({
    name: "Mathematics",
    code: "MATH-101",
    description: "Basic Mathematics",
    level: "High School",
    created_at: new Date()
});

print("Database initialized successfully!");
