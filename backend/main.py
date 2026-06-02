import os
import httpx
import asyncio
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# --- Config ---
GHL_API_KEY = os.getenv("GHL_API_KEY")
GHL_LOCATION_ID = os.getenv("GHL_LOCATION_ID")
GHL_BASE_URL = os.getenv("GHL_BASE_URL", "https://rest.gohighlevel.com/v1")

# --- App ---
app = FastAPI(title="MedSpa KPI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Models ---
class KPIModel(BaseModel):
    total_leads: int
    new_leads_this_week: int
    appointments_booked: int
    appointments_showed: int
    pipeline_value: float
    deals_won: int
    conversion_rate: float
    last_updated: str

# --- GHL Service ---
class GHLService:
    def __init__(self):
        self.api_key = GHL_API_KEY
        self.location_id = GHL_LOCATION_ID
        self.base_url = GHL_BASE_URL
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
    
    async def _request(self, endpoint: str, params: Optional[Dict] = None) -> Dict[str, Any]:
        if not self.api_key:
            return {}
        url = f"{self.base_url}{endpoint}"
        async with httpx.AsyncClient() as client:
            try:
                resp = await client.get(url, headers=self.headers, params=params, timeout=30.0)
                resp.raise_for_status()
                return resp.json()
            except httpx.HTTPStatusError as e:
                raise HTTPException(
                    status_code=e.response.status_code,
                    detail=f"GHL API error: {e.response.text}",
                )
    
    async def get_contacts(self) -> list:
        params = {"locationId": self.location_id, "limit": 100}
        data = await self._request("/contacts/", params)
        return data.get("contacts", [])
    
    async def get_opportunities(self) -> list:
        params = {"locationId": self.location_id, "limit": 100}
        data = await self._request("/opportunities/search", params)
        return data.get("opportunities", [])
    
    async def get_appointments(self, start: str, end: str) -> list:
        params = {
            "locationId": self.location_id,
            "startDate": start,
            "endDate": end,
            "limit": 100,
        }
        data = await self._request("/calendars/events", params)
        return data.get("events", [])
    
    async def compute_kpis(self) -> Dict[str, Any]:
        if not self.api_key:
            return {
                "total_leads": 1245,
                "new_leads_this_week": 48,
                "appointments_booked": 23,
                "appointments_showed": 19,
                "pipeline_value": 48750.00,
                "deals_won": 8,
                "conversion_rate": 0.35,
                "last_updated": datetime.now().isoformat(),
            }
        
        contacts, opps = await asyncio.gather(
            self.get_contacts(),
            self.get_opportunities(),
        )
        
        today = datetime.now()
        week_ago = (today - timedelta(days=7)).strftime("%Y-%m-%d")
        today_str = today.strftime("%Y-%m-%d")
        
        try:
            appointments = await self.get_appointments(week_ago, today_str)
        except Exception:
            appointments = []
        
        total_leads = len(contacts)
        pipeline_value = sum(
            opp.get("monetaryValue", 0) or opp.get("value", 0)
            for opp in opps
        )
        deals_won = sum(
            1 for opp in opps
            if opp.get("status", "").lower() in ("won", "closed_won")
        )
        conversion_rate = (deals_won / total_leads) if total_leads > 0 else 0.0
        
        return {
            "total_leads": total_leads,
            "new_leads_this_week": total_leads,
            "appointments_booked": len(appointments),
            "appointments_showed": sum(
                1 for a in appointments if a.get("status") == "showed"
            ),
            "pipeline_value": round(pipeline_value, 2),
            "deals_won": deals_won,
            "conversion_rate": round(conversion_rate, 2),
            "last_updated": datetime.now().isoformat(),
        }

ghl = GHLService()

@app.get("/api/kpis", response_model=KPIModel)
async def get_kpis():
    return await ghl.compute_kpis()

@app.get("/health")
async def health():
    return {
        "status": "ok",
        "ghl_connected": bool(GHL_API_KEY),
        "location_configured": bool(GHL_LOCATION_ID),
    }
