'use client';

import React, { useEffect, useCallback, useState, useRef } from 'react';
import { ResourceArticle } from '@/lib/resources-data';
import { stopSpeech, speakArticle } from '@/lib/speech';
import { X, Volume2, Square, Check, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import Link from 'next/link';

interface ResourcePreviewModalProps {
  isOpen: boolean;
  article: ResourceArticle | null;
  onClose: () => void;
  onImport: (article: ResourceArticle) => Promise<void>;
  isImported: boolean;
  importedLessonId?: string;
}

export default function ResourcePreviewModal({
  isOpen,
  article,
  onClose,
  onImport,
  isImported,
  importedLessonId,
}: ResourcePreviewModalProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const speechCtrlRef = useRef<{ stop: () => void } | null>(null);

  // 關閉時停止播放
  const handleClose = useCallback(() => {
    speechCtrlRef.current?.stop();
    stopSpeech();
    setIsPlaying(false);
    onClose();
  }, [onClose]);

  // 元件卸載時清理
  useEffect(() => {
    return () => {
      speechCtrlRef.current?.stop();
      stopSpeech();
    };
  }, []);

  // ESC 鍵關閉
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose]);

  /** 播放/停止朗讀試聽 */
  const toggleSpeech = useCallback(() => {
    if (!article) return;

    if (isPlaying) {
      speechCtrlRef.current?.stop();
      stopSpeech();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      speechCtrlRef.current = speakArticle(article.content, {
        rate: 0.95,
        onEnd: () => setIsPlaying(false),
        onError: () => setIsPlaying(false),
      });
    }
  }, [isPlaying, article]);

  /** 點擊匯入 */
  const handleImportClick = async () => {
    if (!article || isImporting || isImported) return;
    setIsImporting(true);
    try {
      await onImport(article);
    } finally {
      setIsImporting(false);
    }
  };

  if (!isOpen || !article) return null;

  const difficultyColors = {
    easy: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    medium: 'bg-amber-50 text-amber-700 border-amber-200',
    hard: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  };

  const difficultyLabels = {
    easy: '初級 (Easy)',
    medium: '中級 (Medium)',
    hard: '高級 (Hard)',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* 背景遮罩 */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={handleClose}
      />

      {/* 彈窗內容 */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden z-10 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200 border border-gray-100">
        {/* 頂部標頭 */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-[#F8F9FA]">
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                difficultyColors[article.difficulty]
              }`}
            >
              {difficultyLabels[article.difficulty]}
            </span>
            <span className="text-xs text-gray-400 font-medium">
              {article.category} · {article.readTime}
            </span>
          </div>

          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            aria-label="關閉"
          >
            <X size={20} />
          </button>
        </div>

        {/* 文章內容滾動區 */}
        <div className="p-6 overflow-y-auto space-y-5">
          <div>
            <h2 className="text-2xl font-extrabold text-[#1A1A2E] font-[family-name:var(--font-heading)] mb-2">
              {article.title}
            </h2>
            <p className="text-sm text-gray-500 leading-relaxed bg-gray-50 p-3 rounded-xl border border-gray-100">
              💡 <strong className="text-gray-700">摘要：</strong>
              {article.summary}
            </p>
          </div>

          {/* 朗讀試聽按鈕 */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSpeech}
              className={`inline-flex items-center gap-2 text-xs font-semibold px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                isPlaying
                  ? 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                  : 'bg-[#CAE9FF] text-[#1B4965] hover:bg-[#CAE9FF]/80'
              }`}
            >
              {isPlaying ? (
                <>
                  <Square size={13} className="fill-current" />
                  <span>停止朗讀試聽</span>
                </>
              ) : (
                <>
                  <Volume2 size={15} />
                  <span>語音試聽整篇</span>
                </>
              )}
            </button>

            {isPlaying && (
              <span className="text-xs text-[#5FA8D3] flex items-center gap-1 animate-pulse">
                <Sparkles size={13} /> 正在朗讀中...
              </span>
            )}
          </div>

          {/* 英文全文 */}
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-xs">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
              Full English Article
            </h4>
            <p className="text-base text-[#1A1A2E] leading-relaxed whitespace-pre-line font-[family-name:var(--font-body)]">
              {article.content}
            </p>
          </div>

          {/* 關鍵詞預覽 */}
          <div>
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              Key Vocabulary
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {article.keyWords.map((kw) => (
                <span
                  key={kw}
                  className="bg-gray-100 text-gray-700 text-xs px-2.5 py-1 rounded-md font-mono"
                >
                  {kw}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* 底部按鈕操作列 */}
        <div className="p-4 border-t border-gray-100 bg-[#F8F9FA] flex items-center justify-between gap-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
          >
            關閉預覽
          </button>

          {isImported ? (
            <Link
              href={`/lesson/${importedLessonId}`}
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors shadow-xs"
              onClick={handleClose}
            >
              <Check size={16} />
              <span>已在學習庫，前往課程</span>
              <ArrowRight size={16} />
            </Link>
          ) : (
            <button
              onClick={handleImportClick}
              disabled={isImporting}
              className="inline-flex items-center gap-2 bg-[#1B4965] hover:bg-[#1B4965]/90 disabled:bg-gray-400 text-white font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors shadow-xs cursor-pointer"
            >
              {isImporting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>正在自動翻譯單字並存入...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} className="text-[#CAE9FF]" />
                  <span>+ 匯入此篇至我的課程庫</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
