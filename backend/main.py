import os
import google.generativeai as genai
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# --- CHANGE 1: Configure the Google AI Client ---
# Initialize FastAPI app
app = FastAPI()
api_key = os.getenv("GOOGLE_API_KEY")
if not api_key:
    raise ValueError("GOOGLE_API_KEY not found in .env file")
genai.configure(api_key=api_key)


# --- CORS Middleware ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Pydantic Models (No change here) ---
class AgentConfig(BaseModel):
    name: str
    system_prompt: str
    tools: list[str] = []

class ChatRequest(BaseModel):
    message: str
    agent_config: AgentConfig
    history: list[dict]

# --- Tool Functions (No change here) ---
def perform_web_search(query: str):
    """Simulates performing a web search."""
    print(f"--- Performing web search for: {query} ---")
    return f"The web search results for '{query}' indicate that the capital of France is Paris."

# --- API Endpoints ---
@app.get("/")
def read_root():
    return {"status": "AI Agent Backend is running with Google Gemini!"}

@app.post("/chat")
def chat_with_agent(request: ChatRequest):
    """The main chat endpoint, now powered by Gemini."""
    
    # --- CHANGE 2: Select a Gemini model ---
    # You can choose 'gemini-1.5-pro-latest' for the best model or 'gemini-pro' for a faster one.
    model = genai.GenerativeModel(
        model_name='gemini-1.5-pro-latest',
        system_instruction=request.agent_config.system_prompt
    )
    
    # Format the history for Gemini (it expects 'user' and 'model' roles)
    gemini_history = []
    for msg in request.history:
        role = "model" if msg["role"] == "assistant" else "user"
        gemini_history.append({"role": role, "parts": [msg["content"]]})

    # Our simple tool-use logic remains the same
    if "web_search" in request.agent_config.tools and "search the web for" in request.message.lower():
        query = request.message.lower().split("search the web for")[-1].strip()
        tool_result = perform_web_search(query)
        # Add the tool result to the history as if the model found it
        gemini_history.append({"role": "model", "parts": [f"I have performed a web search. The result is: {tool_result}"]})

    # --- CHANGE 3: Call the Gemini API ---
    # Start a chat session with the history
    chat_session = model.start_chat(history=gemini_history)
    
    try:
        # Send the new user message
        response = chat_session.send_message(request.message)
        ai_message = response.text
        return {"response": ai_message}

    except Exception as e:
        # Provide a more informative error for debugging
        print(f"Error calling Gemini API: {e}")
        return {"error": f"An error occurred with the Google Gemini API: {e}"}
