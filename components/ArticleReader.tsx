"use client";

import React, { useMemo } from 'react';
import { Lesson } from '@/lib/types';

interface ArticleReaderProps {
  lesson: Lesson;
  currentCharIndex?: number;
}

export default function ArticleReader({ lesson, currentCharIndex = -1 }: ArticleReaderProps) {
  // 將文章內容進行處理，高亮詞彙並支援目前朗讀位置
  const renderContent = useMemo(() => {
    if (!lesson.content) return null;

    // 如果沒有詞彙，直接返回文字（處理可能的朗讀高亮）
    if (!lesson.vocabulary || lesson.vocabulary.length === 0) {
      if (currentCharIndex >= 0 && currentCharIndex < lesson.content.length) {
        return (
          <>
            {lesson.content.substring(0, currentCharIndex)}
            <span className="bg-[#CAE9FF]">{lesson.content[currentCharIndex]}</span>
            {lesson.content.substring(currentCharIndex + 1)}
          </>
        );
      }
      return <>{lesson.content}</>;
    }

    // 建立一個對應的詞彙清單，依長度排序以避免部分比對問題
    const sortedVocab = [...lesson.vocabulary].sort((a, b) => b.word.length - a.word.length);
    
    // 使用正則表達式尋找所有單字
    // 這裡實作一個簡單的方法：用括號+底線+斜體強調色標示單字
    // 在實際應用中可能需要更複雜的分詞或正規表達式來精確匹配
    
    // 為了簡單起見，我們將內文按單字分割並渲染
    // 將文章依空白與標點符號分割，但保留它們
    const parts = lesson.content.split(/(\b|\s+|[.,;!?]+)/);
    
    return parts.map((part, index) => {
      if (!part) return null;
      
      const vocabMatch = sortedVocab.find(v => v.word.toLowerCase() === part.toLowerCase());
      
      if (vocabMatch) {
        return (
          <span 
            key={index} 
            className="italic underline text-[#1B4965] bg-[#CAE9FF] bg-opacity-30 px-1 mx-0.5 rounded"
            title={vocabMatch.definition}
          >
            ({part})
          </span>
        );
      }
      
      return <React.Fragment key={index}>{part}</React.Fragment>;
    });

  }, [lesson.content, lesson.vocabulary, currentCharIndex]);

  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 flex flex-col h-full">
      {/* 頂部標題區域 */}
      <div className="bg-[#1B4965] px-6 py-5">
        <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
          {lesson.title}
        </h1>
        {lesson.vocabulary && lesson.vocabulary.length > 0 && (
          <div className="mt-2 text-[#CAE9FF] text-sm flex items-center">
            <span className="bg-white/10 px-2 py-1 rounded">
              包含 {lesson.vocabulary.length} 個重點詞彙
            </span>
          </div>
        )}
      </div>

      {/* 內容區域 */}
      <div className="p-6 sm:p-8 flex-1 overflow-y-auto">
        <div className="prose max-w-none">
          <p className="text-lg sm:text-xl text-[#1A1A2E] leading-relaxed whitespace-pre-wrap font-medium">
            {renderContent}
          </p>
        </div>
      </div>
    </div>
  );
}
