'use client';

import { useState, useCallback } from 'react';
import { SentenceOrderExercise } from '@/lib/types';
import { CheckCircle, XCircle, RotateCcw } from 'lucide-react';

interface SentenceOrderProps {
  exercise: SentenceOrderExercise;
  index: number;
  /** 答案是否已提交 */
  isSubmitted: boolean;
  /** 使用者排列變更時回呼 */
  onChange: (order: string[]) => void;
}

/**
 * 排列句子元件
 * 將打散的單字拖拉排列成正確的句子
 */
export default function SentenceOrder({
  exercise,
  index,
  isSubmitted,
  onChange,
}: SentenceOrderProps) {
  // 可用的單字（尚未選擇的）
  const [available, setAvailable] = useState<string[]>(
    exercise.userOrder ? [] : [...exercise.shuffledWords]
  );
  // 已排列的單字
  const [ordered, setOrdered] = useState<string[]>(exercise.userOrder || []);

  const isCorrect =
    isSubmitted &&
    ordered.join(' ') === exercise.originalSentence;
  const isWrong =
    isSubmitted &&
    ordered.join(' ') !== exercise.originalSentence;

  /** 選擇一個單字加入排列 */
  const selectWord = useCallback(
    (word: string, wordIndex: number) => {
      if (isSubmitted) return;
      const newAvailable = [...available];
      newAvailable.splice(wordIndex, 1);
      const newOrdered = [...ordered, word];
      setAvailable(newAvailable);
      setOrdered(newOrdered);
      onChange(newOrdered);
    },
    [available, ordered, isSubmitted, onChange]
  );

  /** 從排列中移除一個單字 */
  const removeWord = useCallback(
    (word: string, wordIndex: number) => {
      if (isSubmitted) return;
      const newOrdered = [...ordered];
      newOrdered.splice(wordIndex, 1);
      const newAvailable = [...available, word];
      setOrdered(newOrdered);
      setAvailable(newAvailable);
      onChange(newOrdered);
    },
    [available, ordered, isSubmitted, onChange]
  );

  /** 重設 */
  const reset = useCallback(() => {
    if (isSubmitted) return;
    setAvailable([...exercise.shuffledWords]);
    setOrdered([]);
    onChange([]);
  }, [exercise.shuffledWords, isSubmitted, onChange]);

  return (
    <div className="animate-fade-in">
      <div className="flex items-start gap-3">
        {/* 題號 */}
        <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[#1B4965] text-white text-sm font-semibold flex items-center justify-center mt-0.5">
          {index + 1}
        </span>

        <div className="flex-1">
          {/* 題目說明 */}
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-500 font-medium">
              Arrange the words to form a correct sentence:
            </p>
            {!isSubmitted && ordered.length > 0 && (
              <button
                onClick={reset}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 cursor-pointer"
                aria-label="重設"
              >
                <RotateCcw size={16} />
              </button>
            )}
          </div>

          {/* 已排列的單字區域 */}
          <div
            className={`min-h-[48px] p-3 rounded-lg border-2 border-dashed mb-3 flex flex-wrap gap-2 transition-colors ${
              isSubmitted
                ? isCorrect
                  ? 'border-green-400 bg-green-50'
                  : 'border-red-300 bg-red-50'
                : ordered.length > 0
                ? 'border-[#5FA8D3] bg-[#CAE9FF]/10'
                : 'border-gray-300 bg-gray-50'
            }`}
          >
            {ordered.length === 0 ? (
              <span className="text-gray-400 text-sm italic">
                Click words below to arrange them here...
              </span>
            ) : (
              ordered.map((word, i) => (
                <button
                  key={`ordered-${i}`}
                  onClick={() => removeWord(word, i)}
                  disabled={isSubmitted}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all cursor-pointer ${
                    isSubmitted
                      ? isCorrect
                        ? 'bg-green-200 text-green-800'
                        : 'bg-red-200 text-red-700'
                      : 'bg-[#1B4965] text-white hover:bg-[#1B4965]/80'
                  }`}
                >
                  {word}
                </button>
              ))
            )}

            {/* 結果圖示 */}
            {isCorrect && (
              <CheckCircle size={20} className="text-green-500 ml-auto self-center" />
            )}
            {isWrong && (
              <XCircle size={20} className="text-red-400 ml-auto self-center" />
            )}
          </div>

          {/* 可選單字區域 */}
          {!isSubmitted && available.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {available.map((word, i) => (
                <button
                  key={`available-${i}`}
                  onClick={() => selectWord(word, i)}
                  className="px-3 py-1.5 rounded-md text-sm font-medium bg-white border border-gray-300 text-[#1A1A2E] hover:border-[#5FA8D3] hover:bg-[#CAE9FF]/20 transition-all cursor-pointer"
                >
                  {word}
                </button>
              ))}
            </div>
          )}

          {/* 錯誤時顯示正確答案 */}
          {isWrong && (
            <p className="text-sm text-red-500 mt-2">
              Correct answer:{' '}
              <span className="font-bold">{exercise.originalSentence}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
