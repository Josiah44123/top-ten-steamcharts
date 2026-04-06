🛠️ How It Works (Technical Architecture)
This project serves as a comprehensive data mashup, synchronizing three different data sources into a single, unified dashboard. Since SteamCharts lacks a public-facing API for global rankings, the application uses a multi-layered retrieval strategy:

1. Global Rankings (Web Scraping)
Because SteamCharts does not offer an official API for its homepage rankings, the backend performs real-time scraping to get the latest trends:

The Process: The backend uses axios to fetch the raw HTML from steamcharts.com and cheerio (a server-side jQuery implementation) to parse the #top-games table.

Data Points: It extracts the Game Name, Current Players, 24-hour Peak, and Total Hours Played.

The Hook: It also captures the Steam App ID from the URL (e.g., 730 for CS:GO), which acts as the primary key for the following two features.

2. 48-Hour Player Charts (Internal API)
Once the App ID is identified, the app visualizes historical player density:

The Endpoint: When a user expands a game card, the backend queries SteamCharts’ internal JSON endpoint:

[https://steamcharts.com/app/](https://steamcharts.com/app/){id}/chart-data.json

Visualization: This raw array of timestamps and player counts is processed and sent to the frontend, where it is rendered into a clean, interactive line chart using Recharts.

3. Metadata & Context (Official Steam API)
SteamCharts provides the numbers, but not the "story." To provide context for each game:

The Source: The backend calls Valve’s official Steam Store API:

[https://store.steampowered.com/api/appdetails?appids=](https://store.steampowered.com/api/appdetails?appids=){id}

Enrichment: We extract the short_description and genres to help users understand what the game is without leaving the dashboard.

4. Dynamic Visuals (Steam CDN)
To keep the backend lightweight, game imagery is handled via Client-Side Rendering:

Direct Loading: The frontend reconstructs image URLs using the App ID and pulls directly from Steam's Akamai-powered Content Delivery Network:

[https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/](https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/){appId}/capsule_231x87.jpg

🚀 Technical Summary
Backend: Node.js/Express (Data Aggregator)

Scraping: Cheerio + Axios

Frontend: React + Recharts

APIs: Steam Store API + SteamCharts Internal JSON