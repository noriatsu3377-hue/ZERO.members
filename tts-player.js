/* 零 -ZERO- MEMBERS 音声読み上げプレーヤー
 * 暗号化済み音声ファイル（audio/*.bin）があればそれを再生（画面ロック中も再生可）。
 * 無い記事はブラウザ標準の読み上げ機能（Web Speech API）で読み上げる。
 * 記事本文（.article-content の section）を見出しごとに読み上げる。
 */
(function () {
  if (window.__zeroTTS) return; window.__zeroTTS = true;
  var synth = window.speechSynthesis;
  var root = document.querySelector('.article-content');
  if (!root) return;

  var css = document.createElement('style');
  css.textContent =
    '#ztts{position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:9999;background:#12151a;border:1px solid rgba(212,175,55,.5);border-radius:14px;padding:10px 14px;display:flex;align-items:center;gap:8px;flex-wrap:wrap;box-shadow:0 6px 24px rgba(0,0,0,.5);font-size:.82rem;color:#ddd;max-width:calc(100% - 24px)}' +
    '#ztts button{background:transparent;border:1px solid rgba(212,175,55,.5);color:#d4af37;border-radius:8px;padding:6px 10px;cursor:pointer;font-size:.85rem;font-weight:700}' +
    '#ztts button:hover{background:rgba(212,175,55,.12)}' +
    '#ztts select{background:#1a1e25;color:#ddd;border:1px solid #444;border-radius:6px;padding:4px}' +
    '#ztts .zt-now{max-width:220px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#aaa}' +
    '#ztts.min .zt-hide{display:none}' +
    '.ztts-reading{outline:2px solid rgba(212,175,55,.45);outline-offset:6px;border-radius:6px}' +
    '@media print{#ztts{display:none}}';
  document.head.appendChild(css);

  // ==== 音声ファイル再生モード（画面ロック中も再生可） ====
  var CFG = window.ZERO_AUDIO;
  if (CFG && CFG.k && CFG.src && window.crypto && crypto.subtle && window.fetch) { initAudio(); } else { initTTS(); }

  function initAudio() {
    css.textContent += '#ztts .zt-seek{width:160px;accent-color:#d4af37}#ztts .zt-time{color:#aaa;font-variant-numeric:tabular-nums}';
    var KEY = 'ztau:' + location.pathname;
    var bar = document.createElement('div'); bar.id = 'ztts'; bar.className = 'min';
    bar.innerHTML =
      '<button data-a="play">▶ 音声で聴く</button>' +
      '<button data-a="back" class="zt-hide" title="15秒戻る">↺15</button>' +
      '<button data-a="fwd" class="zt-hide" title="30秒進む">30↻</button>' +
      '<select data-a="rate" class="zt-hide" title="速さ">' +
      [0.8, 1, 1.2, 1.5, 1.8, 2].map(function (r) { return '<option value="' + r + '">' + r + '倍</option>'; }).join('') +
      '</select>' +
      '<input type="range" class="zt-seek zt-hide" min="0" max="1000" value="0" aria-label="再生位置">' +
      '<span class="zt-time zt-hide">0:00 / 0:00</span>';
    document.body.appendChild(bar);
    var bPlay = bar.querySelector('[data-a=play]'), sel = bar.querySelector('select'),
        seek = bar.querySelector('.zt-seek'), tlab = bar.querySelector('.zt-time');
    var rate = 1.2; try { rate = parseFloat(localStorage.getItem('ztts:rate')) || 1.2; } catch (e) {}
    sel.value = String(rate);
    var audio = null, loading = false;
    try { var saved = parseFloat(localStorage.getItem(KEY)) || 0; } catch (e) { saved = 0; }
    if (saved > 5) bPlay.textContent = '▶ 続きから聴く';

    function fmt(s) { s = Math.floor(s || 0); var h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60; return (h ? h + ':' + (m < 10 ? '0' : '') : '') + m + ':' + (x < 10 ? '0' : '') + x; }
    function hex(h) { var a = new Uint8Array(h.length / 2); for (var i = 0; i < a.length; i++) a[i] = parseInt(h.substr(i * 2, 2), 16); return a; }

    function load() {
      loading = true; bPlay.textContent = '準備中…'; bPlay.disabled = true;
      fetch(CFG.src, { cache: 'force-cache' }).then(function (r) {
        if (!r.ok) throw new Error('nofile'); return r.arrayBuffer();
      }).then(function (buf) {
        return crypto.subtle.importKey('raw', hex(CFG.k), { name: 'AES-CBC' }, false, ['decrypt']).then(function (key) {
          return crypto.subtle.decrypt({ name: 'AES-CBC', iv: new Uint8Array(buf, 0, 16) }, key, new Uint8Array(buf, 16));
        });
      }).then(function (plain) {
        audio = new Audio(URL.createObjectURL(new Blob([plain], { type: 'audio/mp4' })));
        audio.preload = 'auto';
        audio.addEventListener('loadedmetadata', function () { if (saved > 5 && saved < audio.duration - 5) audio.currentTime = saved; upd(); });
        audio.addEventListener('timeupdate', upd);
        audio.addEventListener('play', function () { bPlay.textContent = '⏸ 一時停止'; audio.playbackRate = rate; });
        audio.addEventListener('pause', function () { bPlay.textContent = '▶ 再生'; save(); });
        audio.addEventListener('ended', function () { bPlay.textContent = '▶ もう一度聴く'; try { localStorage.removeItem(KEY); } catch (e) {} });
        media();
        loading = false; bPlay.disabled = false; bar.classList.remove('min');
        bPlay.textContent = '▶ 再生';
        var p = audio.play(); if (p && p.catch) p.catch(function () { bPlay.textContent = '▶ 再生（タップ）'; });
      }).catch(function () {
        // 音声ファイルがまだ無い記事は、ブラウザの読み上げに切り替える
        bar.remove(); initTTS();
        var b = document.querySelector('#ztts [data-a=play]'); if (b) b.click();
      });
    }
    function upd() {
      if (!audio || !audio.duration) return;
      seek.value = Math.round(audio.currentTime / audio.duration * 1000);
      tlab.textContent = fmt(audio.currentTime) + ' / ' + fmt(audio.duration);
      if (Math.floor(audio.currentTime) % 10 === 0) save();
    }
    function save() { if (audio) try { localStorage.setItem(KEY, audio.currentTime); localStorage.setItem('ztts:rate', rate); } catch (e) {} }
    function skip(d) { if (audio) audio.currentTime = Math.max(0, Math.min(audio.duration || 0, audio.currentTime + d)); }
    function media() {
      if (!('mediaSession' in navigator)) return;
      var t = (document.querySelector('.article-main-title') || {}).textContent || document.title;
      try {
        navigator.mediaSession.metadata = new MediaMetadata({ title: t, artist: '零 -ZERO- MEMBERS', album: '講義の音声' });
        navigator.mediaSession.setActionHandler('play', function () { audio.play(); });
        navigator.mediaSession.setActionHandler('pause', function () { audio.pause(); });
        navigator.mediaSession.setActionHandler('seekbackward', function () { skip(-15); });
        navigator.mediaSession.setActionHandler('seekforward', function () { skip(30); });
        navigator.mediaSession.setActionHandler('seekto', function (e) { if (e.seekTime != null) audio.currentTime = e.seekTime; });
      } catch (e) {}
    }
    bar.addEventListener('click', function (e) {
      var a = e.target.getAttribute && e.target.getAttribute('data-a');
      if (a === 'play') { if (!audio) { if (!loading) load(); } else if (audio.paused) audio.play(); else audio.pause(); }
      else if (a === 'back') skip(-15);
      else if (a === 'fwd') skip(30);
    });
    sel.addEventListener('change', function () { rate = parseFloat(sel.value); if (audio) audio.playbackRate = rate; save(); });
    seek.addEventListener('input', function () { if (audio && audio.duration) audio.currentTime = seek.value / 1000 * audio.duration; });
    window.addEventListener('pagehide', save);
  }

  function initTTS() {
  if (!synth || typeof SpeechSynthesisUtterance === 'undefined') {
    return; // 非対応ブラウザでは何も表示しない
  }

  // ---- 読み上げる文章を作る ----
  var SKIP = '.sheet, .legend, #toc, nav, #refs, #quiz details, script, style, sup, img, .zt-skip';
  function textOf(sec) {
    var c = sec.cloneNode(true);
    c.querySelectorAll(SKIP).forEach(function (n) { n.remove(); });
    // 表は「行ごと」に読みやすく
    c.querySelectorAll('tr').forEach(function (tr) {
      tr.appendChild(document.createTextNode('。'));
    });
    c.querySelectorAll('td,th').forEach(function (td) {
      td.appendChild(document.createTextNode('、'));
    });
    c.querySelectorAll('br,li,p,h2,h3,h4,caption,summary').forEach(function (n) {
      n.appendChild(document.createTextNode('。'));
    });
    var t = (c.textContent || '')
      .replace(/★/g, '')
      .replace(/[│|]/g, '、')
      .replace(/→/g, '、つまり、')
      .replace(/＝/g, 'イコール')
      .replace(/\s+/g, ' ')
      .replace(/([。、])\s*[。、]+/g, '$1')
      .trim();
    return t;
  }
  function split(t) {
    // ブラウザの長文途切れ対策：句点ごと、長すぎる文は読点で分割
    var out = [];
    t.split(/(?<=[。！？])/).forEach(function (s) {
      s = s.trim(); if (!s) return;
      while (s.length > 140) {
        var i = s.lastIndexOf('、', 140); if (i < 40) i = 140;
        out.push(s.slice(0, i + 1)); s = s.slice(i + 1);
      }
      if (s) out.push(s);
    });
    return out;
  }

  var secs = [];
  var title = document.querySelector('.article-main-title');
  var sub = document.querySelector('.article-subtitle');
  if (title) secs.push({ el: title, name: 'タイトル', parts: split(title.textContent + '。' + (sub ? sub.textContent + '。' : '')) });
  root.querySelectorAll(':scope > section').forEach(function (s) {
    if (s.matches('#refs, #sheet')) return;
    var h = s.querySelector('h2');
    var parts = split(textOf(s));
    if (parts.length) secs.push({ el: s, name: h ? h.textContent.replace(/★/g, '') : '', parts: parts });
  });
  if (!secs.length) return;

  // ---- 状態 ----
  var KEY = 'ztts:' + location.pathname;
  var st = { s: 0, p: 0, rate: 1.2, playing: false };
  try {
    var sv = JSON.parse(localStorage.getItem(KEY) || '{}');
    if (sv.s < secs.length) { st.s = sv.s || 0; st.p = sv.p || 0; }
    var r = parseFloat(localStorage.getItem('ztts:rate')); if (r) st.rate = r;
  } catch (e) {}
  function save() { try { localStorage.setItem(KEY, JSON.stringify({ s: st.s, p: st.p })); localStorage.setItem('ztts:rate', st.rate); } catch (e) {} }

  var voice = null;
  function pickVoice() {
    var vs = synth.getVoices().filter(function (v) { return /^ja/i.test(v.lang); });
    voice = vs.find(function (v) { return /Kyoko|Otoya|Google|Nanami|Haruka/i.test(v.name); }) || vs[0] || null;
  }
  pickVoice(); if (synth.onvoiceschanged !== undefined) synth.onvoiceschanged = pickVoice;

  // ---- UI ----
  var bar = document.createElement('div'); bar.id = 'ztts';
  bar.innerHTML =
    '<button data-a="play" title="再生／一時停止">▶ 音声で聴く</button>' +
    '<button data-a="prev" class="zt-hide" title="前の見出しへ">⏮</button>' +
    '<button data-a="next" class="zt-hide" title="次の見出しへ">⏭</button>' +
    '<select data-a="rate" class="zt-hide" title="速さ">' +
    [0.8, 1, 1.2, 1.5, 1.8, 2].map(function (r) { return '<option value="' + r + '">' + r + '倍</option>'; }).join('') +
    '</select>' +
    '<span class="zt-now zt-hide"></span>' +
    '<button data-a="stop" class="zt-hide" title="最初に戻す">■</button>';
  document.body.appendChild(bar);
  bar.classList.add('min');
  var bPlay = bar.querySelector('[data-a=play]'), now = bar.querySelector('.zt-now'), sel = bar.querySelector('select');
  sel.value = String(st.rate);

  function mark() {
    document.querySelectorAll('.ztts-reading').forEach(function (n) { n.classList.remove('ztts-reading'); });
    var c = secs[st.s]; if (!c) return;
    c.el.classList.add('ztts-reading');
    now.textContent = (st.s + 1) + '/' + secs.length + '　' + c.name;
  }
  function speak() {
    var c = secs[st.s];
    if (!c) { stop(true); return; }
    if (st.p >= c.parts.length) { st.s++; st.p = 0; save(); if (st.s < secs.length) { mark(); c = secs[st.s]; c.el.scrollIntoView({ behavior: 'smooth', block: 'start' }); } else { stop(true); return; } }
    var u = new SpeechSynthesisUtterance(c.parts[st.p]);
    u.lang = 'ja-JP'; u.rate = st.rate; if (voice) u.voice = voice;
    u.onend = function () { if (!st.playing) return; st.p++; save(); speak(); };
    u.onerror = function (e) { if (e.error === 'interrupted' || e.error === 'canceled') return; st.p++; if (st.playing) speak(); };
    synth.speak(u);
  }
  function play() {
    st.playing = true; bar.classList.remove('min'); bPlay.textContent = '⏸ 一時停止';
    synth.cancel(); mark(); secs[st.s].el.scrollIntoView({ behavior: 'smooth', block: 'start' }); speak();
  }
  function pause() { st.playing = false; synth.cancel(); bPlay.textContent = '▶ 続きから'; save(); }
  function stop(done) {
    st.playing = false; synth.cancel(); st.s = 0; st.p = 0; save();
    bPlay.textContent = done ? '▶ もう一度聴く' : '▶ 音声で聴く';
    document.querySelectorAll('.ztts-reading').forEach(function (n) { n.classList.remove('ztts-reading'); });
    now.textContent = done ? '最後まで読み上げました' : '';
  }
  function jump(d) {
    st.s = Math.max(0, Math.min(secs.length - 1, st.s + d)); st.p = 0; save();
    if (st.playing) play(); else mark();
  }
  bar.addEventListener('click', function (e) {
    var a = e.target.getAttribute && e.target.getAttribute('data-a');
    if (a === 'play') st.playing ? pause() : play();
    else if (a === 'prev') jump(-1);
    else if (a === 'next') jump(1);
    else if (a === 'stop') stop(false);
  });
  sel.addEventListener('change', function () { st.rate = parseFloat(sel.value); save(); if (st.playing) play(); });

  // 目次クリックでその見出しから読む（再生中のみ）
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]'); if (!a || !st.playing) return;
    var id = a.getAttribute('href').slice(1);
    var i = secs.findIndex(function (x) { return x.el.id === id; });
    if (i >= 0) { st.s = i; st.p = 0; play(); }
  });

  // Chrome の長時間読み上げ停止対策
  setInterval(function () { if (st.playing && synth.speaking && !synth.paused) { synth.pause(); synth.resume(); } }, 12000);
  window.addEventListener('beforeunload', function () { synth.cancel(); });
  if (st.s > 0 || st.p > 0) bPlay.textContent = '▶ 続きから聴く';
  }
})();
