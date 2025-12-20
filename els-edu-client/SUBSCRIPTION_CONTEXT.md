# Subscription System Context Reference

This document maps the legacy Kit-based subscription system to the new Course-based system for future reference.

---

## Entity Mapping

| Legacy System     | New System                | Description              |
| ----------------- | ------------------------- | ------------------------ |
| `kit`             | `course`                  | Top-level container      |
| `kitlevel`        | `subject`                 | Mid-level grouping       |
| `lesson`          | `topic` / `content`       | Actual learning content  |
| `kitsubscription` | `usersubscription`        | User's course enrollment |
| `kitprogress`     | (future) `courseprogress` | User's progress tracking |

---

## Subscription Types

```javascript
// subscription_type enum
FREE; // Full access, no payment required
FREEMIUM; // Partial access (some subjects free, some locked)
PAID; // Full access after payment
TRIAL; // Temporary full access
```

---

## usersubscription Schema

```javascript
{
  user: relation,          // User document ID
  course: relation,        // Course document ID
  org: relation,           // Organization document ID
  subjects: relation[],    // All subjects in the course

  subscription_type: enum, // FREE | FREEMIUM | PAID | TRIAL
  paymentstatus: enum,     // ACTIVE | PENDING | EXPIRED | CANCELLED | FAILED

  startdate: date,         // Subscription start
  enddate: date,           // Subscription end (null for FREE)
  auto_renew: boolean,     // Auto-renewal flag

  // Payment fields (for future PAID subscriptions)
  transactionid: string,
  cashfree_order_id: string,
  payment_method: enum,
  amount_paid: decimal,
  last_payment_at: date,
  next_billing_date: date,
}
```

---

## Free Subscription Flow

From [subscriptionService.js](file:///home/dhruv/work-dhruv/hph/els-kids-revamp/els-edu-client/src/services/subscriptionService.js):

```javascript
await subscriptionService.createSubscription(dataProvider, {
  userDocumentId: "xxx",
  courseDocumentId: "yyy",
  orgDocumentId: "zzz",
  subscriptionType: "FREE", // Always FREE for now
  paymentStatus: "ACTIVE",
});
```

This automatically:

1. Fetches course subjects
2. Creates subscription with all subjects included
3. Sets `startdate` to current date
4. Sets `auto_renew` to false

---

## Future Payment Integration

Reference methods from legacy [subscription.js](file:///home/dhruv/work-dhruv/hph/els-kids-revamp/els-edu-server/src/api/payment/services/subscription.js):

**For PAID subscriptions**:

- Add `calculateEndDate(option, duration)` for subscription periods
- Add `pricing` relation for payment plans
- Handle UPGRADE from FREE to PAID
- Implement idempotency checks for payment webhooks

**For FREEMIUM**:

- Unlock only subjects/topics marked as `is_free`
- Track `unlocked_subjects` similar to legacy `unlocked_levels`

---

## Key Components

| File                                                                                                                                        | Purpose                              |
| ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| [subscriptionService.js](file:///home/dhruv/work-dhruv/hph/els-kids-revamp/els-edu-client/src/services/subscriptionService.js)              | Reusable service for CRUD operations |
| [SubscriptionProvider.jsx](file:///home/dhruv/work-dhruv/hph/els-kids-revamp/els-edu-client/src/contexts/SubscriptionProvider.jsx)          | React context (reference)            |
| [MySubscriptionsPage.jsx](file:///home/dhruv/work-dhruv/hph/els-kids-revamp/els-edu-client/src/pages/subscriptions/MySubscriptionsPage.jsx) | Lists user's courses                 |
| [CourseSubjectsPage.jsx](file:///home/dhruv/work-dhruv/hph/els-kids-revamp/els-edu-client/src/pages/subscriptions/CourseSubjectsPage.jsx)   | Shows subjects in course             |
