Since browsers block direct requests to external websites due to CORS (Cross-Origin Resource Sharing) security rules, I built a Node.js (Express) backend that acts as a middleman. The backend gathers data from three different places and sends it to your React frontend.
Here is the step-by-step data flow:

1. The Top 10 List (Web Scraping)
SteamCharts doesn't have a public API for its homepage list, so we have to extract it manually.
When the frontend requests /api/top-games, the Node.js backend uses a library called axios to download the raw HTML of steamcharts.com.
It then uses a library called cheerio (which acts like jQuery for servers) to scan the HTML, find the <table id="top-games">, and loop through the top 10 rows.
It extracts the text for the game's name, current players, 24-hour peak, and total hours played. It also looks at the URL link attached to the game's name to extract the official Steam App ID (e.g., 730 for CS:GO).S
2. The 48-Hour Player Charts (Hidden JSON API)
Once we have the Steam App ID from step 1, we can get the historical data.
When you click a game to expand it, the frontend requests /api/game/{id}/chart.
The backend makes a request to a hidden JSON endpoint used internally by SteamCharts: https://steamcharts.com/app/{id}/chart-data.json.
This returns a massive array of timestamps and player counts, which the backend passes to the frontend to be rendered by the recharts graphing library.
3. Game Descriptions & Genres (Official Steam API)
SteamCharts only has player numbers, not game descriptions. To get the lore/descriptions, we go straight to Valve.
When you expand a game, the frontend also requests /api/game/{id}/details.
The backend calls the official Steam Store API: https://store.steampowered.com/api/appdetails?appids={id}.
It parses the massive JSON response to extract just the short_description and the genres array, sending them back to the UI.
4. Game Images (Steam CDN)
The images don't go through our backend at all. Because we extracted the Steam App ID in Step 1, the React frontend can directly load images from Steam's official content delivery network (CDN) using a predictable URL structure:
https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/{appId}/capsule_231x87.jpg
Summary: The app is a "mashup." It scrapes the rankings from SteamCharts HTML, grabs the graphs from SteamCharts' internal JSON, and pulls the lore/metadata from the official Steam Store API, combining them all into one seamless dashboard!