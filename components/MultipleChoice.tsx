'use client';

import { useState } from 'react';
import { MultipleChoiceExercise } from '@/lib/types';
import { CheckCircle, XCircle } from 'lucide-react';

interface MultipleChoiceProps {
  exercise: MultipleChoiceExercise;
  index: number;
  /** 答案是否已提交 */
  isSubmitted: boolean;
  /** 使用者選擇時回呼 */
  onChange: (selectedIndex: number) => void;
}

/**
 * 選擇題元件
 * 顯示問題與 4 個選項，使用者選擇後可驗證
 */
export default function MultipleChoice({
  exercise,
  index,
  isSubmitted,
  onChange,
}: MultipleChoiceProps) {
  const [selected, setSelected] = useState<number | undefined>(exercise.userAnswer);

  const handleSelect = (optionIndex: number) => {
    if (isSubmitted) return;
    setSelected(optionIndex);
    onChange(optionIndex);
  };

  const optionLabels = ['A', 'B', 'C', 'D'];

  return (
    <div className="animate-fade-in">
      <div className="flex items-start gap-3">
        {/* 題號 */}
        <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[#1B4965] text-white text-sm font-semibold flex items-center justify-center mt-0.5">
          {index + 1}
        </span>

        <div className="flex-1">
          {/* 問題 */}
          <p className="text-[#1A1A2E] text-base font-medium mb-3 leading-relaxed">
            {exercise.question}
          </p>

          {/* 選項 */}
          <div className="space-y-2">
            {exercise.options.map((option, i) => {
              const isSelected = selected === i;
              const isCorrectOption = i === exercise.correctIndex;
              let optionStyle = '';

              if (isSubmitted) {
                if (isCorrectOption) {
                  optionStyle =
                    'border-green-400 bg-green-50 text-green-800';
                } else if (isSelected && !isCorrectOption) {
                  optionStyle =
                    'border-red-300 bg-red-50 text-red-700';
                } else {
                  optionStyle = 'border-gray-200 bg-gray-50 text-gray-400';
                }
              } else {
                optionStyle = isSelected
                  ? 'border-[#5FA8D3] bg-[#CAE9FF]/30 text-[#1B4965]'
                  : 'border-gray-200 bg-white text-[#1A1A2E] hover:border-[#5FA8D3] hover:bg-[#CAE9FF]/10';
              }

              return (
                <button
                  key={i}
                  onClick={() => handleSelect(i)}
                  disabled={isSubmitted}
                  className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-all cursor-pointer ${optionStyle}`}
                >
                  {/* 選項標籤 */}
                  <span
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                      isSubmitted && isCorrectOption
                        ? 'bg-green-500 text-white'
                        : isSubmitted && isSelected && !isCorrectOption
                        ? 'bg-red-400 text-white'
                        : isSelected
                        ? 'bg-[#1B4965] text-white'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {optionLabels[i]}
                  </span>

                  {/* 選項文字 */}
                  <span className="flex-1 text-sm">{option}</span>

                  {/* 結果圖示 */}
                  {isSubmitted && isCorrectOption && (
                    <CheckCircle size={18} className="text-green-500 flex-shrink-0" />
                  )}
                  {isSubmitted && isSelected && !isCorrectOption && (
                    <XCircle size={18} className="text-red-400 flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
