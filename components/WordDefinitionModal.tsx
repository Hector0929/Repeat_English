'use client';

import React, { useState, useEffect } from 'react';
import { lookupWord } from '@/lib/translator';
import { speakWord } from '@/lib/speech';
import { Volume2, X, BookmarkPlus, Check, Trash2, Loader2 } from 'lucide-react';

interface WordDefinitionModalProps {
  isOpen: boolean;
  word: string;
  existingDefinition?: string;
  isAlreadyInVocabulary: boolean;
  onClose: () => void;
  onAddToVocabulary: (word: string, definition: string) => Promise<void>;
  onRemoveFromVocabulary: (word: string) => Promise<void>;
}

export default function WordDefinitionModal({
  isOpen,
  word,
  existingDefinition,
  isAlreadyInVocabulary,
  onClose,
  onAddToVocabulary,
  onRemoveFromVocabulary,
}: WordDefinitionModalProps) {
  const [fetchedDef, setFetchedDef] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // 是否已有有效定義（避免「請手動填寫」）
  const hasExistingDef = Boolean(
    existingDefinition && !existingDefinition.includes('請手動填寫')
  );

  const definition = hasExistingDef ? existingDefinition! : fetchedDef ?? '';
  const isLoading = !hasExistingDef && fetchedDef === null;

  // 當打開彈窗且無現成釋義時，在線查詢
  useEffect(() => {
    if (!isOpen || !word) return;

    // 自動發音一次
    speakWord(word);

    if (hasExistingDef) return;

    let isMounted = true;
    lookupWord(word)
      .then((def) => {
        if (isMounted) {
          setFetchedDef(def);
        }
      })
      .catch(() => {
        if (isMounted) {
          setFetchedDef('（暫無中文釋義）');
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, word, hasExistingDef]);

  // ESC 鍵關閉
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // 點擊加入單字庫
  const handleAdd = async () => {
    if (isProcessing || !definition) return;
    setIsProcessing(true);
    try {
      await onAddToVocabulary(word, definition);
    } finally {
      setIsProcessing(false);
    }
  };

  // 點擊移除單字庫
  const handleRemove = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      await onRemoveFromVocabulary(word);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen || !word) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 點擊遮罩 */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-2xs transition-opacity"
        onClick={onClose}
      />

      {/* 彈窗卡片 */}
      <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-sm w-full p-6 z-10 animate-in fade-in zoom-in-95 duration-150">
        {/* 右上角關閉按鈕 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
          aria-label="關閉"
        >
          <X size={18} />
        </button>

        {/* 單字標題與發音 */}
        <div className="flex items-center gap-3 mb-3 pr-6">
          <h3 className="text-2xl sm:text-3xl font-extrabold text-[#1A1A2E] tracking-tight font-[family-name:var(--font-heading)]">
            {word}
          </h3>
          <button
            onClick={() => speakWord(word)}
            className="w-8 h-8 rounded-full bg-[#CAE9FF]/40 hover:bg-[#CAE9FF] text-[#1B4965] flex items-center justify-center transition-colors cursor-pointer"
            title="發音"
            aria-label="發音"
          >
            <Volume2 size={16} />
          </button>
        </div>

        {/* 繁體中文解釋 */}
        <div className="min-h-16 py-3 px-3.5 bg-gray-50 rounded-xl border border-gray-100 mb-5 flex items-center">
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-gray-400 py-1">
              <Loader2 size={15} className="animate-spin text-[#5FA8D3]" />
              <span>正在查詢繁體中文釋義...</span>
            </div>
          ) : (
            <p className="text-base font-semibold text-[#1B4965] leading-relaxed">
              {definition || '（暫無定義）'}
            </p>
          )}
        </div>

        {/* 底部操作按鈕 */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100">
          {isAlreadyInVocabulary ? (
            <>
              <div className="flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200">
                <Check size={14} />
                <span>已在單字庫</span>
              </div>
              <button
                onClick={handleRemove}
                disabled={isProcessing}
                className="inline-flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                title="從本課單字庫移除"
              >
                {isProcessing ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Trash2 size={13} />
                )}
                <span>移除</span>
              </button>
            </>
          ) : (
            <button
              onClick={handleAdd}
              disabled={isProcessing || isLoading}
              className="w-full inline-flex items-center justify-center gap-2 bg-[#1B4965] hover:bg-[#1B4965]/90 disabled:bg-gray-400 text-white text-sm font-semibold py-2.5 px-4 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>正在儲存...</span>
                </>
              ) : (
                <>
                  <BookmarkPlus size={16} className="text-[#CAE9FF]" />
                  <span>+ 加入此課單字庫</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* 底部提示 */}
        <p className="text-[11px] text-gray-400 text-center mt-3">
          💡 加入後會自動同步至 Supabase 與 Practice 單字卡
        </p>
      </div>
    </div>
  );
}
