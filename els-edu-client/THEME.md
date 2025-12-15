# Theme Context & Project Overview

**Project:** ELS Kids Client (Kids/Adult App - High Premium Feel)
**Goal:** Create a stunning, responsive, and "alive" interface for users to browse content, take quizzes, and view dashboards.
**Tech Stack:** React, React Admin, Vite, Tailwind CSS (Design System).

## Design System

### Typography
**Font:** Noto Sans Tamil Supplement

### Color Palette (Adaptive Light/Dark)
The application uses a semantic 50-950 scaling system for:
- **Text**: Base typography colors.
- **Background**: Page backgrounds.
- **Primary**: Main action colors (Yellow/Gold tones in Light mode).
- **Secondary**: Supportive colors (Blue tones).
- **Accent**: Highlight/Special interaction colors (Purple tokens).

### Styles Strategy
- **Framework:** Tailwind CSS is the primary styling engine.
- **Components:** React Admin is used for the data-grid and admin shell, but custom components should use Tailwind classes (`className="..."`).
- **MUI:** Minimized. Only used where React Admin forces it. Overridden via `theme.js` or global CSS where possible to align with the "Premium" look.

## Core Vibe
- **Vibrant & Premium:** Avoid generic flat colors. Use the specific custom tokens provided.
- **Dynamic:** Hover effects, micro-animations (to be implemented).
- **Glassmorphism:** Encouraged for cards/overlays (future implementation).
