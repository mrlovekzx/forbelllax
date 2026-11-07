// รัน: node server.js   (ไม่ต้องติดตั้งอะไรเพิ่ม ใช้ Node 16+)
// ตั้งรหัสหลังบ้าน: ADMIN_PASSWORD=รหัสของคุณ node server.js
const http = require('http'), fs = require('fs'), path = require('path');
const PORT = process.env.PORT || 3000;
const PASS = process.env.ADMIN_PASSWORD || 'love1234';
const DATA = path.join(__dirname, 'data.json');
const FILES = { '/': 'index.html', '/index.html': 'index.html', '/admin': 'admin.html', '/admin.html': 'admin.html',
  '/style.css': 'style.css', '/app.js': 'app.js', '/admin.js': 'admin.js' };
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8' };
const read = () => JSON.parse(fs.readFileSync(DATA, 'utf8'));
const write = d => fs.writeFileSync(DATA, JSON.stringify(d, null, 2));
const str = (v, n) => String(v == null ? '' : v).slice(0, n);
const send = (res, code, obj) => { res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(obj)); };
const readBody = req => new Promise(ok => {
  let b = '';
  req.on('data', c => { b += c; if (b.length > 1e6) req.destroy(); });
  req.on('end', () => { try { ok(JSON.parse(b || '{}')); } catch (e) { ok(null); } });
});

http.createServer(async (req, res) => {
  const url = req.url.split('?')[0];
  try {
    if (url === '/api/data' && req.method === 'GET') return send(res, 200, read());

    if (url === '/api/use' && req.method === 'POST') {          // แฟนกด "ใช้เลย"
      const b = await readBody(req), d = read();
      const c = d.coupons.find(x => x.id === (b && b.id));
      if (!c) return send(res, 404, { error: 'not found' });
      c.used = true; write(d); return send(res, 200, d);
    }

    if (url.startsWith('/api/admin/')) {                        // หลังบ้าน ต้องมีรหัส
      if (req.headers['x-admin-password'] !== PASS) return send(res, 401, { error: 'wrong password' });
      if (url === '/api/admin/login') return send(res, 200, { ok: true });
      if (url === '/api/admin/save' && req.method === 'POST') {
        const b = await readBody(req);
        if (!b || !b.settings || !Array.isArray(b.coupons)) return send(res, 400, { error: 'bad data' });
        const s = b.settings;
        const d = {
          settings: { headline: str(s.headline, 60), to: str(s.to, 30), from: str(s.from, 30), since: str(s.since, 30),
            seat: str(s.seat, 40), gate: str(s.gate, 40), startDate: str(s.startDate, 10) },
          coupons: b.coupons.slice(0, 100).map((c, i) => ({ id: str(c.id, 40) || 'c' + Date.now() + i,
            emoji: str(c.emoji, 8), title: str(c.title, 80), desc: str(c.desc, 200), used: !!c.used }))
        };
        write(d); return send(res, 200, d);
      }
    }

    if (FILES[url]) {
      const f = path.join(__dirname, FILES[url]);
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] });
      return fs.createReadStream(f).pipe(res);
    }
    send(res, 404, { error: 'not found' });
  } catch (e) { send(res, 500, { error: 'server error' }); }
}).listen(PORT, () => console.log('เปิดเว็บ: http://localhost:' + PORT + '  |  หลังบ้าน: http://localhost:' + PORT + '/admin'));
