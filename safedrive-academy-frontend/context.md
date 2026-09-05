# Driving School Project Context (`context.md`)

*This file records the core requirements, user preferences, design choices, and business context for the SafeDrive Academy driving school platform.*

---

## 1. Project Overview & Identity (Indian Context)
- **Website Name**: SafeDrive Academy
- **Domain**: Multi-Page Driving School Platform with MongoDB Database & Student/Staff/Owner Portals
- **Currency**: Indian Rupees (**₹ INR**) across all payment ledgers, receipts, and fee cards.
- **Phone Format**: Indian **+91 XXXXX XXXXX** mobile number standard.
- **Office Mobile Helpline**: `+91 98765 43210` (`tel:+919876543210`).
- **Design Philosophy**: Minimal, gallery-white monochrome system adhering to `DESIGN.md` (Mobbin design language).

---

## 2. Multi-Page Routes & Role Capabilities

### 1. Landing Page (`/` - `app/page.tsx`)
- Minimal Floating Stadium Navbar (Logo + Single "Sign In" button).
- Minimal Hero: *"Master safe driving with certified training."*
- Exactly 2 Course Cards (4-Wheeler & 2-Wheeler Training with direct call "Enroll Now" buttons).
- Full-bleed near-black `#141414` footer.

### 2. First-Time Student Activation & Password Setup
- In the Sign In modal, students can click: *"New student? Set up password & activate account →"*
- **Step 1**: Student enters their registered Indian Mobile Number (`+91 98765 43210`).
- **Step 2**: Backend verifies via `/api/auth/verify-phone` that the student has been registered by staff & approved by the Owner.
- **Step 3**: Student sets a fresh password (verified via `/api/auth/set-password`) and is logged in directly to `/dashboard`.

### 3. Service & Course Taxonomy (Learned Invariants)
- **4-Wheeler Training (With License)**:
  - **Group Class**: **80 km** practical driving target.
  - **Personal Class**: **120 km** practical driving target.
- **4-Wheeler Training (Without License)**:
  - **Group Class**: **80 km** practical driving target.
  - **Personal Class**: **120 km** practical driving target.
- **2-Wheeler Training (With License)**:
  - **Bike (Motorcycle with Gear)**: **15 Days** (1 hr/day practical training, no km tracking).
  - **Scooty (Gearless Scooter)**: **15 Days** (1 hr/day practical training, no km tracking).
- **2-Wheeler Training (Without License)**:
  - **Bike (Motorcycle with Gear)**: **15 Days** (1 hr/day practical training, no km tracking).
  - **Scooty (Gearless Scooter)**: **15 Days** (1 hr/day practical training, no km tracking).
- **License-Only Services (Non-Training / Direct RTO)**:
  - **Learner License (LL) Only**
  - **Permanent DL Assistance Only**
  - **License Renewal / Duplicate**
  - **Endorsement / Commercial RTO Work**
  *(0 km / No practical training; tracks RTO application stages and payment ledger)*.

### 4. Adaptive Progress Tracking & Role Privileges
- **4-Wheeler Students**: Kilometer tracking (80 km or 120 km). Draggable range slider for Owner, View-only progress meter for Staff.
- **2-Wheeler Students**: 15-Day session tracking (`X / 15 Days Completed · 1 hr/day`). Day stepper/slider for Owner, View-only for Staff.
- **License-Only Clients**: Practical training card is hidden; shows direct RTO application status and financial dues.
- **Staff Role (`admin_staff`)**: Can submit New Student requests (with cascading 2-tier service selector), submit payment requests, and view students/progress.
- **Owner Role (`admin_owner`)**: Has full authorization to approve/reject student and payment requests, adjust student kilometers (4W) and training days (2W), delete students, and review analytics.

---

## 3. Database Architecture (MongoDB & Mongoose)
- **`Student` Model (`backend/models/Student.ts`)**: Mongoose schema storing Name, Phone (`+91`), VehicleType, CoursePackage, AssignedInstructor, TargetKm, CompletedKm, TotalCourseFee, TotalPaid, RemainingDue, DueDateNote, and Payments list.
- **`PendingRequest` Model (`backend/models/PendingRequest.ts`)**: Mongoose schema storing staff new student requests with extensible category dropdown options.
- **`User` Model (`backend/models/User.ts`)**: Mongoose schema for Student, Staff, and Owner authentication credentials.
- **Connection Handler (`backend/lib/mongodb.ts`)**: Mongoose connection pooling with caching and robust persistent memory fallback.

---

## 4. Visual & Styling Invariants (`DESIGN.md` - Mobbin Monochrome)
- **Primary Color**: Ink Black (`#141414`).
- **Surfaces**: Canvas (`#ffffff`), Soft Canvas (`#f3f3f3`), Field (`#f0f0f0`), Hairlines (`#e0e0e0` / `#f0f0f0`).
- **Shapes**: Stadium pills (`rounded-full`) for all buttons and chips; `24px` (`rounded-[24px]`) for cards and footer top corners; `16px` (`rounded-[16px]`) for inner elements and inputs.
- **Elevation**: Shadow-free flat elevation.
