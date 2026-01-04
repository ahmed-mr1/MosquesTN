# 🕌 Tunisian Mosques API
**A public platform & API to build the digital network of mosques in Tunisia**

---

## 📌 Project Vision
Tunisian Mosques API aims to:

- Provide **reliable, structured, accessible information** about mosques in Tunisia  
- Allow the **community to contribute** by adding mosques, updating details, and reviewing  
- Ensure **data quality** using layered verification:
  - AI moderation  
  - Admin approval  
  - Community verification  

This project is developed as part of **Web Services Course**, focusing on building a real-world scalable API & ecosystem.

---

## 👥 Target Users
- General public searching for mosques
- Travelers / visitors
- Muslim community
- Developers building Islamic or location-based services
- Researchers and city-planning initiatives

---

## ✅ Core Features

### 🕌 Mosque Database
Stores detailed mosque info:
- Name (Arabic + Standard)
- Mosque Type: مسجد / جامع / مصلى
- Location hierarchy:
  - Governorate  
  - Delegation / Municipality  
  - City  
  - Neighborhood  
  - GPS Coordinates  
- Services:
  - Friday Prayer  
  - Regular Prayers  
  - Ramadan services  
  - Eid prayers  
  - Taraweeh  
- Facilities:
  - Women’s Section  
  - Accessibility  
  - Parking  
  - Wudu / Washrooms  
  - Library  
  - Education programs  
- Management:
  - Imam details  
  - Organization  
- Verification Levels:
  - Unverified  
  - AI Verified  
  - Admin Verified  
  - Community Verified  

---

### ⭐ Reviews & Community
- Star ratings  
- Structured ratings:
  - Cleanliness  
  - Facilities  
  - Sound System  
  - Organization  
  - Washrooms  
  - Shelves organization  
  - Jumuah experience  
- Optional free-text review  
- Anonymous reviews allowed  
- AI moderation to remove:
  - Hate speech  
  - Spam  
  - Irrelevant content  

---

### 👤 User Accounts & Trust System
- Phone-based authentication
- Roles:
  - Normal User  
  - Trusted Contributor  
  - Moderator  
  - Admin  
- Contribution points:
  - Mosque added → points  
  - Mosque confirmed → small points  
  - Reviews → small points  
- Conflict resolution:
  - System stores data history  
  - Trust-based probability chooses most accurate data  

---

### 📍 Geographic & Search
- Search by:
  - Governorate  
  - City  
  - Mosque type  
  - Verification status  
  - Facilities  
- Nearby mosques within X km  
- Map display  
- Google Maps navigation support  

---

### 🕒 Prayer Timing System
- Adhan times from external API (based on location)
- Iqama times crowdsourced per mosque
- Jumuah Khutba time
- Eid timings
- Ramadan timings (future)

---

## 🧩 Tech Stack

### Backend (API)
- Python + Flask  
- REST API  
- PostgreSQL + PostGIS  
- SQLAlchemy  
- JWT Authentication  
- AI Moderation (OpenAI)  
- Azure Hosting  

---

### Mobile App (Main Platform)
- React Native + Expo  
- Firebase Phone Authentication  
- React Native Maps  
- Axios  

---

### Admin Panel (Web Dashboard)
- React  
- TailwindCSS  
- Admin + Moderator Dashboard Tools  

---

## ☁️ Deployment & Infrastructure
- Hosted on **Azure** using $100 student credits
- Backend: Azure App Service
- Database: Azure PostgreSQL + PostGIS
- Media: Azure Blob Storage
- Monitoring: Azure Monitor
- Authentication: Firebase
- Maps: Google Maps / Mapbox

---

