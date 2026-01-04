PROJECT NAME:
Tunisian Mosques API

PROJECT TYPE:
Academic project for "Web Services" course
Backend: Flask (Python)
Frontend: React Native (Expo)
Primary goal: REST API design and implementation

PROJECT PURPOSE:
Build a public, community-driven API and mobile app that provides verified,
structured, and up-to-date information about mosques in Tunisia.

The platform allows users to:
- View approved mosques (public, read-only)
- Suggest new mosques
- Add reviews
- Confirm mosque existence (community verification)

All write actions go through moderation and verification.

--------------------------------------------------
GEOGRAPHIC SCOPE
--------------------------------------------------
Country: Tunisia ONLY

Each mosque includes:
- Governorate (required)
- Delegation / Municipality
- City
- Neighborhood
- GPS coordinates
- Full address

Search & filters supported:
- By governorate, city
- Nearby mosques (distance-based)
- Mosque type
- Facilities
- Verification status

--------------------------------------------------
USER MODEL
--------------------------------------------------
Base class: User

User roles:
1) Anonymous User
   - Can view mosques
   - Can add reviews (anonymous)

2) Authenticated User (phone login + verification)
   - Can suggest mosques
   - Can suggest edits
   - Can confirm mosque existence
   - Can add iqama times (as part of suggestion/edit)

3) Moderator
   - Can approve/reject/edit mosque suggestions
   - Can moderate reviews

4) Admin
   - Full control
   - User management
   - Override decisions

Trusted Contributor role is intentionally NOT used in MVP.

--------------------------------------------------
MOSQUE DATA MODEL (APPROVED DATA ONLY)
--------------------------------------------------
Mosque:
- Name
- Arabic name
- Type: مسجد / جامع / مصلى
- Location fields
- Facilities (women section, wudu, parking, accessibility, AC, etc.)
- Prayer info:
  - Adhan times (from external API via location)
  - Iqama times (community-suggested, trust-based)
  - Jumuah time
  - Eid prayer info
- Media (photos)
- Status: Approved only (pending/rejected not visible)

--------------------------------------------------
SUGGESTION & MODERATION MODEL
--------------------------------------------------
MosqueSuggestion:
- Contains full mosque data
- Suggested by authenticated user
- Status:
  - Pending AI Review
  - Rejected
  - Pending Approval
  - Approved

Reviews:
- Linked to mosque
- Star rating + structured criteria
- Free-text comment
- Status: Pending / Approved / Rejected

--------------------------------------------------
AI MODERATION (SERVICE, NOT A DOMAIN CLASS)
--------------------------------------------------
AI moderation is a service step, NOT a database entity.

Used for:
- Mosque suggestions
- Reviews

AI outputs:
- Rejected (spam, hate, nonsense)
- Valid → Pending Approval

Final approval is done by:
- Community confirmations (>= 3)
OR
- Moderator/Admin

--------------------------------------------------
COMMUNITY VERIFICATION RULE
--------------------------------------------------
- Users DO NOT add duplicate mosques
- Users click "Confirm this mosque exists"
- Each confirmation is stored
- When confirmations >= 3 → auto-approved
- Otherwise → moderator/admin approval

--------------------------------------------------
PRAYER TIME STRATEGY
--------------------------------------------------
- Adhan times: external API based on mosque GPS
- Iqama times: community-suggested, stored with history
- Conflicts resolved by:
  - Showing most trusted / most confirmed value
  - Keeping history

--------------------------------------------------
API STYLE & TECH
--------------------------------------------------
API Style: REST
Authentication: Phone number + OTP
Anonymous access allowed for read + reviews
Write actions require authentication

Backend:
- Flask
- SQLAlchemy
- PostgreSQL (recommended)
- JWT authentication

Deployment:
- Azure (using $100 credits)
- Simple VM or Azure App Service
- Optional: Azure PostgreSQL

--------------------------------------------------
ADMIN PANEL
--------------------------------------------------
Web-based admin dashboard
Access: Moderator + Admin

Capabilities:
- Review mosque suggestions
- Review reviews
- See AI result
- See contributor history
- Approve / Reject / Edit
- Leave admin notes

--------------------------------------------------
DESIGN PRINCIPLES
--------------------------------------------------
- Clear separation between:
  - Suggested data
  - Approved data
- No unverified data exposed publicly
- Community-driven but controlled
- MVP-focused (no gamification yet)
- Clean, maintainable, exam-ready architecture

--------------------------------------------------
IMPORTANT NOTE FOR COPILOT
--------------------------------------------------
When generating code:
- Follow this MVP strictly
- Do NOT add extra features
- Prefer clarity over complexity
- Keep models and endpoints minimal and explicit
