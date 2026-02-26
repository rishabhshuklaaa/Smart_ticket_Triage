import json
import logging
import os
from google import genai
from google.genai import types
from dotenv import load_dotenv
from models import TicketCategory, TicketPriority

# Load environment variables from .env file
load_dotenv()

# Observability: Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configure new Gemini Client
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

def categorize_ticket_with_ai(message: str) -> dict:
    """
    Sends the message to Gemini LLM to determine category and priority.
    Returns a dictionary with safe fallback values if the LLM fails.
    """
    # INTERFACE SAFETY: Default safe states (Fallback mechanism)
    result = {
        "category": TicketCategory.UNCATEGORIZED.value,
        "priority": TicketPriority.NORMAL.value
    }

    try:
        # Define the strict rules for the AI (AI Guidance in action)
        system_prompt = """
        You are a highly accurate customer support triage AI. 
        Analyze the customer message and classify it.
        
        ALLOWED CATEGORIES: "BUG", "FEATURE", "BILLING", "UNCATEGORIZED"
        ALLOWED PRIORITIES: "HIGH", "NORMAL", "LOW"
        
        RULES:
        - App crashes, payment failures, or data loss = HIGH priority BUG or BILLING.
        - UI glitches or core functions not working = NORMAL priority BUG.
        - New requests or ideas = LOW priority FEATURE.
        
        You MUST respond in strict JSON format. Example:
        {"category": "BUG", "priority": "HIGH"}
        """

        # Combine system prompt and user message
        full_prompt = f"{system_prompt}\n\nCustomer Message: '{message}'"

        # Call the API using the new Client and config, enforcing JSON output
        response = client.models.generate_content(
            model='gemini-2.5-flash', 
            contents=full_prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
            )
        )

        # Parse the JSON response
        parsed_data = json.loads(response.text)
        logger.info(f"Raw AI Response: {parsed_data}")

        # INTERFACE SAFETY & CORRECTNESS: Validate AI output against our strict Enums
        if parsed_data.get("category") in [item.value for item in TicketCategory]:
            result["category"] = parsed_data["category"]
            
        if parsed_data.get("priority") in [item.value for item in TicketPriority]:
            result["priority"] = parsed_data["priority"]

        logger.info(f"Successfully validated and applied AI decision: {result}")

    except Exception as e:
        # OBSERVABILITY
        logger.error(f"AI Categorization failed: {str(e)}. Using default fallback.")

    return result