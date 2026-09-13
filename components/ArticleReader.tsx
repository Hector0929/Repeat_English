'use client';

import React, { useMemo, useState } from 'react';
import { Lesson } from '@/lib/types';
import WordDefinitionModal from './WordDefinitionModal';
import { HelpCircle } from 'lucide-react';

interface ArticleReaderProps {
  lesson: Lesson;
  currentCharIndex?: number;
  onAddWord?: (word: string, definition: string) => Promise<void>;
  onRemoveWord?: (word: string) => Promise<void>;
}

export default function ArticleReader({
  lesson,
  onAddWord,
  onRemoveWord,
}: ArticleReaderProps) {
  const [selectedWord, setSelectedWord] = useState<{
    word: string;
    existingDefinition?: string;
    isAlreadyInVocabulary: boolean;
  } | null>(null);

  // 建立快速比對的詞彙字典
  const vocabMap = useMemo(() => {
    const map = new Map<string, string>();
    (lesson.vocabulary || []).forEach((v) => {
      map.set(v.word.toLowerCase().trim(), v.definition);
    });
    return map;
  }, [lesson.vocabulary]);

  // 將文章依英文單字與標點符號/空白分詞渲染
  const renderContent = useMemo(() => {
    if (!lesson.content) return null;

    // 比對英文單字（包含縮寫如 don't, it's）
    const tokens = lesson.content.split(/(\b[a-zA-Z]+(?:'[a-zA-Z]+)?\b)/);
    const wordRegex = /^[a-zA-Z]+(?:'[a-zA-Z]+)?$/;

    return tokens.map((token, index) => {
      if (!token) return null;

      // 如果是英文單字
      if (wordRegex.test(token)) {
        const lower = token.toLowerCase();
        const existingDef = vocabMap.get(lower);
        const isInVocab = existingDef !== undefined;

        if (isInVocab) {
          return (
            <span
              key={index}
              onClick={() =>
                setSelectedWord({
                  word: token,
                  existingDefinition: existingDef,
                  isAlreadyInVocabulary: true,
                })
              }
              className="italic underline text-[#1B4965] bg-[#CAE9FF]/70 hover:bg-[#CAE9FF] px-1 py-0.5 mx-0.5 rounded font-semibold cursor-pointer transition-colors shadow-2xs"
              title={`點擊查看釋義：${existingDef}`}
            >
              {token}
            </span>
          );
        }

        // 普通未加入單字庫的單字（滑鼠 hover 提示可點選查詞）
        return (
          <span
            key={index}
            onClick={() =>
              setSelectedWord({
                word: token,
                existingDefinition: undefined,
                isAlreadyInVocabulary: false,
              })
            }
            className="hover:bg-amber-100 hover:text-[#1B4965] hover:underline px-0.5 rounded cursor-pointer transition-colors duration-150"
            title="點擊查詞並加入單字庫"
          >
            {token}
          </span>
        );
      }

      // 空白與標點符號原樣輸出
      return <React.Fragment key={index}>{token}</React.Fragment>;
    });
  }, [lesson.content, vocabMap]);

  return (
    <>
      <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 flex flex-col h-full">
        {/* 頂部標題區域 */}
        <div className="bg-[#1B4965] px-6 py-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight font-[family-name:var(--font-heading)]">
              {lesson.title}
            </h1>
            <div className="flex items-center gap-2 text-xs text-[#CAE9FF]">
              <HelpCircle size={14} />
              <span>點擊文章任一單字即可查詞並加入單字庫</span>
            </div>
          </div>

          {lesson.vocabulary && lesson.vocabulary.length > 0 && (
            <div className="mt-3 text-[#CAE9FF] text-sm flex items-center gap-2">
              <span className="bg-white/10 px-2.5 py-1 rounded-md text-xs font-semibold">
                包含 {lesson.vocabulary.length} 個本課重點詞彙
              </span>
            </div>
          )}
        </div>

        {/* 內容區域 */}
        <div className="p-6 sm:p-8 flex-1 overflow-y-auto">
          <div className="prose max-w-none">
            <p className="text-lg sm:text-xl text-[#1A1A2E] leading-loose whitespace-pre-wrap font-medium">
              {renderContent}
            </p>
          </div>
        </div>
      </div>

      {/* 點擊查詞與加入單字庫彈窗 */}
      {selectedWord && (
        <WordDefinitionModal
          isOpen={Boolean(selectedWord)}
          word={selectedWord.word}
          existingDefinition={selectedWord.existingDefinition}
          isAlreadyInVocabulary={selectedWord.isAlreadyInVocabulary}
          onClose={() => setSelectedWord(null)}
          onAddToVocabulary={async (word, def) => {
            if (onAddWord) {
              await onAddWord(word, def);
            }
            setSelectedWord(null);
          }}
          onRemoveFromVocabulary={async (word) => {
            if (onRemoveWord) {
              await onRemoveWord(word);
            }
            setSelectedWord(null);
          }}
        />
      )}
    </>
  );
}
