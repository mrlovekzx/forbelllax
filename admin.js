const $ = s => document.querySelector(s);
const KEYS = ['headline', 'to', 'from', 'since', 'seat', 'gate', 'startDate'];
let pw = sessionStorage.getItem('lt-pw') || '';
let data = null;

const headers = () => ({ 'Content-Type': 'application/json', 'x-admin-password': pw });

async function login(p) {
  pw = p;
  const r = await fetch('/api/admin/login', { method: 'POST', headers: headers() });
  if (!r.ok) { pw = ''; return false; }
  sessionStorage.setItem('lt-pw', pw);
  return true;
}

async function open() {
  data = await (await fetch('/api/data')).json();
  $('#login').hidden = true;
  $('#panel').hidden = false;
  KEYS.forEach(k => { $('#' + k).value = data.settings[k] || ''; });
  rows();
}

function rows() {
  const box = $('#rows');
  box.innerHTML = '';
  data.coupons.forEach((c, i) => {
    const r = document.createElement('div');
    r.className = 'edit';
    const mk = (cls, val, ph, key, max) => {
      const el = document.createElement('input');
      el.className = cls; el.value = val; el.placeholder = ph; el.maxLength = max;
      el.setAttribute('aria-label', ph);
      el.oninput = () => { c[key] = el.value; };
      return el;
    };
    const used = document.createElement('label');
    used.className = 'chk';
    const cb = document.createElement('input');
    cb.type = 'checkbox'; cb.checked = c.used; cb.onchange = () => { c.used = cb.checked; };
    used.append(cb, ' ใช้แล้ว');

    const up = btn('↑', 'เลื่อนขึ้น', () => move(i, -1));
    const dn = btn('↓', 'เลื่อนลง', () => move(i, 1));
    const del = btn('ลบ', 'ลบคูปอง', () => {
      if (confirm('ลบคูปอง “' + (c.title || 'ไม่มีชื่อ') + '” ?')) { data.coupons.splice(i, 1); rows(); }
    });
    r.append(mk('e1', c.emoji, 'อีโมจิ', 'emoji', 8), mk('e2', c.title, 'ชื่อคูปอง', 'title', 80),
      mk('e3', c.desc, 'รายละเอียด', 'desc', 200), used, up, dn, del);
    box.append(r);
  });
}

function btn(t, label, fn) {
  const b = document.createElement('button');
  b.className = 'ghost small'; b.textContent = t; b.setAttribute('aria-label', label); b.onclick = fn;
  return b;
}

function move(i, d) {
  const j = i + d;
  if (j < 0 || j >= data.coupons.length) return;
  [data.coupons[i], data.coupons[j]] = [data.coupons[j], data.coupons[i]];
  rows();
}

$('#add').onclick = () => {
  data.coupons.push({ id: 'c' + Date.now(), emoji: '💝', title: '', desc: '', used: false });
  rows();
  const all = document.querySelectorAll('.edit .e2');
  all[all.length - 1].focus();
};

$('#save').onclick = async () => {
  KEYS.forEach(k => { data.settings[k] = $('#' + k).value; });
  $('#msg').textContent = 'กำลังบันทึก…';
  try {
    const r = await fetch('/api/admin/save', { method: 'POST', headers: headers(), body: JSON.stringify(data) });
    if (!r.ok) throw new Error(r.status);
    data = await r.json();
    $('#msg').textContent = 'บันทึกแล้ว ✓';
  } catch (e) { $('#msg').textContent = 'บันทึกไม่สำเร็จ ลองเข้าสู่ระบบใหม่'; }
};

$('#go').onclick = async () => {
  if (await login($('#pw').value)) open();
  else $('#loginMsg').textContent = 'รหัสผ่านไม่ถูกต้อง';
};
$('#pw').addEventListener('keydown', e => { if (e.key === 'Enter') $('#go').click(); });

if (pw) login(pw).then(ok => { if (ok) open(); });
