const { Blockchain, Transaction } = require('./blockchain');
const http = require('http');
const url = require('url');
const dotenv = require('dotenv');
dotenv.config();
const academicChain = new Blockchain();
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');


const pool = require('./db');

async function initDatabase(pool) {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS finance_data (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(100) UNIQUE NOT NULL,
      publicKey TEXT,
      privateKey TEXT,
      balance DECIMAL(18,2)
    )
  `);

  const users = [
    ['haosen',
      '0405d6dd51cce6d0ce6631d50c75e1e862f2d7334a240f8a8e7f49f6574781597dd1b86f93ad5509f31c66b530edb1ad7ed8dc4aceb68fa128e9aecd60b83dadd0',
      'd596fd3bd96b89ef6b5990cc509d10a3719e5bf92358231370550f6e6983195d',
      0],
    ['someone1',
      '0449857e0b7faa6cf95c9480692eaf4059c3b0e159db5f617c4a654454b1eb802a07fc65375b30ba15167ab42bdf7e1827399be25e57b4f3f779d44482fd325c7d',
      '5064a06c293c73736ad8cee45e15e731633fb97e6b3271d3077f9b3de93acaea',
      0],
    ['someone2',
      '042caf41b314f62c5b96d71617bf8115b10bcab1097af50137542860c29e661873c6a113bd333945e286b1d6a3a9cd9235b1ec1c2fc4775720298d3f5ff67d3559',
      'bdc3178b76e22b247543733efbb011f95a015c46e6d1d1c5eb3dd0e8639cd7d5',
      0],
    ['someone3',
      '043b446ab5dd7d8f6ea1acb787876eb8a42846f261efff362a303c91126a4a67fcd48434a8c966399da3af51bced17e0bbf58c059406952aae35192cdac09a20db',
      '0249bfac5377a300b47fc27c1e423976b90c73a4fa8c0fadd60ea473e16dcab1',
      0]
  ];

  for (const user of users) {
    await pool.execute(
      `INSERT INTO finance_data (username, publicKey, privateKey, balance)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE publicKey = VALUES(publicKey), privateKey = VALUES(privateKey)`,
      user
    );
  }

  console.log("✅ Database initialized");
}


async function mineForMoneyIssuer() {
  const testPrivateKey = 'd596fd3bd96b89ef6b5990cc509d10a3719e5bf92358231370550f6e6983195d';
  const key = ec.keyFromPrivate(testPrivateKey);
  const walletAddress = key.getPublic('hex');

  academicChain.minePendingTransactions(walletAddress, 100);
  const balance = academicChain.getBalanceOfAddress(walletAddress);

  await pool.execute(
    `UPDATE finance_data SET balance = ? WHERE privateKey = ?`,
    [balance, testPrivateKey]
  );

  console.log(`✅ New balance for wallet ${walletAddress}:`, balance);
}

async function updateBalance(amount, to_address) {

  const value = academicChain.getBalanceOfAddress(to_address);

  await pool.execute(
    `UPDATE finance_data SET balance = ? WHERE publicKey = ?`,
    [amount, to_address]
  );
}

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

(async () => {
    try {
        await initDatabase(pool); // Pass the pool to the function
        console.log('Database initialization complete. Starting server...');
        await mineForMoneyIssuer(); // This still seems like it might be called on every request, if it's part of transaction flow. Keep an eye on its behavior.
        // 4. Start the HTTP Server ONLY AFTER the database is initialized
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

            // Moved initDatabase OUT of here!

            // POST /issue - issue credential transaction
            if (req.method === 'POST' && parsedUrl.pathname === '/issue') {
                try {
                    const { from, to, credential } = await parseBody(req);

                
                    const testPrivateKey = 'd596fd3bd96b89ef6b5990cc509d10a3719e5bf92358231370550f6e6983195d';
                    const key = ec.keyFromPrivate(testPrivateKey);
                    const walletAddress = key.getPublic('hex');
                    if (walletAddress !== from) {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ message: 'From address does not match private key' }));
                        return;
                    }
                    const amount = credential.length;
                    const tx = new Transaction(from, to, amount);
                    console.log(tx)
                    tx.sign(key);
                    academicChain.addTransaction(tx);
                    academicChain.minePendingTransactions(to, 0);
                    currentValue = academicChain.getBalanceOfAddress(from);
                    console.log(currentValue)
                    currentValue2 = academicChain.getBalanceOfAddress(to);
                    await updateBalance(currentValue, from);
                    await updateBalance(currentValue2, to);


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
                    console.log(txs)
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

        const PORT = 5000;
        server.listen(PORT, () => {
            console.log(`Server listening on port ${PORT}`);
        });

    } catch (error) {
        console.error("❌ Critical Error during database initialization or server startup:", error.message);
        process.exit(1); // Exit the process if initialization fails
    }
})();
// (async () => {
//   try {
//     await initDatabase(pool);
//     await mineForMoneyIssuer();
//   } catch (error) {
//     console.error("❌ Error:", error.message);
//   }
// })();