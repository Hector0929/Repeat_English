import { 
  VocabularyItem, 
  ExerciseItem, 
  FillInBlankExercise, 
  MultipleChoiceExercise, 
  SentenceOrderExercise 
} from './types';
import { generateId } from './store';

/**
 * 從文章提取句子
 */
export function extractSentences(content: string): string[] {
  // 簡單的句子分割，考慮小數點縮寫等特例較困難，這裡使用基本規則
  return content
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

/**
 * Fisher-Yates 洗牌演算法
 */
function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

/**
 * 從文章自動提取重點詞彙（簡易版：選取較長、可能較不常見的詞）
 */
export function extractVocabulary(content: string): VocabularyItem[] {
  // 移除標點符號並轉小寫
  const words = content.replace(/[.,!?()[\]{}"']/g, '')
                       .toLowerCase()
                       .split(/\s+/);
  
  // 計算詞頻
  const wordCount: Record<string, number> = {};
  words.forEach(w => {
    if (w.length > 5) { // 只挑選長度大於 5 的單字
      wordCount[w] = (wordCount[w] || 0) + 1;
    }
  });

  // 常見的虛詞/代名詞排除清單
  const stopWords = ['because', 'through', 'should', 'would', 'could', 'their', 'there', 'where', 'which'];
  
  const selectedWords = Object.keys(wordCount)
    .filter(w => !stopWords.includes(w))
    // 依長度和頻率排序，選出看起來像「重點」的詞
    .sort((a, b) => b.length - a.length)
    .slice(0, 10); // 最多選 10 個

  return selectedWords.map(word => ({
    word,
    definition: '（自動提取，請手動填寫定義）'
  }));
}

/**
 * 生成填空題
 */
export function generateFillInBlanks(sentences: string[], vocabulary: VocabularyItem[]): FillInBlankExercise[] {
  const exercises: FillInBlankExercise[] = [];
  const vocabWords = vocabulary.map(v => v.word.toLowerCase());

  sentences.forEach(sentence => {
    // 尋找句子中是否包含詞彙表中的單字
    for (const vocab of vocabWords) {
      const regex = new RegExp(`\\b${vocab}\\b`, 'i');
      const match = sentence.match(regex);
      
      if (match && exercises.length < 5) { // 限制最多 5 題
        exercises.push({
          id: generateId(),
          type: 'fill-in-blank',
          sentence: sentence,
          blankedSentence: sentence.replace(regex, '___'),
          answer: match[0]
        });
        break; // 每個句子只產生一題
      }
    }
  });

  return exercises;
}

/**
 * 生成選擇題
 */
export function generateMultipleChoice(sentences: string[], vocabulary: VocabularyItem[]): MultipleChoiceExercise[] {
  const exercises: MultipleChoiceExercise[] = [];
  const vocabWords = vocabulary.map(v => v.word);

  if (vocabWords.length < 4) return exercises; // 選項不夠

  sentences.forEach(sentence => {
    for (const vocab of vocabWords) {
      const regex = new RegExp(`\\b${vocab}\\b`, 'i');
      const match = sentence.match(regex);
      
      if (match && exercises.length < 5) {
        const answer = match[0];
        
        // 產生干擾選項
        const otherVocab = vocabWords.filter(v => v.toLowerCase() !== answer.toLowerCase());
        const distractors = shuffleArray(otherVocab).slice(0, 3);
        
        const options = shuffleArray([answer, ...distractors]);
        const correctIndex = options.indexOf(answer);

        exercises.push({
          id: generateId(),
          type: 'multiple-choice',
          question: sentence.replace(regex, '___'),
          options,
          correctIndex
        });
        break;
      }
    }
  });

  return exercises;
}

/**
 * 生成句子排列題
 */
export function generateSentenceOrder(sentences: string[]): SentenceOrderExercise[] {
  const exercises: SentenceOrderExercise[] = [];
  
  // 挑選中等長度的句子 (約 5-12 個單字)
  const candidateSentences = sentences.filter(s => {
    const wordCount = s.split(/\s+/).length;
    return wordCount >= 5 && wordCount <= 12;
  });

  const selectedSentences = shuffleArray(candidateSentences).slice(0, 3); // 產生最多 3 題

  selectedSentences.forEach(sentence => {
    // 移除標點，保留單字
    const cleanSentence = sentence.replace(/[.,!?]/g, '').trim();
    const words = cleanSentence.split(/\s+/).filter(w => w.length > 0);
    
    if (words.length > 0) {
      exercises.push({
        id: generateId(),
        type: 'sentence-order',
        originalSentence: words.join(' '), // 使用去標點後的版本以便比對
        shuffledWords: shuffleArray(words)
      });
    }
  });

  return exercises;
}

/**
 * 整合生成所有練習題
 */
export function generateExercises(content: string, vocabulary: VocabularyItem[]): ExerciseItem[] {
  const sentences = extractSentences(content);
  
  let usedVocabulary = vocabulary;
  if (!usedVocabulary || usedVocabulary.length === 0) {
    usedVocabulary = extractVocabulary(content);
  }

  const fillInBlanks = generateFillInBlanks(sentences, usedVocabulary);
  const multipleChoices = generateMultipleChoice(sentences, usedVocabulary);
  const sentenceOrders = generateSentenceOrder(sentences);

  // 依類型分組回傳（不打亂，因為前端會分區顯示）
  return [...fillInBlanks, ...multipleChoices, ...sentenceOrders];
}
