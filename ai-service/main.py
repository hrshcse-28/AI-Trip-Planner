from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from schemas import GenerateRequest, ItineraryResponse, ChatRequest, ChatResponse
from llm_service import generate_itinerary, chat_with_concierge, generate_fallback_itinerary, generate_fallback_chat

app = FastAPI(title="AI Trip Planner API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "ai-service"}


@app.post("/generate-itinerary", response_model=ItineraryResponse)
async def generate_itinerary_endpoint(request: GenerateRequest):
    try:
        result = await generate_itinerary(request)
        return result
    except Exception as e:
        print(f"Error generating itinerary: {e}, returning fallback")
        return generate_fallback_itinerary(request)


@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    try:
        result = await chat_with_concierge(request)
        return result
    except Exception as e:
        print(f"Error in concierge chat: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to process chat: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

