const $ = s => document.querySelector(s);

async function api(url, opt) {
  const r = await fetch(url, opt);
  if (!r.ok) throw new Error(r.status);
  return r.json();
}

function render(d) {
  const s = d.settings;
  ['headline', 'to', 'from', 'since', 'seat', 'gate'].forEach(k => { $('#' + k).textContent = s[k] || ''; });
  const start = new Date(s.startDate);
  const days = isNaN(start) ? 0 : Math.max(0, Math.floor((Date.now() - start) / 864e5));
  $('#days').textContent = days;

  const list = $('#list');
  list.innerHTML = '';
  let left = 0;
  d.coupons.forEach(c => {
    if (!c.used) left++;
    const card = document.createElement('div');
    card.className = 'coupon' + (c.used ? ' done' : '');

    const emo = document.createElement('div'); emo.className = 'emo'; emo.textContent = c.emoji;
    const box = document.createElement('div');
    const h = document.createElement('h3'); h.textContent = c.title;
    const p = document.createElement('p'); p.textContent = c.desc;
    const b = document.createElement('button'); b.className = 'use';
    b.textContent = c.used ? 'ใช้แล้ว' : 'ใช้เลย'; b.disabled = c.used;
    b.onclick = async () => {
      b.disabled = true;
      try { render(await api('/api/use', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: c.id }) })); }
      catch (e) { b.disabled = false; alert('ใช้คูปองไม่สำเร็จ ลองใหม่อีกครั้งนะ'); }
    };
    const st = document.createElement('div'); st.className = 'stamp'; st.textContent = 'ใช้แล้ว';

    box.append(h, p, b);
    card.append(emo, box, st);
    list.append(card);
  });
  $('#count').textContent = 'เหลือ ' + left + '/' + d.coupons.length + ' ใบ';
}

api('/api/data').then(render).catch(() => { $('#list').textContent = 'โหลดข้อมูลไม่ได้ ลองรีเฟรชอีกครั้ง'; });
