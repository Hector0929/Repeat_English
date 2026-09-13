/**
 * Repeat English - Web Speech API 核心模組
 * 專門解決 macOS / iOS / Chrome / Safari 上的各類發音異常：
 * 1. 避免誤用中文系統語音 (如 Meijia) 朗讀英文
 * 2. 過濾 macOS 內建趣味/音效語音 (如 Albert, Zarvox, Bad News)
 * 3. 優先挑選自然高品質英文發音 (Samantha, Ava, Alex, Google US English 等)
 * 4. 防止 WebKit / Chromium Garbage Collection 中途掐斷發音
 * 5. 修復 macOS 上 cancel() 與 speak() 在同一同步 frame 內造成的訊號覆蓋
 * 6. 避免 Safari broken resume() 造成的卡死問題
 * 7. 長文本自動分句朗讀，避免 15 秒超時截斷
 */

// macOS 內建的趣味/音效語音（必須過濾，避免發出怪聲）
const NOVELTY_VOICES = new Set([
  'albert',
  'bad news',
  'bahh',
  'bells',
  'boing',
  'bubbles',
  'cellos',
  'good news',
  'jester',
  'junior',
  'organ',
  'superstar',
  'trinoids',
  'whisper',
  'zarvox',
]);

// 優先選取的自然英文發音名稱關鍵字（按品質排序）
const PREFERRED_VOICE_NAMES = [
  'samantha',           // macOS 預設自然美語 (最推薦)
  'ava',                 // macOS Siri 美語
  'alex',                // macOS 經典高品質美語
  'google us english',   // Chrome 高品質美語
  'flo',                 // macOS 美語
  'eddy',                // macOS 美語
  'kathy',               // macOS 美語
  'allison',             // macOS 美語
  'victoria',            // macOS 美語
  'daniel',              // 英國標準英語
  'natural',             // Edge / Windows 自然語音
];

// 防止 WebKit / Chromium GC 回收正在朗讀的 Utterance
const activeUtterances = new Set<SpeechSynthesisUtterance>();

/**
 * 取得所有可用的非趣味英文語音
 */
export function getEnglishVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return [];
  const allVoices = window.speechSynthesis.getVoices();

  return allVoices.filter((v) => {
    const lang = (v.lang || '').toLowerCase().replace('_', '-');
    const name = (v.name || '').toLowerCase();
    const isEnglish = lang.startsWith('en');
    const isNovelty = NOVELTY_VOICES.has(name);
    return isEnglish && !isNovelty;
  });
}

/**
 * 取得最佳美式/英式英文發音語音（優先挑選 Samantha、Ava、Alex 等高品質語音）
 */
export function getBestEnglishVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  const englishVoices = getEnglishVoices();
  if (englishVoices.length === 0) {
    const anyVoices = window.speechSynthesis.getVoices();
    // 盡量挑選 lang 以 en 開頭的
    const enFallback = anyVoices.find((v) =>
      (v.lang || '').toLowerCase().replace('_', '-').startsWith('en')
    );
    return enFallback || anyVoices[0] || null;
  }

  // 1. 依偏好清單關鍵字比對
  for (const pref of PREFERRED_VOICE_NAMES) {
    const match = englishVoices.find((v) =>
      v.name.toLowerCase().includes(pref)
    );
    if (match) return match;
  }

  // 2. 挑選 en-US
  const usVoice = englishVoices.find((v) => {
    const lang = (v.lang || '').toLowerCase().replace('_', '-');
    return lang === 'en-us';
  });
  if (usVoice) return usVoice;

  // 3. 任何非趣味英文語音
  return englishVoices[0] || null;
}

/**
 * 註冊 Utterance，防止 WebKit / Blink GC 提前回收
 */
export function registerUtterance(utterance: SpeechSynthesisUtterance): () => void {
  activeUtterances.add(utterance);
  return () => {
    activeUtterances.delete(utterance);
  };
}

/**
 * 停止所有正在進行的語音朗讀
 */
export function stopSpeech(): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  activeUtterances.forEach((u) => {
    u.onend = null;
    u.onerror = null;
    u.onboundary = null;
  });
  activeUtterances.clear();
  window.speechSynthesis.cancel();
}

