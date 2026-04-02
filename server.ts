import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import axios from 'axios';
import * as cheerio from 'cheerio';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API routes
  app.get('/api/top-games', async (req, res) => {
    try {
      const response = await axios.get('https://steamcharts.com/', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      const $ = cheerio.load(response.data);
      const games: any[] = [];
      
      $('#top-games tbody tr').each((index, element) => {
        if (index < 10) {
          const rank = index + 1;
          const nameElement = $(element).find('td.game-name.left a');
          const name = nameElement.text().trim();
          const link = nameElement.attr('href');
          const appId = link ? link.split('/')[2] : null;
          
          const columns = $(element).find('td.num');
          const currentPlayers = $(columns[0]).text().trim();
          const peakPlayers = $(columns[1]).text().trim();
          const hoursPlayed = $(columns[2]).text().trim();
          
          games.push({
            id: appId || String(rank),
            rank,
            name,
            currentPlayers,
            peakPlayers,
            hoursPlayed,
            appId
          });
        }
      });
      
      res.json({ status: 'success', data: games });
    } catch (error) {
      console.error('Error scraping SteamCharts:', error);
      res.status(500).json({ status: 'error', message: 'Failed to fetch data' });
    }
  });

  app.get('/api/game/:id/details', async (req, res) => {
    try {
      const { id } = req.params;
      const response = await axios.get(`https://store.steampowered.com/api/appdetails?appids=${id}`);
      const data = response.data[id];
      if (data && data.success) {
        res.json({ status: 'success', data: {
          short_description: data.data.short_description,
          header_image: data.data.header_image,
          genres: data.data.genres?.map((g: any) => g.description) || []
        }});
      } else {
        res.json({ status: 'error', message: 'Game details not found' });
      }
    } catch (error) {
      console.error(`Error fetching details for game ${req.params.id}:`, error);
      res.status(500).json({ status: 'error', message: 'Failed to fetch game details' });
    }
  });

  app.get('/api/game/:id/chart', async (req, res) => {
    try {
      const { id } = req.params;
      // Fetch historical data for the chart from steamcharts API or page
      // Steamcharts has a JSON endpoint for charts: https://steamcharts.com/app/{id}/chart-data.json
      const response = await axios.get(`https://steamcharts.com/app/${id}/chart-data.json`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'X-Requested-With': 'XMLHttpRequest'
        }
      });
      
      res.json({ status: 'success', data: response.data });
    } catch (error) {
      console.error(`Error fetching chart data for game ${req.params.id}:`, error);
      res.status(500).json({ status: 'error', message: 'Failed to fetch chart data' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
