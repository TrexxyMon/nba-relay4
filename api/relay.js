// Vercel Serverless Function — NBA relay through a residential HTTP(S) proxy
import { HttpsProxyAgent } from 'https-proxy-agent';

export default async function handler(req, res) {
  try {
    const target = req.query.u;
    if (!target || !/^https:\/\/stats\.nba\.com\/stats\/.+/i.test(target)) {
      res.status(400).send('Specify ?u=https://stats.nba.com/stats/...');
      return;
    }

    const headers = {
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Origin': 'https://www.nba.com',
      'Referer': 'https://www.nba.com/stats/',
      'x-nba-stats-origin': 'stats',
      'x-nba-stats-token': 'true',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36'
    };

    const PROXY_URL = process.env.PROXY_URL; // e.g. "http://USER:PASS@gate.decodo.com:10001"
    if (!PROXY_URL) {
      res.status(500).send('Proxy not configured');
      return;
    }
    const agent = new HttpsProxyAgent(PROXY_URL);

    const resp = await fetch(target, { headers, redirect: 'follow', agent });

    res.status(resp.status);
    let hasCT = false;
    resp.headers.forEach((v, k) => {
      const key = k.toLowerCase();
      if (key === 'content-encoding') return; // avoid gzip confusion
      if (key === 'content-type') hasCT = true;
      res.setHeader(k, v);
    });
    if (!hasCT) res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');

    const buf = Buffer.from(await resp.arrayBuffer());
    res.send(buf);
  } catch (e) {
    res.status(502).send('Upstream fetch failed: ' + (e?.message || e));
  }
}
