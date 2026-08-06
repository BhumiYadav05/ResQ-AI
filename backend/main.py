from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pydantic import BaseModel
from google import genai
import os


# ============================================================
# LOAD ENVIRONMENT VARIABLES
# ============================================================

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL")
DATABASE_NAME = os.getenv("DATABASE_NAME", "resq_ai")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")


# ============================================================
# GEMINI AI CLIENT
# ============================================================

gemini_client = genai.Client(
    api_key=GEMINI_API_KEY
)


# ============================================================
# MONGODB CLIENT
# ============================================================

mongodb_client = AsyncIOMotorClient(MONGODB_URL)

database = mongodb_client[DATABASE_NAME]


# ============================================================
# CREATE FASTAPI APPLICATION
# ============================================================

app = FastAPI(
    title="ResQ AI Backend",
    description="AI-powered Disaster Management System",
    version="1.0.0"
)


# ============================================================
# CORS CONFIGURATION
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# ROOT ENDPOINT
# ============================================================

@app.get("/")
def root():

    return {
        "message": "ResQ AI Backend is running!",
        "status": "operational"
    }


# ============================================================
# HEALTH CHECK ENDPOINT
# ============================================================

@app.get("/api/health")
def health_check():

    return {
        "status": "healthy",
        "service": "ResQ AI API"
    }


# ============================================================
# MONGODB CONNECTION TEST
# ============================================================

@app.get("/api/db-test")
async def database_test():

    try:

        # Ping MongoDB
        await mongodb_client.admin.command("ping")

        return {
            "status": "success",
            "message": "MongoDB connected successfully!",
            "database": DATABASE_NAME
        }

    except Exception as e:

        return {
            "status": "error",
            "message": "MongoDB connection failed",
            "details": str(e)
        }


# ============================================================
# DISASTER REQUEST MODEL
# ============================================================

class DisasterRequest(BaseModel):

    disaster_type: str
    location: str
    description: str
    severity: int


# ============================================================
# AI DISASTER ANALYSIS ENDPOINT
# ============================================================

@app.post("/api/analyze-disaster")
async def analyze_disaster(request: DisasterRequest):

    # --------------------------------------------------------
    # Create prompt for Gemini
    # --------------------------------------------------------

    prompt = f"""
You are ResQ-AI, an AI-powered disaster management
and emergency decision-support assistant.

Your job is to analyze disaster situations and provide
clear, practical and actionable recommendations for
emergency response teams and affected people.

Analyze the following disaster situation:

Disaster Type:
{request.disaster_type}

Location:
{request.location}

Description:
{request.description}

Severity:
{request.severity}/10


Provide a structured emergency assessment.

Your response MUST include the following sections:

1. Situation Summary

Explain what is happening based only on the
information provided.

2. Risk Level

Classify the risk as:
LOW, MODERATE, HIGH, or CRITICAL.

Explain briefly why.

3. Immediate Actions

List the most important actions that should be
taken immediately.

4. Evacuation Recommendations

Explain whether evacuation should be considered
and what precautions people should follow.

5. Required Emergency Resources

List the resources that emergency responders
may need, such as:

- Rescue teams
- Medical teams
- Ambulances
- Food and water
- Emergency shelters
- Boats
- Communication equipment
- Other relevant resources

6. Rescue Team Priorities

Explain what rescue teams should prioritize first.

7. Safety Warnings

List important safety precautions.

Keep the response concise, clear and actionable.

IMPORTANT:
Do not invent specific real-time information,
crime statistics, weather conditions, casualty numbers,
or emergency-service availability that was not provided
in the input.
"""


    # --------------------------------------------------------
    # Send request to Gemini
    # --------------------------------------------------------

    response = gemini_client.models.generate_content(
        model="gemini-3.6-flash",
        contents=prompt
    )


    # --------------------------------------------------------
    # Return AI response
    # --------------------------------------------------------

    return {
        "status": "success",
        "disaster_type": request.disaster_type,
        "location": request.location,
        "severity": request.severity,
        "analysis": response.text
    }
    