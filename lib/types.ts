// 型別定義

// 課程資料結構
export interface Lesson {
  id: string;
  title: string;
  content: string;
  vocabulary: VocabularyItem[];
  createdAt: number;
}

// 詞彙項目
export interface VocabularyItem {
  word: string;
  definition: string;
}

// 練習題基礎型別
export interface Exercise {
  id: string;
  type: 'fill-in-blank' | 'multiple-choice' | 'sentence-order';
}

// 填空題
export interface FillInBlankExercise extends Exercise {
  type: 'fill-in-blank';
  sentence: string;        // 原始句子
  blankedSentence: string; // 挖空後的句子（用 ___ 替代）
  answer: string;          // 正確答案
  userAnswer?: string;
}

// 選擇題
export interface MultipleChoiceExercise extends Exercise {
  type: 'multiple-choice';
  question: string;
  options: string[];
  correctIndex: number;
  userAnswer?: number;
}

// 排列句子題
export interface SentenceOrderExercise extends Exercise {
  type: 'sentence-order';
  originalSentence: string;
  shuffledWords: string[];
  userOrder?: string[];
}

// 所有練習題聯合型別
export type ExerciseItem = FillInBlankExercise | MultipleChoiceExercise | SentenceOrderExercise;

// 播放狀態
export interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  rate: number;
  isLooping: boolean;
  loopMode: 'full' | 'sentence';
}
