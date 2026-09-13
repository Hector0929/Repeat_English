import { Lesson } from './types';

const STORAGE_KEY = 'repeat-english-lessons';

// 預設範例課程
const defaultLesson: Lesson = {
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
  createdAt: Date.now()
};

/**
 * 檢查是否在瀏覽器環境 (SSR 安全)
 */
const isBrowser = typeof window !== 'undefined';

/**
 * 取得所有課程
 */
export function getLessons(): Lesson[] {
  if (!isBrowser) return [];
  
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      // 若無資料，回傳預設課程並儲存
      saveLesson(defaultLesson);
      return [defaultLesson];
    }
    return JSON.parse(data) as Lesson[];
  } catch (error) {
    console.error('讀取課程失敗:', error);
    return [defaultLesson];
  }
}

/**
 * 取得單一課程
 */
export function getLesson(id: string): Lesson | null {
  if (!isBrowser) return null;
  
  try {
    const lessons = getLessons();
    return lessons.find(l => l.id === id) || null;
  } catch (error) {
    console.error('讀取單一課程失敗:', error);
    return null;
  }
}

/**
 * 儲存課程 (新增或更新)
 */
export function saveLesson(lesson: Lesson): void {
  if (!isBrowser) return;
  
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    let lessons: Lesson[] = data ? JSON.parse(data) : [];
    
    const existingIndex = lessons.findIndex(l => l.id === lesson.id);
    if (existingIndex >= 0) {
      // 更新現有課程
      lessons[existingIndex] = lesson;
    } else {
      // 新增課程
      lessons.push(lesson);
    }
    
    // 依建立時間排序，新的在前
    lessons.sort((a, b) => b.createdAt - a.createdAt);
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lessons));
  } catch (error) {
    console.error('儲存課程失敗:', error);
  }
}

/**
 * 刪除課程
 */
export function deleteLesson(id: string): void {
  if (!isBrowser) return;
  
  try {
    const lessons = getLessons();
    const updatedLessons = lessons.filter(l => l.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedLessons));
  } catch (error) {
    console.error('刪除課程失敗:', error);
  }
}

/**
 * 生成唯一 ID
 */
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}
