'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Lesson } from '@/lib/types';
import { getLesson, getLessons, saveLesson } from '@/lib/store';
import { extractVocabulary } from '@/lib/exercises';
import { translateVocabulary } from '@/lib/translator';
import Navbar from '@/components/Navbar';
import ArticleReader from '@/components/ArticleReader';
import AudioPlayer from '@/components/AudioPlayer';
import Sidebar from '@/components/Sidebar';
import PracticeSection from '@/components/PracticeSection';
import { ChevronLeft, PanelRight } from 'lucide-react';
import Link from 'next/link';

/**
 * 單一課程頁面
 * 包含文章閱讀器、音訊播放器、側邊欄、練習區域
 */
export default function LessonPage() {
  const params = useParams();
  const router = useRouter();
  const lessonId = params.id as string;

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [allLessons, setAllLessons] = useState<Lesson[]>([]);
  const [currentCharIndex, setCurrentCharIndex] = useState<number | undefined>(undefined);
  const [showSidebar, setShowSidebar] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // 載入課程
  useEffect(() => {
    let isMounted = true;

    async function fetchLessonData() {
      try {
        const [loadedLesson, lessonsList] = await Promise.all([
          getLesson(lessonId),
          getLessons(),
        ]);

        if (isMounted) {
          if (loadedLesson) {
            // 確保詞彙列表存在
            if (!loadedLesson.vocabulary || loadedLesson.vocabulary.length === 0) {
              loadedLesson.vocabulary = extractVocabulary(loadedLesson.content);
            }
            setLesson(loadedLesson);

            // 若單字釋義尚未翻譯，在背景自動補齊繁體中文並更新至 Supabase
            const needsTranslation = loadedLesson.vocabulary.some(
              (v) => !v.definition || v.definition.includes('請手動填寫')
            );
            if (needsTranslation) {
              translateVocabulary(loadedLesson.vocabulary.map((v) => v.word)).then(
                (translatedVocab) => {
                  if (isMounted && translatedVocab.length > 0) {
                    setLesson((prev) => {
                      if (!prev) return null;
                      const updated = { ...prev, vocabulary: translatedVocab };
                      saveLesson(updated);
                      return updated;
                    });
                  }
                }
              );
            }
          }
          setAllLessons(lessonsList);
        }
      } catch (error) {
        console.error('載入課程失敗:', error);
      } finally {
        if (isMounted) {
          setIsLoaded(true);
        }
      }
    }

    fetchLessonData();

    return () => {
      isMounted = false;
    };
  }, [lessonId]);

  /** 語音邊界回呼 — 同步文章高亮 */
  const handleBoundary = useCallback((charIndex: number) => {
    setCurrentCharIndex(charIndex);
  }, []);

  /** 新增單字至此課單字庫 */
  const handleAddWord = useCallback(
    async (word: string, definition: string) => {
      if (!lesson) return;
      const lower = word.toLowerCase().trim();
      const exists = (lesson.vocabulary || []).some(
        (v) => v.word.toLowerCase().trim() === lower
      );
      if (exists) return;

      const newVocab = [...(lesson.vocabulary || []), { word, definition }];
      const updated = { ...lesson, vocabulary: newVocab };
      setLesson(updated);
      await saveLesson(updated);
    },
    [lesson]
  );

  /** 從此課單字庫移除單字 */
  const handleRemoveWord = useCallback(
    async (word: string) => {
      if (!lesson) return;
      const lower = word.toLowerCase().trim();
      const newVocab = (lesson.vocabulary || []).filter(
        (v) => v.word.toLowerCase().trim() !== lower
      );
      const updated = { ...lesson, vocabulary: newVocab };
      setLesson(updated);
      await saveLesson(updated);
    },
    [lesson]
  );

  // 載入中
  if (!isLoaded) {
    return (
      <>
        <Navbar />
        <main className="flex-1 pt-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
            <div className="h-96 bg-gray-100 rounded-xl animate-pulse" />
          </div>
        </main>
      </>
    );
  }

  // 課程不存在
  if (!lesson) {
    return (
      <>
        <Navbar />
        <main className="flex-1 pt-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 text-center">
            <h2 className="text-2xl font-bold text-[#1A1A2E] mb-4">
              Lesson not found
            </h2>
            <p className="text-gray-500 mb-6">
              The lesson you&apos;re looking for doesn&apos;t exist or has been deleted.
            </p>
            <button
              onClick={() => router.push('/')}
              className="inline-flex items-center gap-2 bg-[#1B4965] text-white font-semibold px-6 py-3 rounded-lg hover:bg-[#1B4965]/90 transition-colors cursor-pointer"
            >
              <ChevronLeft size={18} />
              Back to Home
            </button>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />

      <main className="flex-1 pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {/* 返回連結 + 側邊欄切換 */}
          <div className="flex items-center justify-between mb-5">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-[#5FA8D3] hover:text-[#1B4965] transition-colors text-sm font-medium"
            >
              <ChevronLeft size={16} />
              Back to Lessons
            </Link>

            {/* 手機版側邊欄切換 */}
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="lg:hidden flex items-center gap-1.5 text-[#5FA8D3] hover:text-[#1B4965] transition-colors text-sm font-medium cursor-pointer"
            >
              <PanelRight size={16} />
              {showSidebar ? 'Hide Panel' : 'Show Panel'}
            </button>
          </div>

          {/* 主要內容區域 */}
          <div className="flex gap-6">
            {/* 左側主內容 */}
            <div className="flex-1 min-w-0">
              {/* 文章閱讀器 + 音訊播放器 */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <ArticleReader
                  lesson={lesson}
                  currentCharIndex={currentCharIndex}
                  onAddWord={handleAddWord}
                  onRemoveWord={handleRemoveWord}
                />
                <AudioPlayer
                  text={lesson.content}
                  onBoundary={handleBoundary}
                />
              </div>

              {/* 練習區域 */}
              <PracticeSection
                content={lesson.content}
                vocabulary={lesson.vocabulary}
              />
            </div>

            {/* 右側側邊欄 — 桌面版 */}
            <div className="hidden lg:block w-[240px] flex-shrink-0">
              <div className="sticky top-24">
                <Sidebar
                  lessons={allLessons}
                  currentLessonId={lesson.id}
                  vocabulary={lesson.vocabulary}
                />
              </div>
            </div>
          </div>

          {/* 手機版側邊欄 — 滑出面板 */}
          {showSidebar && (
            <>
              {/* 背景遮罩 */}
              <div
                className="fixed inset-0 bg-black/30 z-40 lg:hidden"
                onClick={() => setShowSidebar(false)}
              />
              {/* 滑出面板 */}
              <div className="fixed top-0 right-0 h-full w-72 bg-white shadow-xl z-50 lg:hidden overflow-y-auto animate-fade-in">
                <div className="p-4">
                  <button
                    onClick={() => setShowSidebar(false)}
                    className="mb-4 text-gray-500 hover:text-gray-700 text-sm font-medium cursor-pointer"
                  >
                    ✕ Close
                  </button>
                  <Sidebar
                    lessons={allLessons}
                    currentLessonId={lesson.id}
                    vocabulary={lesson.vocabulary}
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* 頁尾 */}
        <footer className="border-t border-gray-200 mt-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 text-center text-sm text-gray-400">
            Copyright © {new Date().getFullYear()} Repeat English. All rights reserved.
          </div>
        </footer>
      </main>
    </>
  );
}
