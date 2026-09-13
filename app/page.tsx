'use client';

import { useState, useEffect, useCallback } from 'react';
import { Lesson } from '@/lib/types';
import { getLessons, saveLesson, deleteLesson, generateId } from '@/lib/store';
import { extractVocabularyWithTranslation } from '@/lib/exercises';
import Navbar from '@/components/Navbar';
import LessonCard from '@/components/LessonCard';
import AddLessonModal from '@/components/AddLessonModal';
import { Plus, BookOpen, GraduationCap } from 'lucide-react';

/**
 * 首頁
 * 顯示所有課程列表，並提供新增課程功能
 */
export default function HomePage() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // 載入課程
  useEffect(() => {
    let isMounted = true;
    getLessons()
      .then((data) => {
        if (isMounted) {
          setLessons(data);
          setIsLoaded(true);
        }
      })
      .catch((error) => {
        console.error('讀取課程列表失敗:', error);
        if (isMounted) {
          setIsLoaded(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  /** 新增課程 */
  const handleAddLesson = useCallback(async (title: string, content: string) => {
    // 自動提取單字並查詢繁體中文釋義
    const vocabulary = await extractVocabularyWithTranslation(content);
    const newLesson: Lesson = {
      id: generateId(),
      title,
      content,
      vocabulary,
      createdAt: Date.now(),
    };
    // 樂觀更新畫面
    setLessons((prev) => [newLesson, ...prev]);
    await saveLesson(newLesson);
    const updated = await getLessons();
    setLessons(updated);
  }, []);

  /** 刪除課程 */
  const handleDeleteLesson = useCallback(async (id: string) => {
    if (window.confirm('Are you sure you want to delete this lesson?')) {
      setLessons((prev) => prev.filter((l) => l.id !== id));
      await deleteLesson(id);
      const updated = await getLessons();
      setLessons(updated);
    }
  }, []);

  return (
    <>
      <Navbar />

      <main className="flex-1 pt-20">
        {/* Hero 區域 */}
        <section className="bg-gradient-to-br from-[#1B4965] to-[#2D6A8F] text-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="flex-1">
                <h1 className="text-3xl sm:text-4xl font-bold mb-3 font-[family-name:var(--font-heading)]">
                  Repeat English
                </h1>
                <p className="text-white/80 text-lg mb-6 leading-relaxed">
                  Master English through repetition. Add articles, listen at your own pace,
                  and practice with auto-generated exercises.
                </p>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="inline-flex items-center gap-2 bg-[#E63946] hover:bg-[#C62828] text-white font-semibold px-6 py-3 rounded-lg transition-colors shadow-lg cursor-pointer"
                >
                  <Plus size={20} />
                  Add New Lesson
                </button>
              </div>
              <div className="flex-shrink-0 hidden sm:flex items-center gap-4">
                <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center">
                  <BookOpen size={36} className="text-white/80" />
                </div>
                <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center">
                  <GraduationCap size={36} className="text-white/80" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 課程列表 */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-[#1A1A2E] font-[family-name:var(--font-heading)]">
              My Lessons
            </h2>
            <span className="text-sm text-gray-500">
              {lessons.length} lesson{lessons.length !== 1 ? 's' : ''}
            </span>
          </div>

          {!isLoaded ? (
            /* 載入中 */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-48 bg-gray-100 rounded-xl animate-pulse"
                />
              ))}
            </div>
          ) : lessons.length === 0 ? (
            /* 空狀態 */
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-[#CAE9FF] flex items-center justify-center">
                <BookOpen size={36} className="text-[#1B4965]" />
              </div>
              <h3 className="text-xl font-semibold text-[#1A1A2E] mb-2">
                No lessons yet
              </h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                Get started by adding your first English article. You can paste any text
                and we&apos;ll create a learning experience for you.
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 bg-[#1B4965] hover:bg-[#1B4965]/90 text-white font-semibold px-6 py-3 rounded-lg transition-colors cursor-pointer"
              >
                <Plus size={18} />
                Add Your First Lesson
              </button>
            </div>
          ) : (
            /* 課程卡片網格 */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* 新增按鈕卡片 */}
              <button
                onClick={() => setIsModalOpen(true)}
                className="h-48 rounded-xl border-2 border-dashed border-gray-300 hover:border-[#5FA8D3] bg-white hover:bg-[#CAE9FF]/10 flex flex-col items-center justify-center gap-3 transition-all cursor-pointer group"
              >
                <div className="w-12 h-12 rounded-full bg-gray-100 group-hover:bg-[#CAE9FF] flex items-center justify-center transition-colors">
                  <Plus
                    size={24}
                    className="text-gray-400 group-hover:text-[#1B4965] transition-colors"
                  />
                </div>
                <span className="text-gray-500 group-hover:text-[#1B4965] font-medium transition-colors">
                  Add New Lesson
                </span>
              </button>

              {/* 課程卡片 */}
              {lessons.map((lesson) => (
                <LessonCard
                  key={lesson.id}
                  lesson={lesson}
                  onDelete={handleDeleteLesson}
                />
              ))}
            </div>
          )}
        </section>

        {/* 頁尾 */}
        <footer className="border-t border-gray-200 mt-auto">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 text-center text-sm text-gray-400">
            Copyright © {new Date().getFullYear()} Repeat English. All rights reserved.
          </div>
        </footer>
      </main>

      {/* 新增課程對話框 */}
      <AddLessonModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleAddLesson}
      />
    </>
  );
}
