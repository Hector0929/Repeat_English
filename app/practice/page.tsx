'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import Flashcard, { FlashcardItem } from '@/components/Flashcard';
import { getLessons } from '@/lib/store';
import { Lesson } from '@/lib/types';
import { speakWord } from '@/lib/speech';
import {
  BookOpen,
  Shuffle,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Layers,
  List,
  Volume2,
  Plus,
} from 'lucide-react';
import Link from 'next/link';

const MASTERED_STORAGE_KEY = 'repeat-english-mastered-words';

export default function PracticePage() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedLessonId, setSelectedLessonId] = useState<string>('all');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [shuffleOrder, setShuffleOrder] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'flashcard' | 'list'>('flashcard');
  const [activeTab, setActiveTab] = useState<'all' | 'need_review' | 'mastered'>('all');

  // 1. 初始化掌握單字清單 (Lazy state initializer 避免 effect 中 setState)
  const [masteredWords, setMasteredWords] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(MASTERED_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // 2. 載入所有課程資料
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

  // 3. 彙整單字庫並抓取出處句子
  const allCards = useMemo<FlashcardItem[]>(() => {
    const cards: FlashcardItem[] = [];
    const seenWords = new Set<string>();

    const targetLessons =
      selectedLessonId === 'all'
        ? lessons
        : lessons.filter((l) => l.id === selectedLessonId);

    targetLessons.forEach((lesson) => {
      const sentences = lesson.content
        .split(/(?<=[.!?])\s+/)
        .map((s) => s.trim())
        .filter(Boolean);

      (lesson.vocabulary || []).forEach((v) => {
        const lower = v.word.toLowerCase().trim();
        if (!lower || seenWords.has(lower)) return;
        seenWords.add(lower);

        // 在文章句子中尋找包含該單字的例句
        const regex = new RegExp(`\\b${lower}\\b`, 'i');
        const example = sentences.find((s) => regex.test(s)) || '';

        cards.push({
          word: v.word,
          definition: v.definition,
          lessonTitle: lesson.title,
          exampleSentence: example,
        });
      });
    });

    return cards;
  }, [lessons, selectedLessonId]);

  // 4. 依據掌握分類篩選與洗牌順序
  const filteredCards = useMemo(() => {
    let result = [...allCards];

    if (activeTab === 'mastered') {
      result = result.filter((c) => masteredWords.includes(c.word.toLowerCase()));
    } else if (activeTab === 'need_review') {
      result = result.filter((c) => !masteredWords.includes(c.word.toLowerCase()));
    }

    // 若有自訂洗牌順序，依洗牌順序排列
    if (shuffleOrder.length > 0) {
      const orderMap = new Map(shuffleOrder.map((w, idx) => [w, idx]));
      result.sort((a, b) => (orderMap.get(a.word) ?? 9999) - (orderMap.get(b.word) ?? 9999));
    }

    return result;
  }, [allCards, activeTab, masteredWords, shuffleOrder]);

  // 5. 事件處理器：切換文章篩選
  const handleSelectLesson = (id: string) => {
    setSelectedLessonId(id);
    setShuffleOrder([]);
    setCurrentIndex(0);
  };

  // 事件處理器：切換分類標籤
  const handleSelectTab = (tab: 'all' | 'need_review' | 'mastered') => {
    setActiveTab(tab);
    setShuffleOrder([]);
    setCurrentIndex(0);
  };

  // 事件處理器：執行隨機洗牌
  const handleShuffle = () => {
    const words = filteredCards.map((c) => c.word);
    const shuffled = [...words];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setShuffleOrder(shuffled);
    setCurrentIndex(0);
  };

  // 6. 掌握/需複習切換
  const toggleMastered = useCallback((word: string, shouldMaster: boolean) => {
    const lower = word.toLowerCase();
    setMasteredWords((prev) => {
      const next = shouldMaster
        ? Array.from(new Set([...prev, lower]))
        : prev.filter((w) => w !== lower);

      try {
        localStorage.setItem(MASTERED_STORAGE_KEY, JSON.stringify(next));
      } catch (e) {
        console.error('儲存單字掌握記錄失敗:', e);
      }
      return next;
    });
  }, []);

  // 7. 下一張 / 上一張
  const handleNext = useCallback(() => {
    if (filteredCards.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % filteredCards.length);
  }, [filteredCards.length]);

  const handlePrev = useCallback(() => {
    if (filteredCards.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + filteredCards.length) % filteredCards.length);
  }, [filteredCards.length]);

  // 標記為記住了並自動跳下一張
  const handleMarkMastered = useCallback(() => {
    if (filteredCards.length === 0) return;
    const current = filteredCards[currentIndex];
    if (current) {
      toggleMastered(current.word, true);
      handleNext();
    }
  }, [filteredCards, currentIndex, toggleMastered, handleNext]);

  // 標記為還不熟並自動跳下一張
  const handleMarkNeedReview = useCallback(() => {
    if (filteredCards.length === 0) return;
    const current = filteredCards[currentIndex];
    if (current) {
      toggleMastered(current.word, false);
      handleNext();
    }
  }, [filteredCards, currentIndex, toggleMastered, handleNext]);



  // 統計數據
  const totalCount = allCards.length;
  const masteredCount = allCards.filter((c) =>
    masteredWords.includes(c.word.toLowerCase())
  ).length;
  const reviewCount = totalCount - masteredCount;
  const progressPercent = totalCount > 0 ? Math.round((masteredCount / totalCount) * 100) : 0;

  const currentCard = filteredCards[currentIndex];

  return (
    <>
      <Navbar />

      <main className="flex-1 pt-20 pb-16 min-h-screen bg-[#F8F9FA]">
        {/* ====== 頂部 Hero 與統計橫幅 ====== */}
        <section className="bg-gradient-to-br from-[#1B4965] to-[#2D6A8F] text-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-2 bg-white/10 text-[#CAE9FF] text-xs font-semibold px-3 py-1 rounded-full mb-3 backdrop-blur-xs">
                  <Sparkles size={14} />
                  <span>Spaced Repetition Flashcards</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold font-[family-name:var(--font-heading)] mb-2">
                  Vocabulary Practice
                </h1>
                <p className="text-white/80 text-sm sm:text-base max-w-xl leading-relaxed">
                  將您在所有文章中學過的重點單字彙整成抽認卡，反覆聽音、翻面複習，加深長期記憶。
                </p>
              </div>

              {/* 右側學習數據卡 */}
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/15 min-w-[280px]">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-white/70 font-semibold tracking-wider uppercase">
                    掌握進度
                  </span>
                  <span className="text-lg font-extrabold text-[#CAE9FF]">
                    {progressPercent}%
                  </span>
                </div>

                {/* 進度條 */}
                <div className="w-full h-2.5 bg-white/20 rounded-full overflow-hidden mb-4">
                  <div
                    className="h-full bg-emerald-400 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-black/15 rounded-lg py-1.5 px-2">
                    <p className="text-lg font-bold text-white">{totalCount}</p>
                    <p className="text-[11px] text-white/70">總單字</p>
                  </div>
                  <div className="bg-black/15 rounded-lg py-1.5 px-2">
                    <p className="text-lg font-bold text-emerald-300">{masteredCount}</p>
                    <p className="text-[11px] text-white/70">已掌握</p>
                  </div>
                  <div className="bg-black/15 rounded-lg py-1.5 px-2">
                    <p className="text-lg font-bold text-amber-300">{reviewCount}</p>
                    <p className="text-[11px] text-white/70">待複習</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ====== 練習操作工具列 ====== */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* 左側：文章篩選 */}
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-semibold text-gray-500">來源文章：</span>
              <select
                value={selectedLessonId}
                onChange={(e) => handleSelectLesson(e.target.value)}
                className="text-sm bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg px-3 py-1.5 text-[#1A1A2E] focus:outline-none focus:ring-2 focus:ring-[#5FA8D3] transition-colors cursor-pointer"
              >
                <option value="all">
                  📚 全部課程單字 ({lessons.reduce((acc, l) => acc + (l.vocabulary?.length || 0), 0)})
                </option>
                {lessons.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.title} ({l.vocabulary?.length || 0})
                  </option>
                ))}
              </select>

              {/* 分類標籤頁 */}
              <div className="flex bg-gray-100 p-0.5 rounded-lg text-xs font-semibold">
                <button
                  onClick={() => handleSelectTab('all')}
                  className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                    activeTab === 'all'
                      ? 'bg-white text-[#1B4965] shadow-xs'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  全部 ({allCards.length})
                </button>
                <button
                  onClick={() => handleSelectTab('need_review')}
                  className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                    activeTab === 'need_review'
                      ? 'bg-white text-rose-600 shadow-xs'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  待複習 ({reviewCount})
                </button>
                <button
                  onClick={() => handleSelectTab('mastered')}
                  className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                    activeTab === 'mastered'
                      ? 'bg-white text-emerald-600 shadow-xs'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  已掌握 ({masteredCount})
                </button>
              </div>
            </div>

            {/* 右側：模式切換與洗牌按鈕 */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleShuffle}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                  shuffleOrder.length > 0
                    ? 'bg-[#CAE9FF] border-[#5FA8D3] text-[#1B4965]'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
                title="隨機打亂單字順序"
              >
                <Shuffle size={14} />
                <span>洗牌</span>
              </button>

              <button
                onClick={() => {
                  if (window.confirm('確定要清空所有掌握打卡記錄，重新開始嗎？')) {
                    setMasteredWords([]);
                    try {
                      localStorage.removeItem(MASTERED_STORAGE_KEY);
                    } catch {}
                    setShuffleOrder([]);
                    setCurrentIndex(0);
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-rose-600 transition-colors cursor-pointer"
                title="重置學習進度"
              >
                <RotateCcw size={14} />
                <span>重設</span>
              </button>

              {/* 視圖切換 */}
              <div className="flex border border-gray-200 rounded-lg overflow-hidden ml-1">
                <button
                  onClick={() => setViewMode('flashcard')}
                  className={`p-1.5 transition-colors cursor-pointer ${
                    viewMode === 'flashcard'
                      ? 'bg-[#1B4965] text-white'
                      : 'bg-white text-gray-500 hover:bg-gray-50'
                  }`}
                  title="卡片翻轉模式"
                  aria-label="卡片模式"
                >
                  <Layers size={16} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 transition-colors cursor-pointer ${
                    viewMode === 'list'
                      ? 'bg-[#1B4965] text-white'
                      : 'bg-white text-gray-500 hover:bg-gray-50'
                  }`}
                  title="單字清單列表模式"
                  aria-label="清單模式"
                >
                  <List size={16} />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ====== 核心內容區 ====== */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          {!isLoaded ? (
            /* 載入中骨架屏 */
            <div className="max-w-2xl mx-auto h-96 bg-white rounded-2xl shadow-xs border border-gray-200 animate-pulse flex items-center justify-center">
              <div className="text-gray-400 text-sm">正在載入單字庫...</div>
            </div>
          ) : allCards.length === 0 ? (
            /* 完全沒有單字時的空狀態 */
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center max-w-lg mx-auto shadow-xs">
              <div className="w-16 h-16 rounded-2xl bg-[#CAE9FF] text-[#1B4965] mx-auto flex items-center justify-center mb-4">
                <BookOpen size={32} />
              </div>
              <h3 className="text-xl font-bold text-[#1A1A2E] mb-2">
                尚無可練習的單字
              </h3>
              <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                目前還沒有任何課程或單字。請先至首頁新增第一篇英文文章，系統將自動提取生字與繁體中文解釋供您複習！
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 bg-[#1B4965] hover:bg-[#1B4965]/90 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors cursor-pointer"
              >
                <Plus size={16} />
                前往首頁新增文章
              </Link>
            </div>
          ) : filteredCards.length === 0 ? (
            /* 該篩選條件下沒有單字 */
            <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center max-w-lg mx-auto shadow-xs">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center mb-3">
                <CheckCircle2 size={24} />
              </div>
              <h3 className="text-lg font-bold text-[#1A1A2E] mb-1">
                太棒了！此分類下已無單字
              </h3>
              <p className="text-xs text-gray-500 mb-4">
                {activeTab === 'need_review'
                  ? '您已經掌握了所有的單字！可以切換回「全部」或重新挑戰。'
                  : '目前沒有已掌握的單字，點擊「記住了」來累積你的成就！'}
              </p>
              <button
                onClick={() => handleSelectTab('all')}
                className="text-xs font-semibold text-[#1B4965] hover:underline cursor-pointer"
              >
                查看全部單字 ({allCards.length})
              </button>
            </div>
          ) : viewMode === 'flashcard' && currentCard ? (
            /* ====== 抽認卡視圖 (Flashcards Mode) ====== */
            <div className="py-4">
              <Flashcard
                key={currentCard.word}
                card={currentCard}
                currentIndex={currentIndex}
                totalCards={filteredCards.length}
                isMastered={masteredWords.includes(currentCard.word.toLowerCase())}
                onNext={handleNext}
                onPrev={handlePrev}
                onMarkMastered={handleMarkMastered}
                onMarkNeedReview={handleMarkNeedReview}
              />
            </div>
          ) : (
            /* ====== 清單列表視圖 (Word List Mode) ====== */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCards.map((c) => {
                const isItemMastered = masteredWords.includes(c.word.toLowerCase());
                return (
                  <div
                    key={c.word}
                    className="bg-white rounded-xl p-5 border border-gray-200 shadow-2xs hover:shadow-md transition-shadow flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-xl font-bold text-[#1A1A2E] font-[family-name:var(--font-heading)]">
                          {c.word}
                        </h4>
                        <button
                          onClick={() => speakWord(c.word)}
                          className="text-gray-400 hover:text-[#1B4965] p-1 rounded-md transition-colors cursor-pointer"
                          title="發音"
                          aria-label="發音"
                        >
                          <Volume2 size={18} />
                        </button>
                      </div>
                      <p className="text-sm font-semibold text-[#1B4965] mb-2">
                        {c.definition || '（暫無定義）'}
                      </p>
                      {c.exampleSentence && (
                        <p className="text-xs text-gray-500 italic bg-gray-50 p-2 rounded-lg line-clamp-3">
                          &ldquo;{c.exampleSentence}&rdquo;
                        </p>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center text-xs">
                      <span className="text-gray-400 truncate max-w-[140px]">
                        {c.lessonTitle}
                      </span>
                      <button
                        onClick={() => toggleMastered(c.word, !isItemMastered)}
                        className={`inline-flex items-center gap-1 font-semibold px-2.5 py-1 rounded-full transition-colors cursor-pointer ${
                          isItemMastered
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        {isItemMastered ? (
                          <>
                            <CheckCircle2 size={13} />
                            <span>已掌握</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle size={13} />
                            <span>標記掌握</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
