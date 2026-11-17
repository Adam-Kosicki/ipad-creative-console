// Visual QA probe: paste into /__dbg/eval on the iPad (or any browser) with a page in view. Returns a JSON string
// listing likely layout bugs on the page currently shown: cut-off text, broken images, off-centre icons, clipped boxes.
(function () {
  var W = innerWidth, H = innerHeight, out = { page: (document.getElementById('ptitle') || {}).textContent, truncated: [], badImg: [], offCentre: [], clipped: [], tiny: [] };
  var pg = document.getElementById('pager'), i = Math.round(pg.scrollLeft / W), cur = pg.children[i];
  if (!cur) return JSON.stringify({ error: 'no page' });
  function name(e) { return e.tagName.toLowerCase() + (e.className && e.className.baseVal === undefined ? '.' + String(e.className).trim().split(/\s+/).join('.') : ''); }
  var all = cur.querySelectorAll('*');
  for (var k = 0; k < all.length; k++) {
    var e = all[k], r = e.getBoundingClientRect();
    if (!r.width && !r.height) continue;
    var cs = getComputedStyle(e);
    if (e.scrollWidth > e.clientWidth + 1 && cs.textOverflow === 'ellipsis' && e.textContent.trim()) out.truncated.push([name(e), e.textContent.trim().slice(0, 24), e.clientWidth, e.scrollWidth]);
    if (e.tagName === 'IMG' && (!e.complete || !e.naturalWidth) && e.getAttribute('src')) out.badImg.push([name(e), (e.getAttribute('src') || '').slice(0, 40)]);
    if (e.tagName === 'IMG' && e.classList.contains('art') && e.complete && !r.width) out.badImg.push(['art zero width']);
    if ((e.tagName === 'BUTTON' || /(^|\s)(ic|p-ico|cal-d|ap-letter|nv-ring)(\s|$)/.test(String(e.className))) && r.width > 20 && e.children.length === 1) {
      var c = e.children[0].getBoundingClientRect(), dx = (c.left + c.width / 2) - (r.left + r.width / 2), dy = (c.top + c.height / 2) - (r.top + r.height / 2);
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) out.offCentre.push([name(e), Math.round(dx), Math.round(dy)]);
    }
    if (r.bottom > H - 14 && r.top < H && r.height > 6 && e.children.length === 0 && e.textContent.trim()) out.clipped.push([name(e), e.textContent.trim().slice(0, 20), Math.round(r.bottom)]);
    if (cs.fontSize && parseFloat(cs.fontSize) < 7 && e.textContent.trim() && e.children.length === 0) out.tiny.push([name(e), cs.fontSize]);
  }
  ['truncated', 'badImg', 'offCentre', 'clipped', 'tiny'].forEach(function (k) { out[k] = out[k].slice(0, 15); });
  return JSON.stringify(out);
})()
