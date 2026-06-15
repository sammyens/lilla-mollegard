const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const DB_FILE = path.join(__dirname, 'tasks.json');

function loadTasks() {
  try {
    if (fs.existsSync(DB_FILE)) return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch(e) {}
  return [
    { id: 1, text: 'Köp kaffemaskin', cat: 'kafe', done: false },
    { id: 2, text: 'Beställ blomvaser', cat: 'forsaljning', done: false },
    { id: 3, text: 'Plantera sommarblommor', cat: 'tradgard', done: false },
    { id: 4, text: 'Ordna kassasystem', cat: 'forsaljning', done: false },
    { id: 5, text: 'Testa recept på hembakat', cat: 'kok', done: false },
  ];
}

function saveTasks(tasks) {
  fs.writeFileSync(DB_FILE, JSON.stringify(tasks), 'utf8');
}

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true);

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  if (parsed.pathname === '/' && req.method === 'GET') {
    const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
    return;
  }

  if (parsed.pathname === '/tasks' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(loadTasks()));
    return;
  }

  if (parsed.pathname === '/tasks' && req.method === 'POST') {
    let body = '';
    req.on('data', d => body += d);
    req.on('end', () => {
      const tasks = loadTasks();
      const task = JSON.parse(body);
      task.id = Date.now();
      tasks.push(task);
      saveTasks(tasks);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(task));
    });
    return;
  }

  if (parsed.pathname.startsWith('/tasks/') && req.method === 'PUT') {
    const id = parseInt(parsed.pathname.split('/')[2]);
    let body = '';
    req.on('data', d => body += d);
    req.on('end', () => {
      const tasks = loadTasks();
      const idx = tasks.findIndex(t => t.id === id);
      if (idx !== -1) { tasks[idx] = { ...tasks[idx], ...JSON.parse(body) }; saveTasks(tasks); }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(tasks[idx] || {}));
    });
    return;
  }

  if (parsed.pathname.startsWith('/tasks/') && req.method === 'DELETE') {
    const id = parseInt(parsed.pathname.split('/')[2]);
    const tasks = loadTasks().filter(t => t.id !== id);
    saveTasks(tasks);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
