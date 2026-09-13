import { Lesson } from './types';
import { supabase, isSupabaseConfigured } from './supabase';

const STORAGE_KEY = 'repeat-english-lessons';

// 預設範例課程
export const defaultLesson: Lesson = {
  id: 'lesson-1',
  title: 'Lesson 1: Career and Passion',
  content: "Right now in your life today, what is the most exciting part of your work life? My work life specifically. I think I have gotten to a place where I know myself. I know what I love. I know what I'm good at. I know what excites me and where I can sustain this excitement over a long period of time, which is critical. When you find that sweet spot where your passion meets your skills, everything changes. The work doesn't feel like work anymore. You wake up energized, ready to tackle challenges that would have seemed impossible before. That's the power of aligning your career with your true calling.",
  vocabulary: [
    { word: 'specifically', definition: '特別地，明確地' },
    { word: 'sustain', definition: '維持，保持' },
    { word: 'critical', definition: '關鍵的，重要的' },
    { word: 'passion', definition: '熱情' },
    { word: 'energized', definition: '精力充沛的' },
    { word: 'tackle', definition: '處理，應付' },
    { word: 'aligning', definition: '使一致，對齊' }
  ],
  createdAt: 1710000000000
};

/**
 * 檢查是否在瀏覽器環境 (SSR 安全)
 */
const isBrowser = typeof window !== 'undefined';

/**
 * 從 LocalStorage 讀取所有課程 (Fallback)
 */
function getLocalLessons(): Lesson[] {
  if (!isBrowser) return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      saveLocalLesson(defaultLesson);
      return [defaultLesson];
    }
    return JSON.parse(data) as Lesson[];
  } catch (error) {
    console.error('LocalStorage 讀取課程失敗:', error);
    return [defaultLesson];
  }
}

/**
 * 儲存課程至 LocalStorage (Fallback / 快取)
 */
function saveLocalLesson(lesson: Lesson): void {
  if (!isBrowser) return;
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    const lessons: Lesson[] = data ? JSON.parse(data) : [];
    const index = lessons.findIndex((l) => l.id === lesson.id);
    if (index >= 0) {
      lessons[index] = lesson;
    } else {
      lessons.push(lesson);
    }
    lessons.sort((a, b) => b.createdAt - a.createdAt);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lessons));
  } catch (error) {
    console.error('LocalStorage 儲存課程失敗:', error);
  }
}

/**
 * 從 LocalStorage 刪除課程
 */
function deleteLocalLesson(id: string): void {
  if (!isBrowser) return;
  try {
    const lessons = getLocalLessons().filter((l) => l.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lessons));
  } catch (error) {
    console.error('LocalStorage 刪除課程失敗:', error);
  }
}

/**
 * 將 Supabase 資料列轉換為前端 Lesson 型別
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapSupabaseRowToLesson(row: any): Lesson {
  let createdAt = Date.now();
  if (typeof row.created_at === 'number') {
    createdAt = row.created_at;
  } else if (row.created_at) {
    const parsed = new Date(row.created_at).getTime();
    if (!isNaN(parsed)) {
      createdAt = parsed;
    }
  }

  return {
    id: String(row.id),
    title: row.title || '',
    content: row.content || '',
    vocabulary: Array.isArray(row.vocabulary) ? row.vocabulary : [],
    createdAt,
  };
}

/**
 * 取得所有課程
 */
export async function getLessons(): Promise<Lesson[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Supabase 讀取失敗（可能尚未在 Supabase 執行 SQL 建表），降級使用 LocalStorage:', error.message);
        return getLocalLessons();
      }

      if (data && data.length > 0) {
        const lessons = data.map(mapSupabaseRowToLesson);
        // 同步儲存至 LocalStorage 作為快取
        if (isBrowser) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(lessons));
        }
        return lessons;
      }

      // 若 Supabase 為空，自動塞入預設課程
      await saveLesson(defaultLesson);
      return [defaultLesson];
    } catch (err) {
      console.error('連線 Supabase 發生例外，改用 LocalStorage:', err);
      return getLocalLessons();
    }
  }

  return getLocalLessons();
}

/**
 * 取得單一課程
 */
export async function getLesson(id: string): Promise<Lesson | null> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        console.warn('Supabase 讀取單一課程失敗，改用 LocalStorage:', error.message);
        const local = getLocalLessons().find((l) => l.id === id);
        return local || null;
      }

      if (data) {
        return mapSupabaseRowToLesson(data);
      }
    } catch (err) {
      console.error('連線 Supabase 發生例外，改用 LocalStorage:', err);
    }
  }

  const local = getLocalLessons().find((l) => l.id === id);
  return local || null;
}

/**
 * 儲存課程 (新增或更新)
 */
export async function saveLesson(lesson: Lesson): Promise<void> {
  // 同步寫入 LocalStorage 快取
  saveLocalLesson(lesson);

  if (isSupabaseConfigured && supabase) {
    try {
      const createdAtValue = new Date(lesson.createdAt).toISOString();
      const { error } = await supabase.from('lessons').upsert(
        {
          id: lesson.id,
          title: lesson.title,
          content: lesson.content,
          vocabulary: lesson.vocabulary,
          created_at: createdAtValue,
        },
        { onConflict: 'id' }
      );

      if (error) {
        console.error('Supabase 儲存課程失敗:', error.message);
      }
    } catch (err) {
      console.error('連線 Supabase 儲存發生例外:', err);
    }
  }
}

/**
 * 刪除課程
 */
export async function deleteLesson(id: string): Promise<void> {
  // 同步刪除 LocalStorage 快取
  deleteLocalLesson(id);

  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from('lessons').delete().eq('id', id);
      if (error) {
        console.error('Supabase 刪除課程失敗:', error.message);
      }
    } catch (err) {
      console.error('連線 Supabase 刪除發生例外:', err);
    }
  }
}

/**
 * 生成唯一 ID
 */
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}
