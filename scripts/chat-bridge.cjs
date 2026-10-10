const http = require('http');

const PORT = 8765;

const server = http.createServer((req, res) => {
  // Allow cross-origin requests from the HTML artifact
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    return res.end();
  }

  if (req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        // Emitting this specific string format so the AI knows it's a message from the browser
        console.log(`\n======================================================`);
        console.log(`[BROWSER_CHAT_MESSAGE]: ${data.message}`);
        console.log(`======================================================\n`);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'received' }));
      } catch (e) {
        res.writeHead(400);
        res.end();
      }
    });
  } else {
    res.writeHead(404);
    res.end();
  }
});

server.listen(PORT, () => {
  console.log(`Antigravity Chat Bridge is live on port ${PORT}!`);
});
