# Custom Progress Update API

This custom Strapi API handles progress tracking with Ably real-time updates.

## Structure

```
custom-progress-update/
├── controllers/
│   └── custom-progress-update.js  # API endpoint handlers
├── routes/
│   └── custom-progress-update.js  # Route definitions
└── README.md
```

## Endpoints

All endpoints are automatically prefixed with `/api/custom-progress-update/`

- `POST /api/custom-progress-update/complete-lesson`
- `POST /api/custom-progress-update/start-kit`
- `POST /api/custom-progress-update/start-lesson`

## Services

The core logic is in `/src/api/services/progress-service.js`

## Debug Logging

All Ably events are logged with `[ABLY]` prefix for easy filtering.
