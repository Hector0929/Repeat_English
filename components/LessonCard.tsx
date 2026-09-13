"use client";

import React from 'react';
import Link from 'next/link';
import { Trash2 } from 'lucide-react';
import { Lesson } from '@/lib/types';

interface LessonCardProps {
  lesson: Lesson;
  onDelete: (id: string) => void;
}

export default function LessonCard({ lesson, onDelete }: LessonCardProps) {
  // 格式化日期
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // 截斷內容摘要
  const truncateContent = (content: string, maxLength: number = 100) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  // 處理刪除點擊，避免觸發連結
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete(lesson.id);
  };

  return (
    <Link href={`/lesson/${lesson.id}`} className="block h-full">
      <div className="relative h-full flex flex-col bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:-translate-y-1 hover:shadow-md transition-all duration-300 group">
        {/* 左側主色邊框條 */}
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#1B4965]"></div>
        
        <div className="p-5 pl-6 flex-1 flex flex-col">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-bold text-[#1A1A2E] line-clamp-1 group-hover:text-[#5FA8D3] transition-colors">
              {lesson.title}
            </h3>
            
            <button 
              onClick={handleDeleteClick}
              className="p-1.5 text-gray-400 hover:text-[#E63946] hover:bg-red-50 rounded-md transition-colors"
              aria-label="刪除課程"
            >
              <Trash2 size={18} />
            </button>
          </div>
          
          <p className="text-sm text-gray-500 mb-4 flex-1 line-clamp-3">
            {truncateContent(lesson.content)}
          </p>
          
          <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50">
            <span className="text-xs text-gray-400">
              {formatDate(lesson.createdAt)}
            </span>
            <span className="text-xs font-medium text-[#5FA8D3] bg-[#CAE9FF] bg-opacity-30 px-2 py-1 rounded">
              {lesson.vocabulary?.length || 0} 個單字
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
