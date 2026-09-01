from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
from google import genai
from datetime import datetime, timezone
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
# PASSWORD HASHING
# ============================================================

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)


# ============================================================
# DISASTER REQUEST MODEL
# ============================================================

class DisasterRequest(BaseModel):

    disaster_type: str
    location: str
    description: str
    severity: int

# ============================================================
# USER AUTHENTICATION MODEL
# ============================================================

class UserSignup(BaseModel):
    email: EmailStr
    password: str
    organization: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str

# ============================================================
# AI DISASTER ANALYSIS ENDPOINT
# ============================================================




@app.post("/api/analyze-disaster")
async def analyze_disaster(request: DisasterRequest):

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

    try:
        # ------------------------------------------------
        # 1. Ask Gemini to analyze the disaster
        # ------------------------------------------------

        response = gemini_client.models.generate_content(
            model="gemini-3.6-flash",
            contents=prompt
        )

        analysis = response.text

        # ------------------------------------------------
        # 2. Create incident document
        # ------------------------------------------------

        incident = {
            "disaster_type": request.disaster_type,
            "location": request.location,
            "description": request.description,
            "severity": request.severity,
            "ai_analysis": analysis,
            "created_at": datetime.now(timezone.utc)
        }

        # ------------------------------------------------
        # 3. Save incident to MongoDB
        # ------------------------------------------------

        result = await database.incidents.insert_one(incident)

        # ------------------------------------------------
        # 4. Return result
        # ------------------------------------------------

        return {
            "status": "success",
            "message": "Disaster analyzed and incident saved successfully.",
            "incident_id": str(result.inserted_id),
            "disaster_type": request.disaster_type,
            "location": request.location,
            "severity": request.severity,
            "analysis": analysis
        }

    except Exception as e:

        print("ERROR:", str(e))

        return {
            "status": "error",
            "message": "Failed to analyze or save disaster.",
            "details": str(e)
        }

# ============================================================
# GET ALL SAVED INCIDENTS
# ============================================================

@app.get("/api/incidents")
async def get_incidents():

    try:
        incidents = []

        cursor = database.incidents.find().sort("created_at", -1)

        async for incident in cursor:
            incident["_id"] = str(incident["_id"])

            incidents.append(incident)

        return {
            "status": "success",
            "count": len(incidents),
            "incidents": incidents
        }

    except Exception as e:

        print("ERROR:", str(e))

        return {
            "status": "error",
            "message": "Failed to fetch incidents.",
            "details": str(e)
        }

# ============================================================
# USER SIGN UP
# ============================================================

@app.post("/api/auth/signup")
async def signup(user: UserSignup):

    try:
        # Check whether the email already exists
        existing_user = await database.users.find_one({
            "email": user.email
        })

        if existing_user:
            return {
                "status": "error",
                "message": "An account with this email already exists."
            }

        # Hash the password before storing it
        hashed_password = pwd_context.hash(user.password)

        # Create user document
        new_user = {
            "email": user.email,
            "password": hashed_password,
            "organization": user.organization,
            "created_at": datetime.now(timezone.utc)
        }

        # Save user to MongoDB
        result = await database.users.insert_one(new_user)

        return {
            "status": "success",
            "message": "Account created successfully.",
            "user_id": str(result.inserted_id),
            "email": user.email,
            "organization": user.organization
        }

    except Exception as e:

        print("SIGNUP ERROR:", str(e))

        return {
            "status": "error",
            "message": "Failed to create account.",
            "details": str(e)
        }
# ============================================================
# USER LOGIN
# ============================================================

@app.post("/api/auth/login")
async def login(user: UserLogin):

    try:
        # Find user by email
        existing_user = await database.users.find_one({
            "email": user.email
        })

        if not existing_user:
            return {
                "status": "error",
                "message": "Invalid email or password."
            }

        # Verify password
        password_correct = pwd_context.verify(
            user.password,
            existing_user["password"]
        )

        if not password_correct:
            return {
                "status": "error",
                "message": "Invalid email or password."
            }

        return {
            "status": "success",
            "message": "Login successful.",
            "user": {
                "id": str(existing_user["_id"]),
                "email": existing_user["email"],
                "organization": existing_user["organization"]
            }
        }

    except Exception as e:

        print("LOGIN ERROR:", str(e))

        return {
            "status": "error",
            "message": "Login failed.",
            "details": str(e)
        }
        