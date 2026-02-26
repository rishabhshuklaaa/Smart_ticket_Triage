# Smart Ticket Triage 🎫

An AI-powered customer support categorization system built for the Better Software assessment. This full-stack application allows customers to submit support queries, which are automatically categorized (e.g., BUG, FEATURE, BILLING) and prioritized (HIGH, NORMAL, LOW) using an LLM, before being routed to an Admin Dashboard for resolution.

## 🏗️ Architecture & Tech Stack
- **Frontend:** React (Vite) - Designed with strict state separation between Customer and Admin views.
- **Backend:** Python + Flask (REST API)
- **Database:** SQLite + SQLAlchemy
- **AI Integration:** Google Gemini API (Strict JSON mode)

## 🧠 Key Technical Decisions (As per Rubric)

### 1. Structure & Simplicity
I prioritized clear boundaries. The frontend separates concerns using view states rather than over-engineering JWT authentication for this assessment scope. The backend is strictly modularized into routing (`app.py`), business logic (`services.py`), and data schemas (`models.py`).

### 2. Correctness & Preventing Invalid States
To prevent bad data from corrupting the system, I enforced strict Database-level constraints. `TicketCategory`, `TicketPriority`, and `TicketStatus` are mapped strictly to Python `Enum` classes. The database will flat-out reject invalid states. Additionally, the 'Resolve' action uses a `PATCH` request to safely transition the state from `OPEN` to `RESOLVED` rather than destructively deleting records, preserving historical data.

### 3. Interface Safety & AI Usage
AI models are prone to hallucination. To guarantee Interface Safety, the backend does not blindly trust the LLM's JSON response. In `services.py`, the parsed AI output is explicitly validated against our strict Enums. 
- If the AI hallucinates an invalid category (e.g., `SUPER_BUG`), the system intercepts it, logs the failure for **Observability**, and safely falls back to a default `UNCATEGORIZED` and `NORMAL` state. The application never crashes.
- See `ai_guidance.md` for the strict prompt boundaries applied to the LLM.

### 4. Tradeoffs & Future Extensions
- **Tradeoff:** The AI call is currently synchronous, meaning the client waits for the LLM response. 
- **Extension:** In a production environment, I would decouple this by placing the AI categorization task into an asynchronous background queue (like Celery/Redis) and immediately returning a `202 Accepted` status to the frontend.

## 🚀 How to Run Locally

### 1. Backend Setup
Navigate to the `backend` directory, set up your environment, and add your API key:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate
pip install -r requirements.txt # (Flask, Flask-SQLAlchemy, flask-cors, google-generativeai, python-dotenv)