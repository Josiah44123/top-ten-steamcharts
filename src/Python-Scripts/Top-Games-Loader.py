"""
This module connects the webscraper api to the React app
"""

from SteamChartLoader import update_charts
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
app = FastAPI()

#Allows React app to talk to python server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    )

@app.get("/api/top-games")
async def get_top_games():
    """
    Returns top games from webscraper
    """
    data = update_charts()

    return {"status": "success",
            "data" : data}
