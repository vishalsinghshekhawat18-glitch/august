// Serves the notebooks folder for local preview: node notebooks/serve.cjs  → http://localhost:5178
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.PORT) || 5178;
http.createServer((req, res) => {
  const name = decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '') || 'Rajasthan_History_Notebook.html';
  const file = path.join(__dirname, path.basename(name));
  if (!file.endsWith('.html') || !fs.existsSync(file)) { res.writeHead(404); return res.end('Not found'); }
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  fs.createReadStream(file).pipe(res);
}).listen(PORT, () => console.log(`Notebooks at http://localhost:${PORT}`));
