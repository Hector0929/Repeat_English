'use client';

import { useState, useMemo, useCallback } from 'react';
import { ExerciseItem, FillInBlankExercise, MultipleChoiceExercise, SentenceOrderExercise, VocabularyItem } from '@/lib/types';
import { generateExercises } from '@/lib/exercises';
import FillInBlank from './FillInBlank';
import MultipleChoice from './MultipleChoice';
import SentenceOrder from './SentenceOrder';
import { ClipboardCheck, RotateCcw, Trophy } from 'lucide-react';

interface PracticeSectionProps {
  /** 文章內容 */
  content: string;
  /** 詞彙列表 */
  vocabulary: VocabularyItem[];
}

/**
 * 練習區域元件
 * 根據文章內容自動生成填空題、選擇題、排列句子題
 */
export default function PracticeSection({ content, vocabulary }: PracticeSectionProps) {
  // 產生練習題
  const exercises = useMemo(
    () => generateExercises(content, vocabulary),
    [content, vocabulary]
  );

  // 使用者答案狀態
  const [answers, setAnswers] = useState<Map<string, unknown>>(new Map());
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState<{ correct: number; total: number } | null>(null);

  /** 更新答案 */
  const updateAnswer = useCallback((exerciseId: string, answer: unknown) => {
    setAnswers((prev) => {
      const next = new Map(prev);
      next.set(exerciseId, answer);
      return next;
    });
  }, []);

  /** 驗證答案 */
  const checkAnswers = useCallback(() => {
    let correct = 0;
    const total = exercises.length;

    exercises.forEach((ex) => {
      const userAnswer = answers.get(ex.id);

      switch (ex.type) {
        case 'fill-in-blank': {
          const fib = ex as FillInBlankExercise;
          if (
            typeof userAnswer === 'string' &&
            userAnswer.trim().toLowerCase() === fib.answer.toLowerCase()
          ) {
            correct++;
          }
          break;
        }
        case 'multiple-choice': {
          const mc = ex as MultipleChoiceExercise;
          if (userAnswer === mc.correctIndex) {
            correct++;
          }
          break;
        }
        case 'sentence-order': {
          const so = ex as SentenceOrderExercise;
          if (
            Array.isArray(userAnswer) &&
            (userAnswer as string[]).join(' ') === so.originalSentence
          ) {
            correct++;
          }
          break;
        }
      }
    });

    setScore({ correct, total });
    setIsSubmitted(true);
  }, [exercises, answers]);

  /** 重新練習 */
  const resetPractice = useCallback(() => {
    setAnswers(new Map());
    setIsSubmitted(false);
    setScore(null);
  }, []);

  // 分類練習題
  const fillInBlanks = exercises.filter((e) => e.type === 'fill-in-blank') as FillInBlankExercise[];
  const multipleChoices = exercises.filter((e) => e.type === 'multiple-choice') as MultipleChoiceExercise[];
  const sentenceOrders = exercises.filter((e) => e.type === 'sentence-order') as SentenceOrderExercise[];

  return (
    <div className="mt-8 animate-slide-up">
      {/* 標題 */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-[#1B4965] flex items-center justify-center">
          <ClipboardCheck size={22} className="text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-[#1A1A2E] font-[family-name:var(--font-heading)]">
            Practice Exercises
          </h2>
          <p className="text-sm text-gray-500">
            Complete the exercises below to test your understanding
          </p>
        </div>
      </div>

      {/* 分數展示 */}
      {score && (
        <div
          className={`mb-6 p-4 rounded-xl flex items-center gap-4 ${
            score.correct === score.total
              ? 'bg-green-50 border-2 border-green-200'
              : score.correct >= score.total * 0.7
              ? 'bg-yellow-50 border-2 border-yellow-200'
              : 'bg-red-50 border-2 border-red-200'
          }`}
        >
          <Trophy
            size={32}
            className={
              score.correct === score.total
                ? 'text-green-500'
                : score.correct >= score.total * 0.7
                ? 'text-yellow-500'
                : 'text-red-400'
            }
          />
          <div>
            <p className="font-bold text-lg">
              {score.correct} / {score.total} correct
            </p>
            <p className="text-sm text-gray-600">
              {score.correct === score.total
                ? 'Perfect! Great job! 🎉'
                : score.correct >= score.total * 0.7
                ? 'Good work! Keep practicing!'
                : 'Keep going! Practice makes perfect!'}
            </p>
          </div>
        </div>
      )}

      {/* 練習題區域 */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* 填空題 */}
        {fillInBlanks.length > 0 && (
          <div className="p-5 sm:p-6">
            <h3 className="text-sm font-bold text-[#1B4965] uppercase tracking-wide mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#5FA8D3]"></span>
              Fill in the Blanks
            </h3>
            <div className="space-y-5">
              {fillInBlanks.map((ex, i) => (
                <FillInBlank
                  key={ex.id}
                  exercise={ex}
                  index={i}
                  isSubmitted={isSubmitted}
                  onChange={(answer) => updateAnswer(ex.id, answer)}
                />
              ))}
            </div>
          </div>
        )}

        {/* 分隔線 */}
        {fillInBlanks.length > 0 && multipleChoices.length > 0 && (
          <hr className="border-gray-100" />
        )}

        {/* 選擇題 */}
        {multipleChoices.length > 0 && (
          <div className="p-5 sm:p-6">
            <h3 className="text-sm font-bold text-[#1B4965] uppercase tracking-wide mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#5FA8D3]"></span>
              Multiple Choice
            </h3>
            <div className="space-y-6">
              {multipleChoices.map((ex, i) => (
                <MultipleChoice
                  key={ex.id}
                  exercise={ex}
                  index={i}
                  isSubmitted={isSubmitted}
                  onChange={(selectedIndex) => updateAnswer(ex.id, selectedIndex)}
                />
              ))}
            </div>
          </div>
        )}

        {/* 分隔線 */}
        {(fillInBlanks.length > 0 || multipleChoices.length > 0) &&
          sentenceOrders.length > 0 && <hr className="border-gray-100" />}

        {/* 排列句子題 */}
        {sentenceOrders.length > 0 && (
          <div className="p-5 sm:p-6">
            <h3 className="text-sm font-bold text-[#1B4965] uppercase tracking-wide mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#5FA8D3]"></span>
              Sentence Arrangement
            </h3>
            <div className="space-y-6">
              {sentenceOrders.map((ex, i) => (
                <SentenceOrder
                  key={ex.id}
                  exercise={ex}
                  index={i}
                  isSubmitted={isSubmitted}
                  onChange={(order) => updateAnswer(ex.id, order)}
                />
              ))}
            </div>
          </div>
        )}

        {/* 操作按鈕 */}
        <div className="px-5 sm:px-6 py-4 bg-gray-50 border-t border-gray-100 flex flex-wrap gap-3 justify-end">
          {isSubmitted ? (
            <button
              onClick={resetPractice}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#1B4965] text-white font-semibold hover:bg-[#1B4965]/90 transition-colors cursor-pointer"
            >
              <RotateCcw size={16} />
              Try Again
            </button>
          ) : (
            <>
              <button
                onClick={checkAnswers}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white border-2 border-gray-300 text-[#1A1A2E] font-semibold hover:border-[#5FA8D3] transition-colors cursor-pointer"
              >
                <ClipboardCheck size={16} />
                Check My Work
              </button>
              <button
                onClick={checkAnswers}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#E63946] text-white font-semibold hover:bg-[#C62828] transition-colors cursor-pointer"
              >
                Submit Practice
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
