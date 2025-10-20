// Vercel Serverless Function (Node.js) — NBA relay (CommonJS syntax to avoid ESM quirks)
module.exports = async (req, res) => {
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
      'Referer': 'https://www.nba.com/',
      'x-nba-stats-origin': 'stats',
      'x-nba-stats-token': 'true',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36'
    };

    const resp = await fetch(target, { headers, redirect: 'follow' });

    // Pass through status and headers; strip content-encoding to avoid gzip issues
    res.status(resp.status);
    resp.headers.forEach((v, k) => {
      if (k.toLowerCase() !== 'content-encoding') res.setHeader(k, v);
    });
    res.setHeader('Access-Control-Allow-Origin', '*');

    const buf = Buffer.from(await resp.arrayBuffer());
    res.send(buf);
  } catch (e) {
    res.status(502).send('Upstream fetch failed: ' + (e?.message || e));
  }
};
