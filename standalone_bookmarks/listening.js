(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const audio = $('audio');
  const play = $('play');
  const seek = $('seek');
  const status = $('status');
  const retry = $('retry');
  const item = window.GIMFLOW_BOOKMARK_ITEM;
  let lang = localStorage.getItem('gimflow-bookmark-lang') === 'zh' ? 'zh' : 'en';
  let failed = false;
  let loadTimer = null;

  const text = {
    en: {
      intro: 'GIMFlow selected and arranged these recordings in advance for this theme. Find a comfortable position and tap play when ready.',
      ready: 'Tap to play · about 90 seconds',
      loading: 'Loading audio, please wait…',
      playing: 'Listening',
      paused: 'Paused. Continue whenever you like.',
      ended: 'The music has ended. Take any feeling with you into the day.',
      error: 'Audio could not load. Check your connection and try again.',
      reflectionMark: '01 / REFLECTION',
      reflectionHeading: 'A thought to keep',
      practiceMark: '02 / GENTLE PRACTICE',
      practiceHeading: 'Three small steps',
      imageryMark: 'AS YOU LISTEN',
      footnote: 'A non-clinical music and imagery experience. It is not a diagnosis or a promise of improvement. No personal information is requested.',
      source: 'Prearranged by theme · tap to listen',
      home: '← Back to homepage',
      retry: 'Reload audio',
      volume: 'Volume',
      play: 'Play music',
      pause: 'Pause music',
      credits: 'Music sources',
      creditsIntro: 'Arranged from two recordings by these artists:'
    },
    zh: {
      intro: '这段音乐由 GIMFlow 按主题预先挑选、编排。找个舒适的姿势，准备好后点播放。',
      ready: '点一下播放 · 约 90 秒',
      loading: '音乐加载中，请稍候…',
      playing: '正在聆听',
      paused: '已暂停，随时可以继续',
      ended: '音乐结束了。可以带着刚才的感受继续一天。',
      error: '音乐加载失败。请检查网络后重试。',
      reflectionMark: '01 / 片刻停留',
      reflectionHeading: '留给自己的话',
      practiceMark: '02 / 温柔地行动',
      practiceHeading: '三个小步骤',
      imageryMark: '聆听时，不妨想象',
      footnote: '这是一段非临床的音乐与意象体验，不代表诊断或疗效。无需输入个人信息。',
      source: '按主题预先编排 · 扫码播放',
      home: '← 返回个人主页',
      retry: '重新加载音乐',
      volume: '音量',
      play: '播放音乐',
      pause: '暂停音乐',
      credits: '音乐来源',
      creditsIntro: '由两段音乐素材编排，原曲来自以下创作者：'
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
        retry.hidden = false;
        setStatus('error');
      }, 15000);
    }
  }

  function paint() {
    const copy = text[lang];
    document.documentElement.lang = lang;
    $('language').textContent = lang === 'zh' ? 'EN' : '中文';
    $('language').setAttribute('aria-label', lang === 'zh' ? '切换为英文' : 'Switch to Chinese');
    $('player').setAttribute('aria-label', lang === 'zh' ? '音乐播放器' : 'Music player');
    $('imagerySection').setAttribute('aria-label', copy.imageryMark);
    $('intro').textContent = copy.intro;
    $('reflectionMark').textContent = copy.reflectionMark;
    $('reflectionHeading').textContent = copy.reflectionHeading;
    $('practiceMark').textContent = copy.practiceMark;
    $('practiceHeading').textContent = copy.practiceHeading;
    $('imageryMark').textContent = copy.imageryMark;
    $('footnote').textContent = copy.footnote;
    $('source').textContent = copy.source;
    $('homeLink').textContent = copy.home;
    $('creditsLabel').textContent = copy.credits;
    $('creditsIntro').textContent = copy.creditsIntro;
    $('volumeLabel').textContent = copy.volume;
    retry.textContent = copy.retry;
    seek.setAttribute('aria-label', lang === 'zh' ? '播放进度' : 'Playback progress');
    play.setAttribute('aria-label', copy[audio.paused ? 'play' : 'pause']);

    if (item) {
      const content = item[lang];
      $('title').textContent = content.title;
      $('line').textContent = content.line;
      $('encouragement').textContent = content.encouragement;
      $('imagePrompt').textContent = content.image;
      const steps = $('steps');
      steps.replaceChildren();
      for (const instruction of [content.action, ...content.steps]) {
        const step = document.createElement('li');
        step.textContent = instruction;
        steps.append(step);
      }
      const credits = $('creditsList');
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
      document.title = `${content.title} · GIMFlow`;
    }
    setStatus(failed ? 'error' : status.dataset.key || 'ready');
  }

  $('language').addEventListener('click', () => {
    lang = lang === 'zh' ? 'en' : 'zh';
    localStorage.setItem('gimflow-bookmark-lang', lang);
    paint();
  });
  play.addEventListener('click', async () => {
    if (!item) return;
    if (!audio.paused) {
      audio.pause();
      return;
    }
    failed = false;
    setStatus('loading');
    try {
      if (audio.ended) audio.currentTime = 0;
      await audio.play();
      retry.hidden = true;
    } catch (_) {
      failed = true;
      setStatus('error');
      retry.hidden = false;
    }
  });
  retry.addEventListener('click', () => {
    failed = false;
    retry.hidden = true;
    setStatus('loading');
    audio.load();
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
    if (!audio.ended && !failed) setStatus('paused');
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
    retry.hidden = false;
    setStatus('error');
  });
  audio.addEventListener('loadedmetadata', () => {
    $('duration').textContent = mmss(audio.duration);
    if (failed) {
      failed = false;
      setStatus('ready');
    }
  });
  audio.addEventListener('timeupdate', () => {
    $('elapsed').textContent = mmss(audio.currentTime);
    if (Number.isFinite(audio.duration) && audio.duration > 0) {
      seek.value = Math.round(1000 * audio.currentTime / audio.duration);
    }
  });
  seek.addEventListener('input', () => {
    if (Number.isFinite(audio.duration) && audio.duration > 0) {
      audio.currentTime = audio.duration * Number(seek.value) / 1000;
    }
  });
  $('volume').addEventListener('input', (event) => {
    audio.volume = Number(event.target.value) / 100;
  });
  audio.volume = 0.8;

  if (!item) {
    $('title').textContent = lang === 'zh' ? '找不到这个主题' : 'Theme not found';
    $('intro').textContent = lang === 'zh' ? '请检查书签上的链接。' : 'Check the link on your bookmark.';
    play.disabled = true;
  } else {
    document.documentElement.style.setProperty('--theme', item.color);
    document.documentElement.style.setProperty('--accent', item.accent);
    audio.src = item.audio;
  }
  paint();
})();
