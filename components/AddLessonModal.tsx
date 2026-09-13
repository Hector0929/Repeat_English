"use client";

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface AddLessonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (title: string, content: string) => void;
}

export default function AddLessonModal({ isOpen, onClose, onSave }: AddLessonModalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');

  // 處理 ESC 鍵關閉
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // 重置表單狀態
  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setContent('');
      setError('');
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 驗證
    if (!title.trim()) {
      setError('請輸入課程標題');
      return;
    }
    if (!content.trim()) {
      setError('請輸入文章內容');
      return;
    }

    // 儲存並關閉
    onSave(title.trim(), content.trim());
    setTitle('');
    setContent('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
      {/* 背景遮罩 */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      {/* 對話框內容 */}
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-[#F8F9FA]">
          <h2 className="text-xl font-bold text-[#1A1A2E]">新增課程</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-[#E63946] text-sm rounded-md border border-red-100">
              {error}
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-[#1A1A2E] mb-1">
                課程標題
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (error) setError('');
                }}
                className="w-full px-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#5FA8D3] focus:border-transparent transition-all"
                placeholder="e.g., Lesson 1: Career and Passion"
              />
            </div>

            <div>
              <label htmlFor="content" className="block text-sm font-medium text-[#1A1A2E] mb-1">
                文章內容
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => {
                  setContent(e.target.value);
                  if (error) setError('');
                }}
                rows={8}
                className="w-full px-4 py-3 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#5FA8D3] focus:border-transparent transition-all resize-y min-h-[150px]"
                placeholder="貼上英文文章內容..."
              ></textarea>
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-[#1B4965] rounded-md hover:bg-opacity-90 transition-colors"
            >
              儲存課程
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
