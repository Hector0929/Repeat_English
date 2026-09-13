"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Lesson, VocabularyItem } from '@/lib/types';
import { BookOpen, List, ChevronRight, ChevronDown } from 'lucide-react';

interface SidebarProps {
  lessons: Lesson[];
  currentLessonId?: string;
  vocabulary: VocabularyItem[];
}

/**
 * 側邊欄元件
 * 顯示課程列表與詞彙列表
 * 手機版的展開/收合邏輯由父元件（LessonPage）控制
 */
export default function Sidebar({ lessons, currentLessonId, vocabulary }: SidebarProps) {
  const [isLessonsOpen, setIsLessonsOpen] = useState(true);
  const [isVocabOpen, setIsVocabOpen] = useState(true);

  return (
    <div className="flex flex-col bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      {/* 課程列表 */}
      <div className="border-b border-gray-100">
        <button 
          onClick={() => setIsLessonsOpen(!isLessonsOpen)}
          className="w-full flex items-center justify-between p-4 bg-[#F8F9FA] hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <div className="flex items-center text-[#1A1A2E] font-bold text-sm">
            <List size={16} className="mr-2 text-[#5FA8D3]" />
            Lessons
          </div>
          {isLessonsOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
        
        {isLessonsOpen && (
          <div className="p-2 max-h-[200px] overflow-y-auto">
            {lessons.length === 0 ? (
              <p className="text-xs text-gray-400 p-2 text-center">No lessons yet</p>
            ) : (
              <ul className="space-y-0.5">
                {lessons.map(lesson => (
                  <li key={lesson.id}>
                    <Link 
                      href={`/lesson/${lesson.id}`}
                      className={`block px-3 py-2 text-sm rounded-md transition-colors truncate cursor-pointer ${
                        currentLessonId === lesson.id 
                          ? 'bg-[#1B4965] text-white font-medium' 
                          : 'text-gray-600 hover:bg-[#F8F9FA] hover:text-[#1B4965]'
                      }`}
                    >
                      {lesson.title}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* 詞彙列表 */}
      <div>
        <button 
          onClick={() => setIsVocabOpen(!isVocabOpen)}
          className="w-full flex items-center justify-between p-4 bg-[#F8F9FA] hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <div className="flex items-center text-[#1A1A2E] font-bold text-sm">
            <BookOpen size={16} className="mr-2 text-[#5FA8D3]" />
            Vocabulary
          </div>
          {isVocabOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
        
        {isVocabOpen && (
          <div className="p-3 max-h-[300px] overflow-y-auto">
            {vocabulary.length === 0 ? (
              <p className="text-xs text-gray-400 text-center">No vocabulary</p>
            ) : (
              <ul className="space-y-2">
                {vocabulary.map((item, index) => (
                  <li key={index} className="group relative">
                    <div className="text-sm font-semibold text-[#1B4965] border-b border-dashed border-[#5FA8D3]/40 inline-block cursor-help pb-0.5">
                      {item.word}
                    </div>
                    {/* Tooltip */}
                    <div className="invisible group-hover:visible opacity-0 group-hover:opacity-100 absolute z-10 left-0 top-full mt-1 p-2 bg-[#1A1A2E] text-white text-xs rounded-lg shadow-lg max-w-[200px] transition-all duration-200">
                      {item.definition}
                      <div className="absolute -top-1 left-4 w-2 h-2 bg-[#1A1A2E] transform rotate-45"></div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
