'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import { curatedResources, ResourceArticle, Difficulty } from '@/lib/resources-data';
import ResourcePreviewModal from '@/components/ResourcePreviewModal';
import { getLessons, saveLesson, generateId } from '@/lib/store';
import { extractVocabularyWithTranslation } from '@/lib/exercises';
import { Lesson } from '@/lib/types';
import {
  BookOpen,
  Search,
  Check,
  Eye,
  ArrowRight,
  Loader2,
  Sparkles,
  Layers,
  Flame,
  Award,
  Zap,
} from 'lucide-react';
import Link from 'next/link';

export default function ResourcesPage() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewArticle, setPreviewArticle] = useState<ResourceArticle | null>(null);
  const [importingId, setImportingId] = useState<string | null>(null);

  // 1. 載入使用者已有的課程以比對是否已匯入
  useEffect(() => {
    let isMounted = true;

    getLessons()
      .then((data) => {
        if (isMounted) {
          setLessons(data);
          setIsLoaded(true);
        }
      })
      .catch((err) => {
        console.error('載入課程失敗:', err);
        if (isMounted) setIsLoaded(true);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // 檢查某文章是否已經匯入過（依據標題比對）
  const getExistingLesson = useCallback(
    (articleTitle: string) => {
      return lessons.find((l) => l.title.trim().toLowerCase() === articleTitle.trim().toLowerCase());
    },
    [lessons]
  );

  // 2. 篩選與搜尋文章
  const filteredArticles = useMemo(() => {
    return curatedResources.filter((art) => {
      const matchDifficulty =
        selectedDifficulty === 'all' || art.difficulty === selectedDifficulty;
      const matchSearch =
        searchQuery.trim() === '' ||
        art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        art.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        art.keyWords.some((kw) => kw.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchDifficulty && matchSearch;
    });
  }, [selectedDifficulty, searchQuery]);

  // 3. 匯入文章至我的課程庫 (寫入 Supabase 並翻譯單字)
  const handleImportArticle = useCallback(
    async (article: ResourceArticle) => {
      const existing = getExistingLesson(article.title);
      if (existing) return;

      setImportingId(article.id);
      try {
        // 自動提取單字並查詢繁體中文釋義
        const vocabulary = await extractVocabularyWithTranslation(article.content);
        const newLesson: Lesson = {
          id: generateId(),
          title: article.title,
          content: article.content,
          vocabulary,
          createdAt: Date.now(),
        };

        await saveLesson(newLesson);
        const updated = await getLessons();
        setLessons(updated);
      } catch (error) {
        console.error('匯入文章失敗:', error);
        alert('匯入文章時發生錯誤，請稍後重試。');
      } finally {
        setImportingId(null);
      }
    },
    [getExistingLesson]
  );

  const difficultyBadges = {
    easy: {
      label: '初級 Easy',
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: <Zap size={13} className="text-emerald-500" />,
    },
    medium: {
      label: '中級 Medium',
      color: 'bg-amber-50 text-amber-700 border-amber-200',
      icon: <Flame size={13} className="text-amber-500" />,
    },
    hard: {
      label: '高級 Hard',
      color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      icon: <Award size={13} className="text-indigo-500" />,
    },
  };

  return (
    <>
      <Navbar />

      <main className="flex-1 pt-20 pb-16 min-h-screen bg-[#F8F9FA]">
        {/* ====== Hero 橫幅 ====== */}
        <section className="bg-gradient-to-br from-[#1B4965] to-[#2D6A8F] text-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 bg-white/10 text-[#CAE9FF] text-xs font-semibold px-3 py-1 rounded-full mb-3 backdrop-blur-xs">
                <BookOpen size={14} />
                <span>Curated Reading Library</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold font-[family-name:var(--font-heading)] mb-3">
                Learning Resources
              </h1>
              <p className="text-white/80 text-base sm:text-lg leading-relaxed mb-6">
                精選 9 篇高質量英文教材，分級標註 Easy（初級）、Medium（中級）、Hard（高級）。
                點擊一鍵即可匯入您的學習庫，自動生成發音、聽讀練習與繁體中文單字庫！
              </p>

              {/* 難度統計小標籤 */}
              <div className="flex flex-wrap gap-2 text-xs font-medium">
                <span className="bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-xs flex items-center gap-1.5">
                  <Zap size={13} className="text-emerald-300" />
                  3 篇初級短文
                </span>
                <span className="bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-xs flex items-center gap-1.5">
                  <Flame size={13} className="text-amber-300" />
                  3 篇中級思維
                </span>
                <span className="bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-xs flex items-center gap-1.5">
                  <Award size={13} className="text-indigo-200" />
                  3 篇高級精讀
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ====== 篩選與搜尋工具列 ====== */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* 難度切換頁籤 */}
            <div className="flex bg-gray-100 p-1 rounded-lg text-xs font-semibold overflow-x-auto">
              <button
                onClick={() => setSelectedDifficulty('all')}
                className={`px-3 py-2 rounded-md transition-all whitespace-nowrap cursor-pointer ${
                  selectedDifficulty === 'all'
                    ? 'bg-white text-[#1B4965] shadow-xs'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                全部文章 (9)
              </button>
              <button
                onClick={() => setSelectedDifficulty('easy')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-md transition-all whitespace-nowrap cursor-pointer ${
                  selectedDifficulty === 'easy'
                    ? 'bg-white text-emerald-700 shadow-xs font-bold'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <Zap size={13} className="text-emerald-500" />
                初級 Easy (3)
              </button>
              <button
                onClick={() => setSelectedDifficulty('medium')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-md transition-all whitespace-nowrap cursor-pointer ${
                  selectedDifficulty === 'medium'
                    ? 'bg-white text-amber-700 shadow-xs font-bold'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <Flame size={13} className="text-amber-500" />
                中級 Medium (3)
              </button>
              <button
                onClick={() => setSelectedDifficulty('hard')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-md transition-all whitespace-nowrap cursor-pointer ${
                  selectedDifficulty === 'hard'
                    ? 'bg-white text-indigo-700 shadow-xs font-bold'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <Award size={13} className="text-indigo-500" />
                高級 Hard (3)
              </button>
            </div>

            {/* 關鍵字搜尋 */}
            <div className="relative w-full md:w-72">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜尋文章標題、摘要或單字..."
                className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5FA8D3] transition-colors placeholder:text-gray-400"
              />
            </div>
          </div>
        </section>

        {/* ====== 文章卡片網格 ====== */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          {filteredArticles.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center max-w-md mx-auto shadow-xs">
              <Layers size={36} className="text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-[#1A1A2E] mb-1">找不到符合的文章</h3>
              <p className="text-xs text-gray-500 mb-4">請嘗試更換難度分類或縮減搜尋關鍵字。</p>
              <button
                onClick={() => {
                  setSelectedDifficulty('all');
                  setSearchQuery('');
                }}
                className="text-xs font-semibold text-[#1B4965] hover:underline cursor-pointer"
              >
                清除篩選條件
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredArticles.map((article) => {
                const existing = getExistingLesson(article.title);
                const isImported = Boolean(existing);
                const isImporting = importingId === article.id;
                const badge = difficultyBadges[article.difficulty];

                return (
                  <div
                    key={article.id}
                    className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                  >
                    <div>
                      {/* 標籤列 */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full border ${badge.color}`}
                        >
                          {badge.icon}
                          {badge.label}
                        </span>
                        <span className="text-xs text-gray-400 font-medium">
                          {article.category} · {article.readTime}
                        </span>
                      </div>

                      {/* 標題 */}
                      <h3 className="text-xl font-bold text-[#1A1A2E] font-[family-name:var(--font-heading)] mb-2 group-hover:text-[#1B4965] transition-colors">
                        {article.title}
                      </h3>

                      {/* 摘要 */}
                      <p className="text-sm text-gray-500 leading-relaxed mb-4 line-clamp-3">
                        {article.summary}
                      </p>

                      {/* 核心單字預覽 */}
                      <div className="mb-5">
                        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">
                          重點單字
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {article.keyWords.map((kw) => (
                            <span
                              key={kw}
                              className="text-xs bg-gray-100 group-hover:bg-[#CAE9FF]/40 text-gray-600 group-hover:text-[#1B4965] px-2 py-0.5 rounded-md font-mono transition-colors"
                            >
                              {kw}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* 底部操作按鈕列 */}
                    <div className="pt-4 border-t border-gray-100 flex items-center justify-between gap-2">
                      <button
                        onClick={() => setPreviewArticle(article)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-[#1B4965] px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                        title="預覽完整課文"
                      >
                        <Eye size={14} />
                        <span>預覽內文</span>
                      </button>

                      {isImported ? (
                        <Link
                          href={`/lesson/${existing?.id}`}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3.5 py-2 rounded-lg transition-colors shadow-2xs"
                        >
                          <Check size={14} />
                          <span>已在學習庫</span>
                          <ArrowRight size={13} />
                        </Link>
                      ) : (
                        <button
                          onClick={() => handleImportArticle(article)}
                          disabled={isImporting || !isLoaded}
                          className="inline-flex items-center gap-1.5 text-xs font-bold bg-[#1B4965] hover:bg-[#1B4965]/90 disabled:bg-gray-400 text-white px-3.5 py-2 rounded-lg transition-all shadow-xs cursor-pointer"
                          title="自動翻譯單字並加入我的課程庫"
                        >
                          {isImporting ? (
                            <>
                              <Loader2 size={14} className="animate-spin" />
                              <span>匯入中...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles size={14} className="text-[#CAE9FF]" />
                              <span>+ 匯入課程</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* ====== 全文預覽彈窗 ====== */}
      {previewArticle && (
        <ResourcePreviewModal
          isOpen={Boolean(previewArticle)}
          article={previewArticle}
          onClose={() => setPreviewArticle(null)}
          onImport={handleImportArticle}
          isImported={Boolean(getExistingLesson(previewArticle.title))}
          importedLessonId={getExistingLesson(previewArticle.title)?.id}
        />
      )}
    </>
  );
}
