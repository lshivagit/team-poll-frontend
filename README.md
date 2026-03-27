Here’s a **clean, minimal, professional README** with all fluff removed and properly formatted for direct paste:

````markdown
# Team Poll - Real-Time Decision App

A real-time team polling application built with **Rust (Axum)** and **Next.js (App Router)**.  
Features include live result streaming, authentication, and optimized performance.

---

## 🚀 Setup

### Backend (Rust / Axum)
**Path:** `team-poll-backend-main/`

**Requirements**
- Rust
- MySQL

**Steps**
1. Create database:
   ```sql
   CREATE DATABASE team_poll;

-- =========================
-- POLLS TABLE
-- =========================
CREATE TABLE polls (
    id CHAR(36) NOT NULL PRIMARY KEY,
    team_id CHAR(36) NOT NULL,
    created_by CHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    about TEXT,
    multiple_choice BOOLEAN DEFAULT FALSE,
    status ENUM('open', 'closed') DEFAULT 'open',
    closes_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (team_id)
        REFERENCES teams(id)
        ON DELETE CASCADE,

    FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- =========================
-- CHOICES TABLE
-- =========================
CREATE TABLE choices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    poll_id CHAR(36) NOT NULL,
    option_text VARCHAR(255) NOT NULL,

    FOREIGN KEY (poll_id)
        REFERENCES polls(id)
        ON DELETE CASCADE
);

-- =========================
-- VOTES TABLE
-- =========================
CREATE TABLE votes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    poll_id CHAR(36) NOT NULL,
    option_id INT NOT NULL,
    user_id CHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY unique_vote (poll_id, user_id, option_id),

    FOREIGN KEY (poll_id)
        REFERENCES polls(id)
        ON DELETE CASCADE,

    FOREIGN KEY (option_id)
        REFERENCES choices(id)
        ON DELETE CASCADE,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

````

2. Create `.env`:

   ```env
   DATABASE_URL=mysql://username:password@localhost/team_poll
   PORT=3000
   ```

3. Run migrations (if using SQLx):

   ```bash
   sqlx migrate run
   ```

4. Start server:

   ```bash
   cargo run
   ```

Backend runs on: `http://localhost:3000`

---

### Frontend (Next.js)

**Path:** `team-poll-frontend-main/`

**Steps**

1. Install:

   ```bash
   npm install
   ```

2. Create `.env.local`:

   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3000
   ```

3. Start:

   ```bash
   npm run dev
   ```

Frontend runs on: `http://localhost:3001`

---

## 🏗️ Architecture

### Real-Time: SSE

* Uses Server-Sent Events instead of WebSockets
* Lightweight, HTTP-based, auto-reconnect
* Ideal for one-way live updates (votes)

### Performance Optimizations

**Lazy SSE (Intersection Observer)**

* Opens streams only when poll is visible
* Prevents browser connection limits

**Fast-Fetch + Stream**

* Immediate GET request for instant data
* SSE handles live updates after

---

## ⚖️ Decisions

* **Security First**: Validate team membership on every SSE connection
* **Database**: MySQL (ACID, reliable under concurrency)
* **UI Layout**: Single-column for readability and focus

---

## Work Summary

* Fixed Next.js build issue using `<Suspense>`
* Implemented lazy-loaded SSE streams
* Removed initial data lag via hybrid fetch strategy
* Improved UI layout (vertical stack)
* Added documentation

---

## Status

Complete and production-ready.

