![TwinPath preview](./public/TwinPath.png)

# TwinPath — Mentorship Platform (Next.js)

A modern mentorship web app where people find trusted mentors in the areas they care about — **Cyber Security**, **Software Development**, **Automation**, and more. Mentors share real-world knowledge through **blog articles**, build structured **courses**, and form **1:1 mentor–mentee relationships** with learning tracks, chat, and video calls.

> Think of it like a “gym + personal trainer” for skills: mentors provide the plan (track), the lessons (articles/courses), and the coaching (chat/calls) — mentees do the reps and level up.

---

## ✨ Core Features

### 🔎 Discover & Match

- Browse mentors by category (Cyber Security, Software Dev, Automation, etc.)
- Filter by skills, level, availability, language, rating
- Mentor profiles with experience, specialties, and content

### 🧠 Knowledge Sharing

- **Blog module** for articles, guides, and resources
- Tags, categories, search, featured posts
- Draft/publish flow for mentors

### 🎓 Courses & Learning Tracks

- Mentors create structured courses (modules/lessons)
- Mentees follow a **Track** to master a topic (milestones, checkpoints)
- Progress tracking (completed lessons, quizzes/tasks—optional)

### 🤝 Mentorship Relationships

- Request / accept mentorship
- Track goals + learning roadmap per mentee
- Shared space for materials, assignments, feedback

### 💬 Real-time Communication

- Direct messaging between mentee and mentor
- Notifications for messages, mentorship updates, new content

### 📹 Video Calls (Mentorship Sessions)

- Schedule sessions (calendar integration optional)
- In-app video calls (WebRTC / third-party provider)

### 🔐 Trust & Safety (Platform-first)

- Mentor verification signals (portfolio, endorsements, moderation)
- Reporting + moderation workflow (recommended)
- Access control (roles: admin/mentor/mentee)

---

## 🧱 Tech Stack (typical setup)

- **Next.js** (App Router recommended)
- **TypeScript**
- **Auth**: Better Auth
- **UI**: Tailwind CSS + shadcn/ui
- **Realtime**: WebSockets / Pusher / Supabase Realtime
- **Video**: WebRTC (custom) or Daily/Twilio (managed)
- **Storage**: Convex Baas
- **Email**: Resend / SendGrid (verification + notifications)
