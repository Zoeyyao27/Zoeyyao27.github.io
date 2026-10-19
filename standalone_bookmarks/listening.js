(() => {
  'use strict';

  const element = (id) => document.getElementById(id);
  const audio = element('audio');
  const play = element('play');
  const seek = element('seek');
  const status = element('status');
  const retry = element('retry');
  const gateway = element('gateway');
  const content = element('content');
  const details = element('audioDetails');
  const item = window.GIMFLOW_BOOKMARK_ITEM;
  const sequence = { anxiety: '01', loneliness: '02', 'low-mood': '03', overload: '04' };
  let lang = localStorage.getItem('gimflow-bookmark-lang') === 'zh' ? 'zh' : 'en';
  let failed = false;
  let loadTimer = null;
  let playbackAttempt = 0;

  const text = {
    en: {
      kicker: 'GIMFLOW · A 90-SECOND LISTENING SPACE',
      enter: 'Enter the experience ↗',
      gateHint: 'Hover over or touch the artwork to see it shift. Music starts when you enter.',
      scrollCue: 'SCROLL TO READ ↓',
      ready: 'Ready to listen',
      loading: 'Loading music…',
      playing: 'Music is playing',
      paused: 'Paused',
      ended: 'The music has ended',
      blocked: 'Tap play to begin',
      error: 'Audio could not load',
      reflectionMark: '01 / A MOMENT TO KEEP',
      reflectionHeading: 'Take this with you',
      practiceMark: '02 / GENTLE PRACTICE',
      practiceHeading: 'Three small steps',
      imageryMark: 'AS YOU LISTEN',
      footnote: 'A non-clinical music and imagery experience. It is not a diagnosis or a promise of improvement. No personal information is requested.',
      source: 'Prearranged by theme · listen at your own pace',
      home: '← Back to homepage',
      retry: 'Reload audio',
      volume: 'Volume',
      controls: 'Playback controls',
      play: 'Play music',
      pause: 'Pause music',
      credits: 'Music sources',
      creditsIntro: 'Arranged from two recordings by these artists:',
      inspiration: 'Design inspired by'
    },
    zh: {
      kicker: 'GIMFLOW · 90 秒聆听空间',
      enter: '进入梦境 ↗',
      gateHint: '将鼠标移到画面上或轻触画面，形状便会舒展；点击进入后音乐开始。',
      scrollCue: '向下滑动阅读 ↓',
      ready: '准备聆听',
      loading: '音乐加载中…',
      playing: '音乐正在播放',
      paused: '已暂停',
      ended: '音乐已结束',
      blocked: '点击播放开始',
      error: '音乐加载失败',
      reflectionMark: '01 / 留给自己的话',
      reflectionHeading: '带走这一句话',
      practiceMark: '02 / 温柔地行动',
      practiceHeading: '三个小步骤',
      imageryMark: '聆听时，不妨想象',
      footnote: '这是一段非临床的音乐与意象体验，不代表诊断或疗效。无需输入个人信息。',
      source: '按主题预先编排 · 按自己的节奏聆听',
      home: '← 返回个人主页',
      retry: '重新加载音乐',
      volume: '音量',
      controls: '播放控制',
      play: '播放音乐',
      pause: '暂停音乐',
      credits: '音乐来源',
      creditsIntro: '由两段音乐素材编排，原曲来自以下创作者：',
      inspiration: '设计灵感来自'
    }
  };

  function mmss(seconds) {
    const total = Math.max(0, Math.floor(seconds || 0));
    return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
  }

  function setStatus(key) {
    status.textContent = text[lang][key];
    status.dataset.key = key;
    clearTimeout(loadTimer);
    if (key === 'loading') {
      loadTimer = setTimeout(() => {
        failed = true;
        audio.pause();
        details.open = true;
        retry.hidden = false;
        setStatus('error');
      }, 15000);
    }
  }

  function paint() {
    const copy = text[lang];
    document.documentElement.lang = lang;
    element('language').textContent = lang === 'zh' ? 'EN' : '中文';
    element('language').setAttribute('aria-label', lang === 'zh' ? '切换为英文' : 'Switch to Chinese');
    element('player').setAttribute('aria-label', lang === 'zh' ? '音乐播放器' : 'Music player');
    element('imagerySection').setAttribute('aria-label', copy.imageryMark);
    const kicker = `${copy.kicker} · ${sequence[document.body.dataset.theme] || '01'} / 04`;
    element('gateKicker').textContent = kicker;
    element('eyebrow').textContent = kicker;
    element('enter').textContent = copy.enter;
    element('gateHint').textContent = copy.gateHint;
    element('scrollCue').textContent = copy.scrollCue;
    element('reflectionMark').textContent = copy.reflectionMark;
    element('reflectionHeading').textContent = copy.reflectionHeading;
    element('practiceMark').textContent = copy.practiceMark;
    element('practiceHeading').textContent = copy.practiceHeading;
    element('imageryMark').textContent = copy.imageryMark;
    element('footnote').textContent = copy.footnote;
    element('source').textContent = copy.source;
    element('homeLink').textContent = copy.home;
    element('creditsLabel').textContent = copy.credits;
    element('creditsIntro').textContent = copy.creditsIntro;
    element('inspirationLabel').textContent = copy.inspiration;
    element('volumeLabel').textContent = copy.volume;
    element('controlsLabel').textContent = copy.controls;
    retry.textContent = copy.retry;
    seek.setAttribute('aria-label', lang === 'zh' ? '播放进度' : 'Playback progress');
    play.setAttribute('aria-label', copy[audio.paused ? 'play' : 'pause']);

    if (item) {
      const contentCopy = item[lang];
      element('gateTitle').textContent = contentCopy.title;
      element('gateLine').textContent = contentCopy.line;
      element('title').textContent = contentCopy.title;
      element('line').textContent = contentCopy.line;
      element('gateTip').textContent = contentCopy.tip;
      element('heroTip').textContent = contentCopy.tip;
      element('encouragement').textContent = contentCopy.encouragement;
      element('imagePrompt').textContent = contentCopy.image;
      const steps = element('steps');
      steps.replaceChildren();
      for (const instruction of [contentCopy.action, ...contentCopy.steps]) {
        const step = document.createElement('li');
        step.textContent = instruction;
        steps.append(step);
      }
      const credits = element('creditsList');
      credits.replaceChildren();
      for (const source of item.sources || []) {
        const credit = document.createElement('li');
        const link = document.createElement('a');
        link.href = source.source_url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = `${source.title} — ${source.artist}`;
        credit.append(link);
        credits.append(credit);
      }
      document.title = `${contentCopy.title} · GIMFlow`;
    }
    setStatus(failed ? 'error' : status.dataset.key || 'ready');
  }

  function startAudio() {
    const attempt = ++playbackAttempt;
    failed = false;
    retry.hidden = true;
    if (audio.ended) audio.currentTime = 0;
    setStatus('loading');
    const playback = audio.play();
    if (playback) {
      playback.catch((error) => {
        if (attempt !== playbackAttempt || error.name === 'AbortError') return;
        if (error.name === 'NotAllowedError') {
          setStatus('blocked');
          return;
        }
        failed = true;
        details.open = true;
        retry.hidden = false;
        setStatus('error');
      });
    }
  }

  element('language').addEventListener('click', () => {
    lang = lang === 'zh' ? 'en' : 'zh';
    localStorage.setItem('gimflow-bookmark-lang', lang);
    paint();
  });

  element('enter').addEventListener('click', () => {
    if (!item) return;
    startAudio();
    gateway.hidden = true;
    document.body.classList.remove('is-gated');
    content.inert = false;
    window.scrollTo(0, 0);
    element('title').focus({ preventScroll: true });
  });

  play.addEventListener('click', () => {
    if (!item) return;
    if (audio.paused) startAudio();
    else audio.pause();
  });

  retry.addEventListener('click', () => {
    audio.load();
    startAudio();
  });

  audio.addEventListener('playing', () => {
    document.body.classList.add('is-playing');
    setStatus('playing');
    play.textContent = 'Ⅱ';
    play.setAttribute('aria-label', text[lang].pause);
  });
  audio.addEventListener('pause', () => {
    document.body.classList.remove('is-playing');
    play.textContent = '▶';
    play.setAttribute('aria-label', text[lang].play);
    if (!audio.ended && !failed && status.dataset.key !== 'blocked') setStatus('paused');
  });
  audio.addEventListener('ended', () => {
    document.body.classList.remove('is-playing');
    setStatus('ended');
    play.textContent = '↻';
  });
  audio.addEventListener('waiting', () => {
    if (!audio.paused) setStatus('loading');
  });
  audio.addEventListener('error', () => {
    failed = true;
    details.open = true;
    retry.hidden = false;
    setStatus('error');
  });
  audio.addEventListener('loadedmetadata', () => {
    element('duration').textContent = mmss(audio.duration);
  });
  audio.addEventListener('timeupdate', () => {
    element('elapsed').textContent = mmss(audio.currentTime);
    if (Number.isFinite(audio.duration) && audio.duration > 0) {
      seek.value = Math.round(1000 * audio.currentTime / audio.duration);
    }
  });
  seek.addEventListener('input', () => {
    if (Number.isFinite(audio.duration) && audio.duration > 0) {
      audio.currentTime = audio.duration * Number(seek.value) / 1000;
    }
  });
  element('volume').addEventListener('input', (event) => {
    audio.volume = Number(event.target.value) / 100;
  });

  audio.volume = 0.65;
  content.inert = true;
  if (!item) {
    element('gateTitle').textContent = lang === 'zh' ? '找不到这个主题' : 'Theme not found';
    element('enter').disabled = true;
  } else {
    audio.src = item.audio;
  }
  paint();
})();
