'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Repeat,
  Repeat1,
  Settings,
} from 'lucide-react';
import {
  getBestEnglishVoice,
  splitTextIntoSentences,
  stopSpeech,
  registerUtterance,
} from '@/lib/speech';

interface AudioPlayerProps {
  /** 要朗讀的文章內容 */
  text: string;
  /** 朗讀進度回呼：回傳目前朗讀到的字元索引 */
  onBoundary?: (charIndex: number) => void;
}

/**
 * 音訊播放器元件
 * 使用 Web Speech API 實現文字轉語音
 * 支援：播放/暫停、語速調整、反覆播放、音量控制
 */
export default function AudioPlayer({ text, onBoundary }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [rate, setRate] = useState(1.0);
  const [volume] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentSentenceIdx, setCurrentSentenceIdx] = useState(0);

  // 將文章拆分為句子
  const sentences = useRef<string[]>([]);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const settingsRef = useRef<HTMLDivElement>(null);
  const speakSentenceRef = useRef<(idx: number, isSequential?: boolean) => void>(() => {});

  // 初始化句子陣列
  useEffect(() => {
    sentences.current = splitTextIntoSentences(text);
  }, [text]);

  // 點擊設定面板外部時關閉
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setShowSettings(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 清理
  useEffect(() => {
    return () => {
      stopSpeech();
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, []);

  /** 估算朗讀總時長（毫秒） */
  const estimateDuration = useCallback(
    (txt: string) => {
      // 英文平均語速約 150 wpm，調整 rate
      const words = txt.split(/\s+/).length;
      const minutes = words / (150 * rate);
      return minutes * 60 * 1000;
    },
    [rate]
  );

  /** 開始朗讀指定句子索引 */
  const speakSentence = useCallback(
    (idx: number, isSequential: boolean = false) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

      if (idx >= sentences.current.length) {
        if (isLooping) {
          // 全文循環：重頭開始
          setCurrentSentenceIdx(0);
          setTimeout(() => speakSentenceRef.current(0, false), 300);
          return;
        }
        // 朗讀結束
        setIsPlaying(false);
        setProgress(100);
        if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
        return;
      }

      const doSpeak = () => {
        if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }

        const utterance = new SpeechSynthesisUtterance(sentences.current[idx]);
        utterance.rate = rate;
        utterance.volume = isMuted ? 0 : volume;
        utterance.lang = 'en-US';

        const bestVoice = getBestEnglishVoice();
        if (bestVoice) utterance.voice = bestVoice;

        // 邊界事件：同步高亮
        utterance.onboundary = (event) => {
          if (event.name === 'word') {
            // 計算全文中的字元偏移
            let offset = 0;
            for (let i = 0; i < idx; i++) {
              offset += sentences.current[i].length + 1;
            }
            onBoundary?.(offset + event.charIndex);
          }
        };

        const unregister = registerUtterance(utterance);

        // 結束事件：播放下一句（直接接續，不呼叫 cancel 避免覆蓋訊號）
        utterance.onend = () => {
          unregister();
          const nextIdx = idx + 1;
          setCurrentSentenceIdx(nextIdx);
          speakSentenceRef.current(nextIdx, true);
        };

        utterance.onerror = (e) => {
          unregister();
          if (e.error === 'canceled' || e.error === 'interrupted') return;
          console.warn('AudioPlayer speech error:', e);
          setIsPlaying(false);
          if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
        };

        utteranceRef.current = utterance;
        setCurrentSentenceIdx(idx);

        // 模擬進度條
        startTimeRef.current = Date.now();
        const sentencesBefore = sentences.current.slice(0, idx).join(' ');
        const baseProgress = text.length > 0 ? (sentencesBefore.length / text.length) * 100 : 0;
        const sentenceDuration = estimateDuration(sentences.current[idx]);

        if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = setInterval(() => {
          const elapsed = Date.now() - startTimeRef.current;
          const sentenceProgress = Math.min(elapsed / sentenceDuration, 1);
          const sentenceRatio =
            text.length > 0 ? (sentences.current[idx].length / text.length) * 100 : 0;
          setProgress(Math.min(baseProgress + sentenceProgress * sentenceRatio, 100));
        }, 100);

        window.speechSynthesis.speak(utterance);
      };

      if (!isSequential) {
        stopSpeech();
        setTimeout(doSpeak, 40);
      } else {
        doSpeak();
      }
    },
    [rate, volume, isMuted, isLooping, text, estimateDuration, onBoundary]
  );

  useEffect(() => {
    speakSentenceRef.current = speakSentence;
  }, [speakSentence]);

  /** 播放 / 暫停 */
  const togglePlay = useCallback(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    if (isPlaying) {
      stopSpeech();
      setIsPlaying(false);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    } else {
      setIsPlaying(true);
      const targetIdx = progress >= 99 ? 0 : currentSentenceIdx;
      if (targetIdx === 0) setProgress(0);
      speakSentence(targetIdx, false);
    }
  }, [isPlaying, currentSentenceIdx, speakSentence, progress]);

  /** 上一句 */
  const prevSentence = useCallback(() => {
    const newIdx = Math.max(0, currentSentenceIdx - 1);
    setIsPlaying(true);
    speakSentence(newIdx, false);
  }, [currentSentenceIdx, speakSentence]);

  /** 下一句 */
  const nextSentence = useCallback(() => {
    const newIdx = Math.min(sentences.current.length - 1, currentSentenceIdx + 1);
    setIsPlaying(true);
    speakSentence(newIdx, false);
  }, [currentSentenceIdx, speakSentence]);

  /** 切換循環模式 */
  const toggleLoop = useCallback(() => {
    setIsLooping((prev) => !prev);
  }, []);

  /** 切換靜音 */
  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  /** 格式化時間 */
  const formatTime = (progressPct: number) => {
    const totalSec = estimateDuration(text) / 1000;
    const currentSec = (progressPct / 100) * totalSec;
    const format = (s: number) => {
      const min = Math.floor(s / 60);
      const sec = Math.floor(s % 60);
      return `${min}:${sec.toString().padStart(2, '0')}`;
    };
    return `${format(currentSec)} / ${format(totalSec)}`;
  };

  /** 進度條拖拉 */
  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    setProgress(value);
    // 計算應該跳到哪個句子
    const targetCharIndex = (value / 100) * text.length;
    let accumulated = 0;
    let targetIdx = 0;
    for (let i = 0; i < sentences.current.length; i++) {
      accumulated += sentences.current[i].length + 1;
      if (accumulated >= targetCharIndex) {
        targetIdx = i;
        break;
      }
    }
    stopSpeech();
    if (isPlaying) {
      speakSentence(targetIdx, false);
    } else {
      setCurrentSentenceIdx(targetIdx);
    }
  };

  // 速率選項
  const rateOptions = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];

  return (
    <div className="bg-[#1B4965] rounded-b-xl px-4 py-3 sm:px-6 sm:py-4">
      {/* 進度條 */}
      <div className="mb-3">
        <input
          type="range"
          min="0"
          max="100"
          value={progress}
          onChange={handleProgressChange}
          className="w-full h-1.5 bg-white/30 rounded-full cursor-pointer"
          style={{
            background: `linear-gradient(to right, #E63946 ${progress}%, rgba(255,255,255,0.3) ${progress}%)`,
          }}
          aria-label="播放進度"
        />
      </div>

      {/* 控制列 */}
      <div className="flex items-center justify-between gap-2">
        {/* 左側：播放控制 */}
        <div className="flex items-center gap-1 sm:gap-3">
          {/* 上一句 */}
          <button
            onClick={prevSentence}
            className="text-white/80 hover:text-white transition-colors p-1.5 cursor-pointer"
            aria-label="上一句"
          >
            <SkipBack size={18} />
          </button>

          {/* 播放/暫停 */}
          <button
            onClick={togglePlay}
            className="bg-white/20 hover:bg-white/30 text-white rounded-full p-2.5 transition-all cursor-pointer"
            aria-label={isPlaying ? '暫停' : '播放'}
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
          </button>

          {/* 下一句 */}
          <button
            onClick={nextSentence}
            className="text-white/80 hover:text-white transition-colors p-1.5 cursor-pointer"
            aria-label="下一句"
          >
            <SkipForward size={18} />
          </button>

          {/* 音量 */}
          <button
            onClick={toggleMute}
            className="text-white/80 hover:text-white transition-colors p-1.5 cursor-pointer"
            aria-label={isMuted ? '取消靜音' : '靜音'}
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>

          {/* 時間顯示 */}
          <span className="text-white/70 text-xs sm:text-sm font-mono ml-1 hidden sm:inline">
            {formatTime(progress)}
          </span>
        </div>

        {/* 右側：設定 */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* 循環按鈕 */}
          <button
            onClick={toggleLoop}
            className={`p-1.5 rounded transition-colors cursor-pointer ${
              isLooping
                ? 'text-[#E63946] bg-white/20'
                : 'text-white/60 hover:text-white'
            }`}
            aria-label={isLooping ? '取消循環' : '開啟循環'}
          >
            {isLooping ? <Repeat1 size={18} /> : <Repeat size={18} />}
          </button>

          {/* 語速設定 */}
          <div className="relative" ref={settingsRef}>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center gap-1 text-white/70 hover:text-white transition-colors p-1.5 cursor-pointer"
              aria-label="語速設定"
            >
              <Settings size={18} />
              <span className="text-xs font-semibold">{rate}x</span>
            </button>

            {/* 語速下拉選單 */}
            {showSettings && (
              <div className="absolute bottom-full right-0 mb-2 bg-white rounded-lg shadow-xl border border-gray-200 py-1 min-w-[100px] animate-fade-in z-50">
                <div className="px-3 py-1.5 text-xs text-gray-500 font-semibold border-b border-gray-100">
                  語速
                </div>
                {rateOptions.map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      setRate(r);
                      setShowSettings(false);
                      // 如果正在播放，重新開始當前句子以應用新速率
                      if (isPlaying) {
                        speakSentence(currentSentenceIdx, false);
                      }
                    }}
                    className={`w-full text-left px-3 py-1.5 text-sm transition-colors cursor-pointer ${
                      rate === r
                        ? 'bg-[#CAE9FF] text-[#1B4965] font-semibold'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {r}x
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 提示文字 */}
      <p className="text-white/50 text-xs mt-2">
        Listen to the audio and read along.
      </p>
    </div>
  );
}
