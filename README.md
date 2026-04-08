🛠️ How It Works (Technical Architecture)

This project is a comprehensive data mashup that synchronizes three distinct data sources into a single, unified dashboard. Since SteamCharts lacks a public API for global rankings, the application uses a multi-layered retrieval strategy:

1. Global Rankings (Web Scraping)
Challenge: SteamCharts doesn’t provide an official API for homepage rankings.
Process: Backend fetches raw HTML using Axios and parses the #top-games table with Cheerio (server-side jQuery).
Data Points: Extracts Game Name, Current Players, 24-hour Peak, and Total Hours Played.
Primary Key: Captures the Steam App ID from the URL (e.g., 730 for CS:GO), which is used for subsequent features.
2. 48-Hour Player Charts (Internal API)
Endpoint: When a user expands a game card, the backend queries SteamCharts’ internal JSON endpoint:
https://steamcharts.com/app/{id}/chart-data.json
Visualization: Timestamps and player counts are processed and sent to the frontend, rendered as interactive line charts with Recharts.
3. Metadata & Context (Official Steam API)
Source: Calls Valve’s official Steam Store API:
https://store.steampowered.com/api/appdetails?appids={id}
Enrichment: Extracts short_description and genres to provide users with game context directly in the dashboard.
4. Dynamic Visuals (Steam CDN)
Approach: Game images are loaded client-side to keep the backend lightweight.
URL Pattern: Frontend reconstructs image URLs using the App ID:
https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/{appId}/capsule_231x87.jpg
🚀 Technical Summary
Backend: Node.js / Express (Data Aggregator)
Scraping: Cheerio + Axios
Frontend: React + Recharts
APIs: Steam Store API + SteamCharts Internal JSON