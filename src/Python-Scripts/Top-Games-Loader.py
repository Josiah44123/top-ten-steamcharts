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

    #Output is an array of JSON objects example:
    #[{"Current position":1.0,"Game Name":"Counter-Strike 2","Current Players":994667,"Past position":1.0},
    # {"Current position":2.0,"Game Name":"Dota 2","Current Players":409186,"Past position":2.0},
    # ......
    # {"Current position":10.0,"Game Name":"Tom Clancy's Rainbow Six Siege","Current Players":83306,"Past position":9.0}]


    return {"status": "success",
            "data" : data}
