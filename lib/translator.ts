import * as OpenCC from 'opencc-js';
import { VocabularyItem } from './types';

// 初始化簡繁轉換器 (簡體 -> 台灣繁體)
const converter = OpenCC.Converter({ from: 'cn', to: 'tw' });

/**
 * 格式化精簡中文釋義，保留核心詞性與前 1~2 個主要意義
 */
function cleanExplanation(raw: string): string {
  if (!raw) return '';

  // 轉為繁體中文
  const twText = converter(raw);

  // 去除多餘分號或過長釋義，保留最精華的 1~2 個意思
  const parts = twText.split(/[;；]/).map((p) => p.trim()).filter(Boolean);
  if (parts.length <= 2) {
    return twText.replace(/\.\.\.$/, '');
  }

  return parts.slice(0, 2).join('；');
}

/**
 * 查詢單一單字繁體中文釋義
 */
export async function lookupWord(word: string): Promise<string> {
  const cleanWord = word.toLowerCase().trim();
  if (!cleanWord) return '';

  // 1. 嘗試透過字典服務查詢（帶詞性與精準釋義）
  try {
    const url = `https://dict.youdao.com/suggest?q=${encodeURIComponent(cleanWord)}&num=1&doctype=json`;
    const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      const data = await res.json();
      const rawExplain = data.data?.entries?.[0]?.explain;
      if (rawExplain) {
        return cleanExplanation(rawExplain);
      }
    }
  } catch (error) {
    console.warn(`查詢單字 ${cleanWord} 字典失敗，嘗試備用語音翻譯:`, error);
  }

  // 2. 備援方案：MyMemory 翻譯 API
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(cleanWord)}&langpair=en|zh-TW`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'RepeatEnglish/1.0' },
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      const data = await res.json();
      const translated = data.responseData?.translatedText;
      if (translated && translated.toLowerCase() !== cleanWord) {
        return translated.trim();
      }
    }
  } catch (error) {
    console.warn(`備用翻譯單字 ${cleanWord} 失敗:`, error);
  }

  return '（請手動填寫定義）';
}

/**
 * 批次為單字列表查詢繁體中文釋義
 */
export async function translateVocabulary(words: string[]): Promise<VocabularyItem[]> {
  if (!words || words.length === 0) return [];

  const results = await Promise.all(
    words.map(async (word) => {
      const definition = await lookupWord(word);
      return {
        word,
        definition,
      };
    })
  );

  return results;
}
