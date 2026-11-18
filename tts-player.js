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
  var DICT = [["PEACE & LOVE", "ピース アンド ラブ"], ["PEACE&LOVE", "ピース アンド ラブ"], ["STOP-Bang", "ストップバン"], ["風邪（ふうじゃ）", "フウジャ"], ["風邪（風の性質）", "フウジャ、風の性質"], ["下行性疼痛抑制系", "カコウ性疼痛抑制系"], ["SNNOOP10", "スヌープテン"], ["SOCRATES", "ソクラテス"], ["上腕骨顆上骨折", "上腕骨カジョウ骨折"], ["下行性疼痛抑制", "カコウ性疼痛抑制"], ["下行性疼痛調節", "カコウ性疼痛調節"], ["口腔筋機能療法", "コウコウキン機能療法"], ["筋外筋膜力伝達", "キンガイ筋膜力伝達"], ["衛気営血弁証", "エイキエイケツ弁証"], ["大腿骨前捻角", "大腿骨ゼンネンカク"], ["下行性抑制系", "カコウ性抑制系"], ["深層外旋六筋", "深層ガイセンロッキン"], ["大腿筋膜張筋", "大腿キンマクチョウキン"], ["OPQRST", "オーピーキューアールエスティー"], ["馬尾症候群", "バビ症候群"], ["神経根症状", "神経コン症状"], ["神経根障害", "神経コン障害"], ["頸原性頭痛", "ケイゲン性頭痛"], ["外側上顆炎", "ガイソクジョウカエン"], ["内側上顆炎", "ナイソクジョウカエン"], ["大腿骨前捻", "大腿骨ゼンネン"], ["上前腸骨棘", "ジョウゼン腸骨キョク"], ["上後腸骨棘", "ジョウコウ腸骨キョク"], ["下前腸骨棘", "カゼン腸骨キョク"], ["下後腸骨棘", "カコウ腸骨キョク"], ["仙結節靭帯", "センケッセツ靭帯"], ["指床間距離", "シショウカン距離"], ["下行性抑制", "カコウ性抑制"], ["うっ滞状態", "ウッタイ状態"], ["間欠性跛行", "カンケツセイハコウ"], ["大腿四頭筋", "大腿シトウキン"], ["下腿三頭筋", "下腿サントウキン"], ["上腕二頭筋", "上腕ニトウキン"], ["上腕三頭筋", "上腕サントウキン"], ["大腿二頭筋", "大腿ニトウキン"], ["胸鎖乳突筋", "胸鎖ニュウトツキン"], ["アブミ骨筋", "アブミコツキン"], ["脊柱起立筋", "脊柱キリツキン"], ["上方回旋筋", "上方カイセンキン"], ["下方回旋筋", "下方カイセンキン"], ["腹直筋離開", "フクチョクキン離開"], ["回旋筋腱板", "カイセンキン腱板"], ["後頭下筋群", "コウトウカキン群"], ["深層頸屈筋", "深層ケイクッキン"], ["外側翼突筋", "外側ヨクトツキン"], ["内側翼突筋", "内側ヨクトツキン"], ["深層外旋筋", "深層ガイセンキン"], ["母趾外転筋", "ボシガイテンキン"], ["小趾外転筋", "ショウシガイテンキン"], ["長母趾屈筋", "チョウボシクッキン"], ["骨盤底筋群", "骨盤テイキン群"], ["恥骨直腸筋", "恥骨チョクチョウキン"], ["恥骨尾骨筋", "恥骨ビコツキン"], ["腸骨尾骨筋", "腸骨ビコツキン"], ["坐骨尾骨筋", "坐骨ビコツキン"], ["尾骨周囲筋", "尾骨シュウイキン"], ["足部内在筋", "足部ナイザイキン"], ["呼吸補助筋", "呼吸ホジョキン"], ["姿勢保持筋", "姿勢ホジキン"], ["神経筋促通", "シンケイキン促通"], ["神経筋協調", "シンケイキン協調"], ["神経筋疾患", "シンケイキン疾患"], ["筋腱移行部", "キンケン移行部"], ["筋腱複合体", "キンケン複合体"], ["筋外力伝達", "キンガイ力伝達"], ["筋横断面積", "キン横断面積"], ["立ちくらみ", "タチくらみ"], ["こむら返り", "コムラ返り"], ["ぎっくり腰", "ギックリ腰"], ["つま先立ち", "ツマサキダち"], ["RCRSP", "アールシーアールエスピー"], ["OARSI", "オーエーアールエスアイ"], ["HINTS", "ヒンツ"], ["RED-S", "レッドエス"], ["SCAT6", "スキャットシックス"], ["六経弁証", "リッケイ弁証"], ["衛気営血", "エイキエイケツ"], ["肝気鬱結", "カンキウッケツ"], ["肝気犯胃", "カンキハンイ"], ["半表半裏", "ハンピョウハンリ"], ["五臓六腑", "ゴゾウロップ"], ["少陰腎経", "ショウインジンケイ"], ["馬尾神経", "バビ神経"], ["神経根症", "神経コン症"], ["神経根痛", "神経コン痛"], ["神経根型", "神経コン型"], ["外側上顆", "ガイソクジョウカ"], ["内側上顆", "ナイソクジョウカ"], ["顆間距離", "カカン距離"], ["脛骨外捻", "脛骨ガイネン"], ["脛骨内捻", "脛骨ナイネン"], ["足底挿板", "ソクテイソウバン"], ["仙棘靭帯", "センキョク靭帯"], ["腸脛靭帯", "チョウケイ靭帯"], ["鎖骨上窩", "鎖骨ジョウカ"], ["蜂窩織炎", "ホウカシキエン"], ["胸腰筋膜", "キョウヨウキンマク"], ["歩隔拡大", "ホカク拡大"], ["うっ滞性", "ウッタイ性"], ["うっ滞層", "ウッタイ層"], ["禁忌肢位", "キンキシイ"], ["外反母趾", "ガイハンボシ"], ["内反小趾", "ナイハンショウシ"], ["鷲手変形", "ワシテ変形"], ["四肢麻痺", "シシマヒ"], ["間欠跛行", "カンケツハコウ"], ["遠心性筋", "遠心性キン"], ["求心性筋", "求心性キン"], ["等尺性筋", "等尺性キン"], ["内腹斜筋", "ナイフクシャキン"], ["外腹斜筋", "ガイフクシャキン"], ["背筋運動", "ハイキン運動"], ["肩甲挙筋", "ケンコウキョキン"], ["肩甲下筋", "ケンコウカキン"], ["頭板状筋", "トウバンジョウキン"], ["頸板状筋", "ケイバンジョウキン"], ["頸半棘筋", "ケイハンキョクキン"], ["後頭下筋", "コウトウカキン"], ["腰方形筋", "ヨウホウケイキン"], ["長内転筋", "チョウナイテンキン"], ["短内転筋", "タンナイテンキン"], ["大内転筋", "ダイナイテンキン"], ["内転筋群", "ナイテンキン群"], ["内側広筋", "内側コウキン"], ["外側広筋", "外側コウキン"], ["中間広筋", "中間コウキン"], ["大腿直筋", "大腿チョッキン"], ["半腱様筋", "ハンケンヨウキン"], ["半膜様筋", "ハンマクヨウキン"], ["前脛骨筋", "ゼンケイコツキン"], ["後脛骨筋", "コウケイコツキン"], ["ヒラメ筋", "ヒラメキン"], ["長腓骨筋", "チョウヒコツキン"], ["短腓骨筋", "タンヒコツキン"], ["腓骨筋群", "ヒコツキン群"], ["足底筋群", "ソクテイキン群"], ["短趾屈筋", "タンシクッキン"], ["長趾屈筋", "チョウシクッキン"], ["骨盤底筋", "骨盤テイキン"], ["足内在筋", "足ナイザイキン"], ["手内在筋", "手ナイザイキン"], ["抗重力筋", "コウジュウリョクキン"], ["筋骨格系", "キンコッカクケイ"], ["筋持久力", "キン持久力"], ["筋線維束", "キンセンイ束"], ["筋断面積", "キン断面積"], ["むち打ち", "ムチ打ち"], ["息苦しさ", "イキグルしさ"], ["息苦しい", "イキグルしい"], ["うつ伏せ", "ウツブせ"], ["うつぶせ", "ウツブせ"], ["四つ這い", "ヨツバイ"], ["片脚立ち", "カタアシダち"], ["片脚立位", "カタアシ立位"], ["片足立ち", "カタアシダち"], ["肩代わり", "カタガワり"], ["位置づけ", "イチづけ"], ["位置付け", "イチヅけ"], ["見落とし", "ミオトし"], ["見落とさ", "ミオトさ"], ["見落とす", "ミオトす"], ["繰り返し", "クリカエし"], ["繰り返す", "クリカエす"], ["繰り返さ", "クリカエさ"], ["ACWR", "エーシーダブリューアール"], ["SFMA", "エスエフエムエー"], ["PSFS", "ピーエスエフエス"], ["BPPV", "ビーピーピーブイ"], ["BPSD", "ビーピーエスディー"], ["MTSS", "エムティーエスエス"], ["REDs", "レッズ"], ["CRT6", "シーアールティーシックス"], ["MCID", "エムシーアイディー"], ["mmHg", "ミリメートルエイチジー"], ["気血水", "キケツスイ"], ["気分証", "キブンショウ"], ["脾気虚", "ヒキキョ"], ["腎陽虚", "ジンヨウキョ"], ["腎陰虚", "ジンインキョ"], ["足三里", "アシサンリ"], ["手太陰", "テタイイン"], ["手厥陰", "テケツイン"], ["足太陽", "アシタイヨウ"], ["馬尾型", "バビ型"], ["神経根", "神経コン"], ["頸原性", "ケイゲン性"], ["前捻角", "ゼンネンカク"], ["捻髪音", "ネンパツオン"], ["椎間板", "ツイカンバン"], ["踵骨棘", "ショウコツキョク"], ["棘突起", "キョク突起"], ["横突起", "オウ突起"], ["腸骨棘", "腸骨キョク"], ["関節窩", "関節カ"], ["横隔膜", "オウカクマク"], ["足病学", "ソクビョウガク"], ["足病医", "ソクビョウイ"], ["足病変", "ソクビョウヘン"], ["下行性", "カコウ性"], ["うっ滞", "ウッタイ"], ["停滞層", "テイタイ層"], ["背臥位", "ハイガイ"], ["仰臥位", "ギョウガイ"], ["腹臥位", "フクガイ"], ["側臥位", "ソクガイ"], ["端座位", "タンザイ"], ["長座位", "チョウザイ"], ["内反膝", "ナイハンシツ"], ["外反膝", "ガイハンシツ"], ["反張膝", "ハンチョウシツ"], ["扁平足", "ヘンペイソク"], ["下垂足", "カスイソク"], ["下垂手", "カスイシュ"], ["片麻痺", "カタマヒ"], ["対麻痺", "ツイマヒ"], ["単麻痺", "タンマヒ"], ["放散痛", "ホウサンツウ"], ["関連痛", "カンレンツウ"], ["起立筋", "キリツキン"], ["腹直筋", "フクチョクキン"], ["腹横筋", "フクオウキン"], ["腹斜筋", "フクシャキン"], ["腹壁筋", "フクヘキキン"], ["腹筋群", "フッキン群"], ["背筋群", "ハイキン群"], ["多裂筋", "タレツキン"], ["広背筋", "コウハイキン"], ["僧帽筋", "ソウボウキン"], ["三角筋", "サンカクキン"], ["大胸筋", "ダイキョウキン"], ["小胸筋", "ショウキョウキン"], ["前鋸筋", "ゼンキョキン"], ["菱形筋", "リョウケイキン"], ["棘上筋", "キョクジョウキン"], ["棘下筋", "キョッカキン"], ["小円筋", "ショウエンキン"], ["大円筋", "ダイエンキン"], ["斜角筋", "シャカクキン"], ["頭長筋", "トウチョウキン"], ["頸長筋", "ケイチョウキン"], ["咀嚼筋", "ソシャクキン"], ["側頭筋", "ソクトウキン"], ["表情筋", "ヒョウジョウキン"], ["眼輪筋", "ガンリンキン"], ["口輪筋", "コウリンキン"], ["前頭筋", "ゼントウキン"], ["腸腰筋", "チョウヨウキン"], ["大腰筋", "ダイヨウキン"], ["腸骨筋", "チョウコツキン"], ["大殿筋", "ダイデンキン"], ["中殿筋", "チュウデンキン"], ["小殿筋", "ショウデンキン"], ["殿筋群", "デンキン群"], ["梨状筋", "リジョウキン"], ["外旋筋", "ガイセンキン"], ["内旋筋", "ナイセンキン"], ["外転筋", "ガイテンキン"], ["内転筋", "ナイテンキン"], ["恥骨筋", "チコツキン"], ["縫工筋", "ホウコウキン"], ["膝窩筋", "シッカキン"], ["腓腹筋", "ヒフクキン"], ["腓骨筋", "ヒコツキン"], ["足底筋", "ソクテイキン"], ["虫様筋", "チュウヨウキン"], ["骨間筋", "コッカンキン"], ["尾骨筋", "ビコツキン"], ["内在筋", "ナイザイキン"], ["外在筋", "ガイザイキン"], ["呼吸筋", "コキュウキン"], ["補助筋", "ホジョキン"], ["主働筋", "シュドウキン"], ["拮抗筋", "キッコウキン"], ["協働筋", "キョウドウキン"], ["安定筋", "アンテイキン"], ["姿勢筋", "シセイキン"], ["深層筋", "シンソウキン"], ["表層筋", "ヒョウソウキン"], ["近位筋", "キンイキン"], ["遠位筋", "エンイキン"], ["伸展筋", "シンテンキン"], ["屈曲筋", "クッキョクキン"], ["周囲筋", "シュウイキン"], ["単一筋", "タンイツキン"], ["特定筋", "トクテイキン"], ["該当筋", "ガイトウキン"], ["弱化筋", "ジャッカキン"], ["抑制筋", "ヨクセイキン"], ["頸部筋", "ケイブキン"], ["頚部筋", "ケイブキン"], ["足部筋", "ソクブキン"], ["筋骨格", "キンコッカク"], ["神経筋", "シンケイキン"], ["筋機能", "キン機能"], ["筋肥大", "キンヒダイ"], ["筋出力", "キン出力"], ["筋活動", "キン活動"], ["筋緊張", "キン緊張"], ["筋弛緩", "キン弛緩"], ["筋萎縮", "キン萎縮"], ["筋損傷", "キン損傷"], ["筋断裂", "キン断裂"], ["筋挫傷", "キン挫傷"], ["筋痙攣", "キン痙攣"], ["筋疲労", "キン疲労"], ["筋線維", "キンセンイ"], ["筋繊維", "キンセンイ"], ["筋紡錘", "キンボウスイ"], ["筋外膜", "キンガイマク"], ["筋周膜", "キンシュウマク"], ["筋内膜", "キンナイマク"], ["筋疾患", "キン疾患"], ["筋領域", "キン領域"], ["筋同士", "キン同士"], ["膝崩れ", "ヒザクズレ"], ["膝折れ", "ヒザオレ"], ["肉離れ", "ニクバナれ"], ["寝違え", "ネチガえ"], ["寝返り", "ネガエり"], ["ばね指", "バネ指"], ["巻き爪", "マキ爪"], ["陥入爪", "カンニュウソウ"], ["息切れ", "イキギれ"], ["息止め", "イキドめ"], ["息継ぎ", "イキツぎ"], ["仰向け", "アオムけ"], ["踵上げ", "カカトアげ"], ["空振り", "カラブり"], ["橋渡し", "ハシワタし"], ["手放し", "テバナし"], ["片付け", "カタヅけ"], ["裏付け", "ウラヅけ"], ["見逃し", "ミノガし"], ["見逃さ", "ミノガさ"], ["見逃す", "ミノガす"], ["見送り", "ミオクり"], ["見送る", "ミオクる"], ["見守り", "ミマモり"], ["見守る", "ミマモる"], ["見捨て", "ミステ"], ["長引き", "ナガビき"], ["長引く", "ナガビく"], ["長引い", "ナガビい"], ["間違い", "マチガい"], ["間違え", "マチガえ"], ["一日中", "イチニチジュウ"], ["今日中", "キョウジュウ"], ["当日中", "トウジツチュウ"], ["午前中", "ゴゼンチュウ"], ["FMS", "エフエムエス"], ["DNS", "ディーエヌエス"], ["PRI", "ピーアールアイ"], ["TLF", "ティーエルエフ"], ["IAP", "アイエーピー"], ["NRS", "エヌアールエス"], ["VAS", "ブイエーエス"], ["RPE", "アールピーイー"], ["RIR", "アールアイアール"], ["1RM", "ワンアールエム"], ["HRV", "エイチアールブイ"], ["AHI", "エーエイチアイ"], ["DVT", "ディーブイティー"], ["ACL", "エーシーエル"], ["PCL", "ピーシーエル"], ["MCL", "エムシーエル"], ["LCL", "エルシーエル"], ["TMD", "ティーエムディー"], ["TMJ", "ティーエムジェイ"], ["TOS", "ティーオーエス"], ["CAI", "シーエーアイ"], ["PFP", "ピーエフピー"], ["FAI", "エフエーアイ"], ["DCD", "ディーシーディー"], ["VBI", "ブイビーアイ"], ["CAD", "シーエーディー"], ["RCT", "アールシーティー"], ["MDC", "エムディーシー"], ["六経", "リッケイ"], ["衛気", "エイキ"], ["営血", "エイケツ"], ["衛分", "エイブン"], ["気血", "キケツ"], ["血分", "ケツブン"], ["血瘀", "ケツオ"], ["瘀血", "オケツ"], ["お血", "オケツ"], ["水滞", "スイタイ"], ["気滞", "キタイ"], ["食滞", "ショクタイ"], ["粘滞", "ネンタイ"], ["水湿", "スイシツ"], ["痰湿", "タンシツ"], ["表証", "ヒョウショウ"], ["裏証", "リショウ"], ["寒熱", "カンネツ"], ["虚実", "キョジツ"], ["補瀉", "ホシャ"], ["四診", "シシン"], ["腹診", "フクシン"], ["腹証", "フクショウ"], ["舌診", "ゼツシン"], ["脈診", "ミャクシン"], ["望診", "ボウシン"], ["聞診", "ブンシン"], ["切診", "セッシン"], ["取穴", "シュケツ"], ["経穴", "ケイケツ"], ["経絡", "ケイラク"], ["経筋", "ケイキン"], ["経脈", "ケイミャク"], ["臓象", "ゾウショウ"], ["三焦", "サンショウ"], ["六淫", "ロクイン"], ["外邪", "ガイジャ"], ["湿邪", "シツジャ"], ["寒邪", "カンジャ"], ["暑邪", "ショジャ"], ["燥邪", "ソウジャ"], ["火邪", "カジャ"], ["熱邪", "ネツジャ"], ["諸邪", "ショジャ"], ["六邪", "ロクジャ"], ["痺証", "ヒショウ"], ["行痺", "コウヒ"], ["痛痺", "ツウヒ"], ["着痺", "チャクヒ"], ["熱痺", "ネツヒ"], ["面癱", "メンタン"], ["鼓脹", "コチョウ"], ["陰実", "インジツ"], ["陽実", "ヨウジツ"], ["偽鍼", "ギシン"], ["内関", "ナイカン"], ["馬尾", "バビ"], ["前捻", "ゼンネン"], ["外捻", "ガイネン"], ["内捻", "ナイネン"], ["挿板", "ソウバン"], ["骨棘", "コッキョク"], ["外果", "ガイカ"], ["内果", "ナイカ"], ["果部", "カブ"], ["膝窩", "シッカ"], ["腋窩", "エキカ"], ["肘窩", "チュウカ"], ["歩隔", "ホカク"], ["下行", "カコウ"], ["肢位", "シイ"], ["立位", "リツイ"], ["座位", "ザイ"], ["回外", "カイガイ"], ["回内", "カイナイ"], ["背屈", "ハイクツ"], ["底屈", "テイクツ"], ["掌屈", "ショウクツ"], ["撓屈", "トウクツ"], ["橈屈", "トウクツ"], ["尺屈", "シャックツ"], ["凹足", "オウソク"], ["尖足", "センソク"], ["鷲手", "ワシテ"], ["猿手", "サルテ"], ["跛行", "ハコウ"], ["振戦", "シンセン"], ["固縮", "コシュク"], ["拘縮", "コウシュク"], ["強直", "キョウチョク"], ["硬結", "コウケツ"], ["腫脹", "シュチョウ"], ["発赤", "ホッセキ"], ["擦過", "サッカ"], ["叩打", "コウダ"], ["免荷", "メンカ"], ["抜重", "バツジュウ"], ["除痛", "ジョツウ"], ["圧痛", "アッツウ"], ["腹筋", "フッキン"], ["背筋", "ハイキン"], ["咬筋", "コウキン"], ["殿筋", "デンキン"], ["薄筋", "ハッキン"], ["伸筋", "シンキン"], ["屈筋", "クッキン"], ["単筋", "タンキン"], ["筋腱", "キンケン"], ["筋腹", "キンプク"], ["筋量", "キンリョウ"], ["筋群", "キングン"], ["筋痛", "キンツウ"], ["筋炎", "キンエン"], ["筋症", "キンショウ"], ["水虫", "ミズムシ"], ["اب", ""], ["本稿", "ホンコウ"], ["本回", "ホンカイ"]];
  function normJP(t) {
    for (var i = 0; i < DICT.length; i++) {
      if (t.indexOf(DICT[i][0]) !== -1) t = t.split(DICT[i][0]).join(DICT[i][1]);
    }
    t = t.replace(/(?<![一-龥ァ-ヶー])筋(?![肉力膜道]|群|たち)/g, "キン").replace(/筋たち/g, "キンたち");
    t = t.replace(/(の|た|る|い|な|同じ|他の|別の|多くの|個々の)方([、。にをはがもでへとやのからまでより（)】」』\s])/g, function(m, p1, p2) {
      if (/^が(高|低|良|いい|よ|やす|多|少|強|弱|安全|早|遅|先|大|小|長|短|深|浅|楽|大事|重要|自然|確実|有効|適)/.test(p2)) return m;
      return p1 + "かた" + p2;
    });
    t = t.replace(/行(わ|い|う|え|お)/g, "おこな$1");
    t = t.replace(/([0-9０-９]+)歳/g, "$1サイ");
    return normJP(t);
  }
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
  if (title) secs.push({ el: title, name: 'タイトル', parts: split(normJP(title.textContent + '。' + (sub ? sub.textContent + '。' : ''))) });
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
