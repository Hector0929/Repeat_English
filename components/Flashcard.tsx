'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Volume2, RotateCw, CheckCircle, XCircle, ArrowLeft, ArrowRight, Bookmark } from 'lucide-react';
import { speakWord } from '@/lib/speech';

export interface FlashcardItem {
  word: string;
  definition: string;
  lessonTitle: string;
  exampleSentence?: string;
}

interface FlashcardProps {
  card: FlashcardItem;
  currentIndex: number;
  totalCards: number;
  isMastered: boolean;
  onNext: () => void;
  onPrev: () => void;
  onMarkMastered: () => void;
  onMarkNeedReview: () => void;
}

export default function Flashcard({
  card,
  currentIndex,
  totalCards,
  isMastered,
  onNext,
  onPrev,
  onMarkMastered,
  onMarkNeedReview,
}: FlashcardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  /** 朗讀單字 */
  const handlePlayAudio = useCallback((text: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    speakWord(text, { rate: 0.9 });
  }, []);

  /** 鍵盤快捷鍵支援 */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 避免在輸入框時觸發快捷鍵
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        onNext();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        onPrev();
      } else if (e.key === '1') {
        e.preventDefault();
        onMarkNeedReview();
      } else if (e.key === '2') {
        e.preventDefault();
        onMarkMastered();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNext, onPrev, onMarkMastered, onMarkNeedReview]);

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center">
      {/* 頂部卡片序號與狀態提示 */}
      <div className="w-full flex justify-between items-center px-2 mb-3 text-sm text-gray-500 font-medium">
        <span className="flex items-center gap-1.5 bg-white px-3 py-1 rounded-full shadow-xs border border-gray-200">
          <Bookmark size={14} className="text-[#5FA8D3]" />
          第 {currentIndex + 1} / {totalCards} 張
        </span>
        {isMastered && (
          <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 font-semibold text-xs">
            <CheckCircle size={14} /> 已掌握
          </span>
        )}
      </div>

      {/* 3D 抽認卡本體 */}
      <div
        className="w-full h-84 sm:h-96 cursor-pointer select-none [perspective:1000px] group"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div
          className={`relative w-full h-full duration-500 [transform-style:preserve-3d] transition-transform rounded-2xl shadow-md hover:shadow-xl border border-gray-100 ${
            isFlipped ? '[transform:rotateY(180deg)]' : ''
          }`}
        >
          {/* ====== 正面 (Front) ====== */}
          <div className="absolute inset-0 w-full h-full bg-white rounded-2xl p-8 flex flex-col justify-between [backface-visibility:hidden]">
            {/* 卡片標頭 */}
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-[#CAE9FF]/40 text-[#1B4965]">
                {card.lessonTitle}
              </span>
              <button
                type="button"
                onClick={(e) => handlePlayAudio(card.word, e)}
                className="w-10 h-10 rounded-full bg-[#CAE9FF]/30 hover:bg-[#CAE9FF] text-[#1B4965] flex items-center justify-center transition-colors shadow-xs"
                title="朗讀發音"
                aria-label="朗讀發音"
              >
                <Volume2 size={20} />
              </button>
            </div>

            {/* 卡片核心單字 */}
            <div className="text-center my-auto">
              <h2 className="text-4xl sm:text-5xl font-extrabold text-[#1A1A2E] tracking-wide mb-3 font-[family-name:var(--font-heading)]">
                {card.word}
              </h2>
              <p className="text-sm text-gray-400">點擊卡片翻面看中文釋義</p>
            </div>

            {/* 卡片底部提示 */}
            <div className="flex justify-between items-center text-xs text-gray-400 border-t border-gray-100 pt-3">
              <span>快捷鍵：Space 翻面</span>
              <span className="flex items-center gap-1 text-[#5FA8D3]">
                <RotateCw size={13} /> 翻轉卡片
              </span>
            </div>
          </div>

          {/* ====== 背面 (Back) ====== */}
          <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-[#1B4965] to-[#2D6A8F] text-white rounded-2xl p-8 flex flex-col justify-between [transform:rotateY(180deg)] [backface-visibility:hidden]">
            {/* 卡片標頭 */}
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-white/70">
                出處：{card.lessonTitle}
              </span>
              <button
                type="button"
                onClick={(e) => handlePlayAudio(card.word, e)}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                title="再次朗讀"
                aria-label="再次朗讀"
              >
                <Volume2 size={20} />
              </button>
            </div>

            {/* 中文釋義 */}
            <div className="my-auto text-center px-4">
              <div className="text-2xl sm:text-3xl font-bold text-white mb-4 leading-relaxed font-[family-name:var(--font-heading)]">
                {card.definition || '暫無釋義'}
              </div>

              {card.exampleSentence && (
                <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3.5 text-left border border-white/10 max-h-32 overflow-y-auto">
                  <p className="text-xs text-white/60 mb-1 font-semibold">文章例句：</p>
                  <p className="text-sm text-white/90 italic leading-relaxed">
                    &ldquo;{card.exampleSentence}&rdquo;
                  </p>
                </div>
              )}
            </div>

            {/* 卡片底部提示 */}
            <div className="flex justify-between items-center text-xs text-white/60 border-t border-white/10 pt-3">
              <span>快捷鍵：Space 翻回正面</span>
              <span className="flex items-center gap-1 text-[#CAE9FF]">
                <RotateCw size={13} /> 點擊翻回正面
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 記憶標記按鈕列 */}
      <div className="w-full flex items-center justify-center gap-4 mt-6">
        <button
          onClick={onMarkNeedReview}
          className="flex-1 max-w-[180px] flex items-center justify-center gap-2 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 font-semibold py-3 px-4 rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer"
        >
          <XCircle size={20} />
          <span>還不熟 (1)</span>
        </button>

        <button
          onClick={onMarkMastered}
          className="flex-1 max-w-[180px] flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-4 rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer"
        >
          <CheckCircle size={20} />
          <span>記住了 (2)</span>
        </button>
      </div>

      {/* 前一張 / 後一張導航按鈕 */}
      <div className="flex items-center justify-center gap-8 mt-6 text-gray-500">
        <button
          onClick={onPrev}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium hover:text-[#1B4965] hover:bg-white rounded-lg transition-colors cursor-pointer border border-transparent hover:border-gray-200"
          title="前一張 (←)"
        >
          <ArrowLeft size={16} />
          <span>上一張</span>
        </button>

        <button
          onClick={onNext}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium hover:text-[#1B4965] hover:bg-white rounded-lg transition-colors cursor-pointer border border-transparent hover:border-gray-200"
          title="下一張 (→)"
        >
          <span>下一張</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
