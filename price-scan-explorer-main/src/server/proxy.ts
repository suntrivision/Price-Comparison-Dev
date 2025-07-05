import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
const port = 3001;

app.use(cors());

app.get('/api/proxy/price-comparison', async (req, res) => {
  try {
    const response = await fetch('https://prodpromo.s3.ap-southeast-1.amazonaws.com/thunderbitscrape/embedding_matched_price_comparison_shopeeLotus.json');
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

app.listen(port, () => {
  console.log(`Proxy server running at http://localhost:${port}`);
}); 