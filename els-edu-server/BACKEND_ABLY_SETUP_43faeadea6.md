# Backend Ably Setup Instructions

## Prerequisites

1. Create Ably account at https://ably.com/
2. Get your API key from the Ably dashboard

## Installation Steps

### 1. Install Ably in Strapi Backend

```bash
cd path/to/your/strapi/backend
npm install ably
```

### 2. Add Environment Variable

Add to your backend `.env` file:

```
ABLY_API_KEY=your_ably_api_key_here
```

### 3. Create Ably Configuration File

Create: `config/ably.js`

```javascript
const Ably = require("ably");

let ablyClient = null;

const getAblyClient = () => {
  if (!ablyClient) {
    const apiKey = process.env.ABLY_API_KEY;
    if (!apiKey) {
      console.error("❌ ABLY_API_KEY not found in environment variables");
      return null;
    }
    ablyClient = new Ably.Realtime(apiKey);
    console.log("✅ Ably client initialized");
  }
  return ablyClient;
};

const publishToAbly = async (channelName, eventName, data) => {
  try {
    const client = getAblyClient();
    if (!client) return;

    const channel = client.channels.get(channelName);
    await channel.publish(eventName, data);
    console.log(`📡 Published to Ably: ${channelName}/${eventName}`, {
      userId: data.userId,
      type: data.type,
    });
  } catch (error) {
    console.error("❌ Ably publish error:", error);
  }
};

module.exports = {
  getAblyClient,
  publishToAbly,
};
```

### 4. Create Lifecycle Hook for user_lesson

Create: `src/api/user-lesson/content-types/user-lesson/lifecycles.js`

```javascript
const { publishToAbly } = require("../../../../../config/ably");

module.exports = {
  async afterCreate(event) {
    const { result } = event;

    // Get user ID from the relation
    const userId = result.user?.id || result.user;

    if (!userId) {
      console.warn("⚠️ No user ID found in user_lesson afterCreate");
      return;
    }

    await publishToAbly(`progress:user:${userId}`, "lesson:created", {
      type: "lesson:created",
      userId: userId,
      lessonId: result.lesson?.id || result.lesson,
      documentId: result.documentId,
      is_completed: result.is_completed,
      completion_date: result.completion_date,
      timestamp: new Date().toISOString(),
    });
  },

  async afterUpdate(event) {
    const { result } = event;

    const userId = result.user?.id || result.user;

    if (!userId) {
      console.warn("⚠️ No user ID found in user_lesson afterUpdate");
      return;
    }

    await publishToAbly(`progress:user:${userId}`, "lesson:updated", {
      type: "lesson:updated",
      userId: userId,
      lessonId: result.lesson?.id || result.lesson,
      documentId: result.documentId,
      is_completed: result.is_completed,
      completion_date: result.completion_date,
      timestamp: new Date().toISOString(),
    });
  },
};
```

### 5. Create Lifecycle Hook for user_level

Create: `src/api/user-level/content-types/user-level/lifecycles.js`

```javascript
const { publishToAbly } = require("../../../../../config/ably");

module.exports = {
  async afterCreate(event) {
    const { result } = event;

    const userId = result.user?.id || result.user;

    if (!userId) {
      console.warn("⚠️ No user ID found in user_level afterCreate");
      return;
    }

    await publishToAbly(`progress:user:${userId}`, "level:created", {
      type: "level:created",
      userId: userId,
      levelId: result.level?.id || result.level,
      documentId: result.documentId,
      completed_lessons_count: result.completed_lessons_count,
      isCompleted: result.isCompleted,
      timestamp: new Date().toISOString(),
    });
  },

  async afterUpdate(event) {
    const { result } = event;

    const userId = result.user?.id || result.user;

    if (!userId) {
      console.warn("⚠️ No user ID found in user_level afterUpdate");
      return;
    }

    await publishToAbly(`progress:user:${userId}`, "level:updated", {
      type: "level:updated",
      userId: userId,
      levelId: result.level?.id || result.level,
      documentId: result.documentId,
      completed_lessons_count: result.completed_lessons_count,
      isCompleted: result.isCompleted,
      timestamp: new Date().toISOString(),
    });
  },
};
```

### 6. Create Lifecycle Hook for kitprogress

Create: `src/api/kitprogress/content-types/kitprogress/lifecycles.js`

```javascript
const { publishToAbly } = require("../../../../../config/ably");

module.exports = {
  async afterUpdate(event) {
    const { result } = event;

    const userId = result.user?.id || result.user;

    if (!userId) {
      console.warn("⚠️ No user ID found in kitprogress afterUpdate");
      return;
    }

    await publishToAbly(`progress:user:${userId}`, "kit:updated", {
      type: "kit:updated",
      userId: userId,
      kitId: result.kit?.id || result.kit,
      documentId: result.documentId,
      completed_lessons_count: result.completed_lessons_count,
      total_lessons_count: result.total_lessons_count,
      completion_percentage: result.completion_percentage,
      timestamp: new Date().toISOString(),
    });
  },
};
```

## Testing Backend

1. Restart your Strapi server
2. Check console for: `✅ Ably client initialized`
3. Complete a lesson and watch for: `📡 Published to Ably: progress:user:{userId}/lesson:updated`

## Troubleshooting

- If no events publish, check ABLY_API_KEY is set correctly
- Verify lifecycle files are in correct directories
- Check Strapi logs for errors
- Use Ably dashboard to monitor live events

## Next Steps

After backend is set up, proceed with frontend integration (see frontend files).
