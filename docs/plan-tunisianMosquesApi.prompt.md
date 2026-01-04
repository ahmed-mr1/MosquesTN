Acknowledged. Here’s a focused plan aligned to your project_context, prioritizing the fastest path to a usable MVP while keeping the architecture clean.

## MVP Scope
- Public directory: Approved mosques only; anonymous read access.
- Contributions: Authenticated users can suggest mosques/edits, add reviews, and confirm existence.
- Moderation: AI pre-filter → community confirmations (>= 3) → moderator/admin final approval.
- Prayer data: Adhan via external API by GPS; Iqama crowdsourced with history and trust.
- Roles: Anonymous, Authenticated, Moderator, Admin (Trusted Contributor excluded from MVP).

## Domain Model
- Mosque: Approved record; location hierarchy, facilities, prayer info, media, verification status.
- MosqueSuggestion: Full payload, authored by user; statuses (Pending AI Review, Rejected, Pending Approval, Approved); linked to user.
- Review: Linked to mosque; rating + structured criteria + text; statuses (Pending, Approved, Rejected); anonymous allowed but moderated.
- Confirmation: Linked to mosque (or target suggestion if needed); stored per user; threshold auto-approves.
- User: Base profile with roles (Anonymous implied, Authenticated, Moderator, Admin).
- IqamaHistory: Time records with contributor and trust/confirmation count for conflict resolution.
- ModerationLog: Actions and notes by AI/moderator/admin for auditability.
- MediaAsset: Photos linked to mosque/suggestion; moderated.

## Minimal REST Endpoints
- Public Read:
  - GET `/mosques`: filters by governorate/city/type/facilities/status; pagination.
  - GET `/mosques/{id}`: details including aggregated verification and iqama current value.
  - GET `/mosques/nearby?lat=...&lng=...&radius=...`: geospatial query.
- Suggestions & Confirmations:
  - POST `/suggestions/mosques`: create mosque suggestion (auth).
  - GET `/suggestions/mosques`: list own suggestions; moderator view with status filters.
  - POST `/mosques/{id}/confirmations`: add confirmation (auth).
- Reviews:
  - GET `/mosques/{id}/reviews`: approved reviews.
  - POST `/mosques/{id}/reviews`: create review (anonymous or auth, still moderated).
- Moderation:
  - GET `/moderation/queue`: pending suggestions/reviews (moderator/admin).
  - POST `/moderation/suggestions/{id}/approve|reject|edit`: decision endpoints.
  - POST `/moderation/reviews/{id}/approve|reject`: decision endpoints.
- Auth:
  - POST `/auth/otp/start`: start phone OTP (if server-side OTP).
  - POST `/auth/otp/verify`: verify OTP → issue JWT.
  - POST `/auth/firebase/verify`: exchange Firebase ID token → issue JWT (if Firebase chosen).
  - GET `/auth/me`: profile + roles.

## Sequencing (First Deliverables)
1. Define PostgreSQL schema: `mosques`, `mosque_suggestions`, `reviews`, `confirmations`, `iqama_history`, `moderation_logs`, `media_assets`, `users/roles`.
2. Implement read-only endpoints: GET `/mosques`, `/mosques/{id}`, `/mosques/nearby` with filters and pagination.
3. Add JWT auth plumbing and phone OTP flow (choose Firebase exchange vs server-side OTP).
4. Implement mosque suggestions creation + AI moderation stub → status transitions.
5. Implement confirmations endpoint and auto-approval rule (>= 3 confirmations) with duplicate-check logic.
6. Add reviews submission + moderation pipeline; surface approved reviews in read API.
7. Build moderator endpoints (queue + approve/reject/edit) and role-based access control.
8. Integrate adhan external API and iqama history selection strategy (most confirmed/trusted).

## Environment Assumptions
- Database: PostgreSQL with PostGIS; `mosques.location` as `geometry(Point, 4326)`; geospatial indexes; use ST_DWithin for nearby.
- Migrations: Flask-Migrate (Alembic) managing versioned schema; seed governorate/city data.
- Auth: JWT via Flask-JWT-Extended; phone OTP via Firebase Auth (mobile) with backend token exchange, or Twilio/OTPs if not using Firebase.
- AI Moderation: Service layer hook (OpenAI stub) gating to Pending Approval; final decisions via confirmations/moderators.
- Media: Store references (e.g., Azure Blob Storage) with signed URLs; moderation status on uploads.

## Clarifying Questions
- PostGIS: Confirm using PostGIS; should we add GeoAlchemy2 and configure SRID 4326 for geospatial queries?
- OTP Strategy: Use Firebase Auth token exchange or implement server-side OTP (Twilio)? Mobile already includes Firebase; prefer exchange?
- Anonymous Reviews: Keep anonymous submissions in MVP or require auth to simplify moderation/abuse controls?
- Duplicate Detection: Define rule (name + location within X meters) and whether suggestions can link to existing mosque for edits vs new entries.
- Adhan Provider: Which external API should we use (e.g., Aladhan, custom calc)? Any constraints?
- Azure Resources: Confirm targets (App Service + Azure PostgreSQL + Blob Storage). Any required regions or quotas?
- Admin Panel Scope: For MVP, limit to suggestion/review moderation and notes, or include edit-approved-mosque fields too?
