# AI Guidance & System Constraints

## 1. System Context
You are an AI coding assistant helping to build the "Smart Ticket Triage" system. 
**Stack:** Python/Flask (Backend), React (Frontend), SQLite/SQLAlchemy (Database).

## 2. Core Engineering Philosophy
* **Simplicity over Cleverness:** Write highly readable, predictable code. Avoid over-engineering. Small, well-structured systems are preferred over large, complex ones.
* **Strict Boundaries:** Keep routing (`app.py`), business logic/external services (`services.py`), and database schemas (`models.py`) strictly isolated. 

## 3. Interface Safety & Correctness
* **Guard Against Misuse:** All incoming API requests MUST be validated using strict `Pydantic` schemas before interacting with business logic. Reject invalid payloads with a `400 Bad Request`.
* **Prevent Invalid States:** Database fields representing categories, priorities, and statuses MUST use SQLAlchemy `Enum` types. Do not allow free-text strings for `TicketStatus` (OPEN, RESOLVED) or `TicketPriority` (HIGH, NORMAL, LOW).
* **Predictable Retrieval:** Always fetch lists of records in an explicit, deterministic order (e.g., ascending by ID) to prevent frontend rendering inconsistencies.

## 4. AI Integration Rules & Change Resilience
* **Model Configuration:** Use the modern `google.genai` SDK. Always enforce structured JSON outputs by setting `response_mime_type="application/json"` in the API configuration.
* **Prompt Constraints:** The AI prompt must explicitly declare the strict allowed values for categorization to minimize hallucinations.
* **Graceful Degradation (Fail-Safe):** The application MUST NEVER crash if the LLM API times out, fails, or returns malformed data. Wrap AI calls in `try-except` blocks. If a failure occurs, automatically fall back to safe default states (`category: UNCATEGORIZED`, `priority: NORMAL`).

## 5. Observability
* **Diagnosable Failures:** Do not fail silently. Use Python's standard `logging` module (`logging.INFO`, `logging.ERROR`) to log raw AI responses, validation errors, and API tracebacks so that the system's behavior remains fully transparent.