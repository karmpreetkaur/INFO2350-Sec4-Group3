const http = require('http');
const url = require('url');
const { Blockchain, Transaction } = require('./blockchain');
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

const PORT = 5000;
const academicChain = new Blockchain();

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch (e) {
        reject(e);
      }
    });
  });
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);

  // CORS headers for frontend access
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // POST /issue - issue credential transaction
  if (req.method === 'POST' && parsedUrl.pathname === '/issue') {
    try {
      const { from, to, credential } = await parseBody(req);

      // For demo: dummy private key to sign - REPLACE with your own
      const testPrivateKey = 'd596fd3bd96b89ef6b5990cc509d10a3719e5bf92358231370550f6e6983195d'; 
      const key = ec.keyFromPrivate(testPrivateKey);
      const walletAddress = key.getPublic('hex');
      academicChain.minePendingTransactions(walletAddress);

      if (walletAddress !== from) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'From address does not match private key' }));
        return;
      }
      const amount = credential.length;
      const tx = new Transaction(from, to, amount);
      tx.sign(key);
      academicChain.addTransaction(tx);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: '✅ Credential issued successfully!' }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: `Error: ${err.message}` }));
    }
    return;
  }

  // GET /verify/:address - get all transactions for address
  if (req.method === 'GET' && parsedUrl.pathname.startsWith('/verify/')) {
    try {
      const address = parsedUrl.pathname.split('/')[2];
      if (!address) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Address required' }));
        return;
      }
      const txs = academicChain.getAllTransactionsForWallet(address);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ credentials: txs }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: `Error: ${err.message}` }));
    }
    return;
  }

  // Default 404
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ message: 'Not Found' }));
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});