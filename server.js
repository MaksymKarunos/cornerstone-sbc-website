// Simple Node.js backend for Cornerstone SBC website
// Serves static files + provides API for event management
// Run: node server.js

var http = require('http');
var fs = require('fs');
var path = require('path');
var PORT = process.env.PORT || 4000;

var EVENTS_FILE = path.join(__dirname, 'data', 'events.json');

var MIME = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon', '.webp': 'image/webp', '.pdf': 'application/pdf'
};

function readBody(req, cb) {
  var body = '';
  req.on('data', function(c) { body += c; });
  req.on('end', function() { cb(body); });
}

function sendJSON(res, code, data) {
  res.writeHead(code, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
  res.end(JSON.stringify(data));
}

function serveStatic(res, filePath) {
  var ext = path.extname(filePath).toLowerCase();
  var mime = MIME[ext] || 'application/octet-stream';
  fs.readFile(filePath, function(err, data) {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': mime });
    res.end(data);
  });
}

var server = http.createServer(function(req, res) {
  var url = req.url.split('?')[0];

  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
      'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Pin'
    });
    res.end();
    return;
  }

  // API: Get events
  if (url === '/api/events' && req.method === 'GET') {
    fs.readFile(EVENTS_FILE, 'utf8', function(err, data) {
      if (err) return sendJSON(res, 200, []);
      try { sendJSON(res, 200, JSON.parse(data)); }
      catch(e) { sendJSON(res, 200, []); }
    });
    return;
  }

  // API: Save events (requires PIN)
  if (url === '/api/events' && req.method === 'POST') {
    var pin = req.headers['x-admin-pin'];
    if (pin !== '9502') return sendJSON(res, 401, { error: 'Invalid PIN' });

    readBody(req, function(body) {
      try {
        var events = JSON.parse(body);
        if (!Array.isArray(events)) return sendJSON(res, 400, { error: 'Expected array' });
        fs.writeFile(EVENTS_FILE, JSON.stringify(events, null, 2), function(err) {
          if (err) return sendJSON(res, 500, { error: 'Write failed' });
          sendJSON(res, 200, { ok: true, count: events.length });
        });
      } catch(e) {
        sendJSON(res, 400, { error: 'Invalid JSON' });
      }
    });
    return;
  }

  // Static files
  var filePath = path.join(__dirname, url === '/' ? 'index.html' : url);
  // Prevent directory traversal
  if (!filePath.startsWith(__dirname)) { res.writeHead(403); res.end(); return; }
  serveStatic(res, filePath);
});

server.listen(PORT, function() {
  console.log('Cornerstone SBC server running at http://localhost:' + PORT);
  console.log('Admin panel: http://localhost:' + PORT + '/admin-events.html');
  console.log('API: GET/POST http://localhost:' + PORT + '/api/events');
});
