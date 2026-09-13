'use client';

import { useState } from 'react';
import { FillInBlankExercise } from '@/lib/types';
import { CheckCircle, XCircle } from 'lucide-react';

interface FillInBlankProps {
  exercise: FillInBlankExercise;
  index: number;
  /** 答案是否已提交 */
  isSubmitted: boolean;
  /** 使用者輸入變更時回呼 */
  onChange: (answer: string) => void;
}

/**
 * 填空題元件
 * 顯示挖空的句子，讓使用者填入正確的單字
 */
export default function FillInBlank({
  exercise,
  index,
  isSubmitted,
  onChange,
}: FillInBlankProps) {
  const [value, setValue] = useState(exercise.userAnswer || '');
  const isCorrect = isSubmitted && value.trim().toLowerCase() === exercise.answer.toLowerCase();
  const isWrong = isSubmitted && value.trim().toLowerCase() !== exercise.answer.toLowerCase();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    onChange(newValue);
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-start gap-3">
        {/* 題號 */}
        <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[#1B4965] text-white text-sm font-semibold flex items-center justify-center mt-0.5">
          {index + 1}
        </span>

        <div className="flex-1">
          {/* 題目說明 */}
          <p className="text-sm text-gray-500 mb-2 font-medium">
            Fill in the blank with the correct word:
          </p>

          {/* 挖空句子 */}
          <p className="text-[#1A1A2E] text-base leading-relaxed mb-3">
            {exercise.blankedSentence.split('___').map((part, i, arr) => (
              <span key={i}>
                {part}
                {i < arr.length - 1 && (
                  <span className="inline-flex items-center mx-1">
                    <input
                      type="text"
                      value={value}
                      onChange={handleChange}
                      disabled={isSubmitted}
                      placeholder="..."
                      className={`inline-block w-32 sm:w-40 border-b-2 px-2 py-0.5 text-center font-semibold
                        outline-none transition-colors bg-transparent
                        ${isSubmitted
                          ? isCorrect
                            ? 'border-green-500 text-green-700'
                            : 'border-red-400 text-red-600'
                          : 'border-[#5FA8D3] text-[#1B4965] focus:border-[#1B4965]'
                        }
                      `}
                      aria-label={`Fill in blank ${index + 1}`}
                    />
                    {/* 結果圖示 */}
                    {isCorrect && (
                      <CheckCircle size={18} className="text-green-500 ml-1 flex-shrink-0" />
                    )}
                    {isWrong && (
                      <XCircle size={18} className="text-red-400 ml-1 flex-shrink-0" />
                    )}
                  </span>
                )}
              </span>
            ))}
          </p>

          {/* 錯誤時顯示正確答案 */}
          {isWrong && (
            <p className="text-sm text-red-500 mt-1">
              Correct answer: <span className="font-bold">{exercise.answer}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
