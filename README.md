1. Top 10 Games (Web Scraping)

Since SteamCharts does not provide a public API for its homepage rankings, the data is extracted manually.

The frontend sends a request to /api/top-games.
The backend uses axios to fetch the raw HTML from steamcharts.com.
It then uses cheerio (a server-side HTML parser similar to jQuery) to locate the <table id="top-games">.
The top 10 rows are parsed to extract:
Game name
Current players
24-hour peak
Total hours played
The backend also extracts the Steam App ID from each game's link (e.g., 730 for CS:GO).
2. 48-Hour Player Charts (Hidden JSON API)

Once the Steam App ID is available, historical player data can be retrieved.

When a user expands a game, the frontend requests /api/game/{id}/chart.
The backend calls SteamCharts’ internal endpoint:
https://steamcharts.com/app/{id}/chart-data.json
This returns an array of timestamps and player counts.
The backend forwards this data to the frontend, where it is visualized using Recharts.
3. Game Descriptions & Genres (Official Steam API)

SteamCharts does not include game descriptions, so the app uses Valve’s official API.

The frontend requests /api/game/{id}/details.
The backend calls:
https://store.steampowered.com/api/appdetails?appids={id}
From the response, it extracts:
short_description
genres
This information is sent back to the frontend for display.
4. Game Images (Steam CDN)

Images are loaded directly from Steam’s CDN and do not pass through the backend.

Using the App ID, the frontend constructs the image URL:
https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/{appId}/capsule_231x87.jpg
Summary

This app is essentially a data mashup:

It scrapes rankings from SteamCharts HTML
Retrieves player trends from SteamCharts’ internal JSON
Fetches descriptions and genres from the official Steam API

All of this is combined into a single, seamless dashboard for the user.