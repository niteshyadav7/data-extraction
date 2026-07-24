import http from 'http';
import https from 'https';

const PORT = 3001;

const nseHeaders = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Referer': 'https://www.nseindia.com/option-chain'
};

const MAJOR_INDICES = ['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'MIDCPNIFTY', 'NIFTYIT'];

let cachedCookies = [];

function fetchNseCookies() {
  return new Promise((resolve, reject) => {
    const req = https.get('https://www.nseindia.com', { headers: nseHeaders }, (res) => {
      if (res.headers['set-cookie']) {
        cachedCookies = res.headers['set-cookie'].map(c => c.split(';')[0]);
      }
      res.resume();
      resolve(cachedCookies);
    });
    req.on('error', reject);
    req.end();
  });
}

function fetchNseOptionChain(symbol = 'NIFTY', type = 'INDEX') {
  return new Promise(async (resolve, reject) => {
    if (cachedCookies.length === 0) {
      await fetchNseCookies().catch(() => {});
    }

    const isIndex = type === 'INDEX' || MAJOR_INDICES.includes(symbol.toUpperCase());
    const endpoint = isIndex
      ? `https://www.nseindia.com/api/option-chain-indices?symbol=${encodeURIComponent(symbol)}`
      : `https://www.nseindia.com/api/option-chain-equities?symbol=${encodeURIComponent(symbol)}`;

    const headers = {
      ...nseHeaders,
      'Cookie': cachedCookies.join('; ')
    };

    const req = https.get(endpoint, { headers }, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            reject(e);
          }
        } else {
          // Retry with fresh cookie
          fetchNseCookies().then(() => {
            const retryHeaders = { ...nseHeaders, 'Cookie': cachedCookies.join('; ') };
            https.get(endpoint, { headers: retryHeaders }, (r2) => {
              let b2 = '';
              r2.on('data', c => b2 += c);
              r2.on('end', () => {
                try { resolve(JSON.parse(b2)); } catch (err) { reject(err); }
              });
            }).on('error', reject);
          }).catch(reject);
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const reqUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  if (reqUrl.pathname === '/api/live-nifty' || reqUrl.pathname === '/api/live-data') {
    const symbol = reqUrl.searchParams.get('symbol') || 'NIFTY';
    const type = reqUrl.searchParams.get('type') || 'INDEX';

    try {
      const data = await fetchNseOptionChain(symbol, type);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: `Failed to fetch live data for ${symbol}`, details: String(err) }));
    }
  } else {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'NSE Multi-Asset Live Proxy Server Running', port: PORT }));
  }
});

server.listen(PORT, () => {
  console.log(`NSE Multi-Asset Live Proxy Server listening on http://localhost:${PORT}/api/live-data`);
});
