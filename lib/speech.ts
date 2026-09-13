export class SpeechController {
  private synth: SpeechSynthesis | null = null;
  private voice: SpeechSynthesisVoice | null = null;
  private currentText: string = '';
  private chunks: string[] = [];
  private currentChunkIndex: number = 0;
  
  private rate: number = 1.0;
  private volume: number = 1.0;
  private _isPlaying: boolean = false;
  private _isPaused: boolean = false;

  // 回調函數
  public onProgress?: (progress: number) => void;
  public onEnd?: () => void;
  public onBoundary?: (charIndex: number) => void;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      // 初始化時嘗試載入語音
      this.initVoice();
      // 監聽語音載入事件
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.initVoice();
      }
    }
  }

  /**
   * 初始化並選擇合適的英文語音
   */
  private initVoice() {
    if (!this.synth) return;
    const voices = this.synth.getVoices();
    if (voices.length > 0) {
      // 優先選擇 en-US，其次是其他英文
      this.voice = voices.find(v => v.lang === 'en-US') || 
                   voices.find(v => v.lang.startsWith('en')) || 
                   voices[0];
    }
  }

  /**
   * 取得可用語音列表
   */
  public getVoices(): SpeechSynthesisVoice[] {
    return this.synth ? this.synth.getVoices() : [];
  }

  /**
   * 將長文本分段，避免超出 SpeechSynthesis 的限制
   */
  private splitText(text: string): string[] {
    // 依據標點符號分段
    const regex = /[^.!?]+[.!?]+/g;
    let match;
    const result = [];
    let currentChunk = '';

    while ((match = regex.exec(text)) !== null) {
      if (currentChunk.length + match[0].length < 200) {
        currentChunk += match[0];
      } else {
        if (currentChunk) result.push(currentChunk.trim());
        currentChunk = match[0];
      }
    }
    if (currentChunk) {
      result.push(currentChunk.trim());
    }
    
    // 如果沒有標點符號， fallback 到簡單的字數分段
    if (result.length === 0 && text.length > 0) {
      result.push(text);
    }
    
    return result;
  }

  /**
   * 朗讀文字
   */
  public speak(text: string): void {
    if (!this.synth) return;
    
    this.stop();
    this.currentText = text;
    this.chunks = this.splitText(text);
    this.currentChunkIndex = 0;
    this._isPlaying = true;
    this._isPaused = false;
    
    this.speakNextChunk();
  }

  /**
   * 朗讀下一個分段
   */
  private speakNextChunk(): void {
    if (!this.synth || this.currentChunkIndex >= this.chunks.length) {
      this._isPlaying = false;
      if (this.onEnd) this.onEnd();
      return;
    }

    const chunkText = this.chunks[this.currentChunkIndex];
    const utterance = new SpeechSynthesisUtterance(chunkText);
    
    if (this.voice) utterance.voice = this.voice;
    utterance.rate = this.rate;
    utterance.volume = this.volume;
    
    utterance.onend = () => {
      this.currentChunkIndex++;
      // 計算並觸發進度
      const progress = this.currentChunkIndex / this.chunks.length;
      if (this.onProgress) this.onProgress(progress);
      
      // 繼續下一段
      if (this._isPlaying && !this._isPaused) {
        this.speakNextChunk();
      }
    };

    utterance.onerror = (e) => {
      console.error('SpeechSynthesis error:', e);
      this.stop();
    };

    utterance.onboundary = (event) => {
      if (event.name === 'word' && this.onBoundary) {
        // 計算累積的字元索引（近似值）
        const previousChunksLength = this.chunks
          .slice(0, this.currentChunkIndex)
          .join(' ').length;
        this.onBoundary(previousChunksLength + event.charIndex);
      }
    };

    this.synth.speak(utterance);
  }

  /**
   * 暫停
   */
  public pause(): void {
    if (this.synth && this._isPlaying) {
      this.synth.pause();
      this._isPaused = true;
    }
  }

  /**
   * 繼續
   */
  public resume(): void {
    if (this.synth && this._isPaused) {
      this.synth.resume();
      this._isPaused = false;
    }
  }

  /**
   * 停止
   */
  public stop(): void {
    if (this.synth) {
      this.synth.cancel();
      this._isPlaying = false;
      this._isPaused = false;
      this.currentChunkIndex = 0;
    }
  }

  /**
   * 設定語速
   */
  public setRate(rate: number): void {
    this.rate = Math.max(0.5, Math.min(2.0, rate));
  }

  /**
   * 設定音量
   */
  public setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
  }
}