/**
 * 朗讀單一單字或短語 (適用於 Flashcard, 單字彈窗, 單字列表)
 */
export function speakWord(
  text: string,
  options?: {
    rate?: number;
    volume?: number;
    onEnd?: () => void;
    onError?: (err: unknown) => void;
  }
): () => void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return () => {};
  }

  const { rate = 0.9, volume = 1.0, onEnd, onError } = options || {};

  // 先清空先前的朗讀
  stopSpeech();

  // 若目前處於 paused 狀態，先 resume
  if (window.speechSynthesis.paused) {
    window.speechSynthesis.resume();
  }

  // macOS 關鍵：cancel() 後稍微等待 40ms，避免取消訊號吞掉新的朗讀請求
  const timer = setTimeout(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    const bestVoice = getBestEnglishVoice();
    if (bestVoice) {
      utterance.voice = bestVoice;
    }
    utterance.lang = 'en-US';
    utterance.rate = Math.max(0.5, Math.min(2.0, rate));
    utterance.volume = Math.max(0, Math.min(1.0, volume));

    // 防止 GC 回收
    activeUtterances.add(utterance);

    utterance.onend = () => {
      activeUtterances.delete(utterance);
      onEnd?.();
    };

    utterance.onerror = (event) => {
      activeUtterances.delete(utterance);
      // 忽略使用者主動中斷或取消的事件
      if (event.error === 'canceled' || event.error === 'interrupted') {
        return;
      }
      console.warn('Web Speech error:', event);
      onError?.(event);
    };

    window.speechSynthesis.speak(utterance);
  }, 40);

  return () => {
    clearTimeout(timer);
    stopSpeech();
  };
}

/**
 * 將長文本拆分為句子與段落
 */
export function splitTextIntoSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/**
 * 朗讀整篇文章（逐句循序播放，避免 15 秒截斷限制）
 */
export function speakArticle(
  text: string,
  options?: {
    rate?: number;
    volume?: number;
    onSentenceChange?: (index: number, total: number) => void;
    onEnd?: () => void;
    onError?: (err: unknown) => void;
  }
): { stop: () => void } {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return { stop: () => {} };
  }

  const sentences = splitTextIntoSentences(text);
  if (sentences.length === 0) {
    options?.onEnd?.();
    return { stop: () => {} };
  }

  let isStopped = false;
  let currentIndex = 0;
  let currentUtterance: SpeechSynthesisUtterance | null = null;
  let timer: NodeJS.Timeout | null = null;

  stopSpeech();

  const playNextSentence = () => {
    if (isStopped || currentIndex >= sentences.length) {
      if (!isStopped) options?.onEnd?.();
      return;
    }

    options?.onSentenceChange?.(currentIndex, sentences.length);

    const utterance = new SpeechSynthesisUtterance(sentences[currentIndex]);
    const bestVoice = getBestEnglishVoice();
    if (bestVoice) {
      utterance.voice = bestVoice;
    }
    utterance.lang = 'en-US';
    utterance.rate = options?.rate ?? 0.95;
    utterance.volume = options?.volume ?? 1.0;

    currentUtterance = utterance;
    activeUtterances.add(utterance);

    utterance.onend = () => {
      activeUtterances.delete(utterance);
      if (isStopped) return;
      currentIndex++;
      // 下一句接續播放（不呼叫 cancel，直接無縫播放）
      playNextSentence();
    };

    utterance.onerror = (e) => {
      activeUtterances.delete(utterance);
      if (e.error === 'canceled' || e.error === 'interrupted') return;
      if (!isStopped) {
        options?.onError?.(e);
      }
    };

    window.speechSynthesis.speak(utterance);
  };

  // 初始播放等待 tick
  timer = setTimeout(() => {
    if (isStopped) return;
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
    playNextSentence();
  }, 40);

  return {
    stop: () => {
      isStopped = true;
      if (timer) clearTimeout(timer);
      if (currentUtterance) {
        currentUtterance.onend = null;
        currentUtterance.onerror = null;
      }
      stopSpeech();
    },
  };
}
