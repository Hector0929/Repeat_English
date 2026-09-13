export type Difficulty = 'easy' | 'medium' | 'hard';
export type ResourceCategory = 'Habits' | 'Health' | 'Story' | 'Inspiration' | 'Productivity' | 'Tech' | 'Philosophy';

export interface ResourceArticle {
  id: string;
  title: string;
  difficulty: Difficulty;
  category: ResourceCategory;
  readTime: string;
  summary: string;
  content: string;
  keyWords: string[];
}

export const curatedResources: ResourceArticle[] = [
  // ================= 🟢 Easy (初級) =================
  {
    id: 'res-easy-small-habits',
    title: 'The Power of Small Habits',
    difficulty: 'easy',
    category: 'Habits',
    readTime: '1 min',
    summary: '微小的習慣如何每天累積 1% 的進步，在時間複利下帶來驚人的巨大轉變。',
    keyWords: ['habit', 'consistent', 'gradually', 'improve'],
    content:
      'Small habits can make a surprising difference in your daily life. When you improve by just one percent every day, you gradually build powerful momentum. Most people focus only on big achievements, but real transformation comes from small, consistent choices. Reading ten pages of a book, drinking an extra glass of water, or walking for fifteen minutes can reshape your routine. Success is the product of daily habits, not once-in-a-lifetime transformations.'
  },
  {
    id: 'res-easy-quality-sleep',
    title: 'Why Quality Sleep Matters',
    difficulty: 'easy',
    category: 'Health',
    readTime: '1 min',
    summary: '探索良好睡眠對大腦排毒、記憶重組與身心健康的關鍵好處。',
    keyWords: ['restore', 'essential', 'immune', 'refresh'],
    content:
      'Quality sleep is essential for both your body and mind. During deep rest, your brain organizes memories, cleanses toxins, and restores physical energy. When you do not get enough sleep, your ability to focus and solve problems drops rapidly. Getting seven to eight hours of sound rest strengthens your immune system and keeps your mood positive. Taking care of your sleep schedule is one of the most effective investments you can make for your health.'
  },
  {
    id: 'res-easy-honest-woodcutter',
    title: 'The Honest Woodcutter',
    difficulty: 'easy',
    category: 'Story',
    readTime: '1 min',
    summary: '經典伊索寓言改寫：樵夫掉入河中的斧頭與誠實的價值。',
    keyWords: ['honest', 'reward', 'greedy', 'vanish'],
    content:
      'Once upon a time, a poor woodcutter accidentally dropped his iron axe into a deep river. He sat on the riverbank and wept bitterly. Suddenly, a water spirit appeared and asked why he was crying. The spirit dove into the water and brought back a shimmering golden axe, but the woodcutter said it was not his. The spirit dove again and returned with a silver axe, which the honest man also refused. Finally, the spirit brought up his own old iron axe. Pleased with his honesty, the spirit gave him all three axes as a generous reward.'
  },

  // ================= 🟡 Medium (中級) =================
  {
    id: 'res-med-connecting-dots',
    title: 'Steve Jobs: Connecting the Dots',
    difficulty: 'medium',
    category: 'Inspiration',
    readTime: '2 mins',
    summary: '賈伯斯史丹佛畢業典禮演講精華：生命中的點滴如何不可思議地串聯起來。',
    keyWords: ['destiny', 'approach', 'diverge', 'conviction'],
    content:
      'You cannot connect the dots looking forward; you can only connect them looking backwards. So you have to trust that the dots will somehow connect in your future. You have to trust in something: your gut, destiny, life, karma, whatever. Because believing that the dots will connect down the road will give you the confidence to follow your heart, even when it leads you off the well-worn path, and that will make all the difference. Remembering that you are going to die is the best way I know to avoid the trap of thinking you have something to lose. Your time is limited, so do not waste it living someone else’s life.'
  },
  {
    id: 'res-med-two-minute-rule',
    title: 'The Two-Minute Rule',
    difficulty: 'medium',
    category: 'Productivity',
    readTime: '2 mins',
    summary: '克服拖延症最有效的心法：任何能在兩分鐘內開始的事情，就立刻去做。',
    keyWords: ['procrastinate', 'momentum', 'obstacle', 'friction'],
    content:
      'Procrastination is often not a problem of willpower, but an issue of emotional friction. The Two-Minute Rule states that when you start a new habit, it should take less than two minutes to do. The goal is not to finish a massive project immediately, but to master the art of showing up. Once you start taking action, friction diminishes and positive momentum naturally takes over. Running three miles begins with putting on your running shoes; writing a novel begins with writing a single sentence. Make the beginning so easy that you cannot say no.'
  },
  {
    id: 'res-med-saying-no',
    title: 'The Art of Saying No',
    difficulty: 'medium',
    category: 'Productivity',
    readTime: '2 mins',
    summary: '學會優雅堅定地設立界線，才能將寶貴的時間專注於真正重要的事。',
    keyWords: ['boundary', 'priority', 'obligation', 'overwhelmed'],
    content:
      'Saying yes to every request may feel polite, but it frequently leads to burnout and diluted focus. When you say yes to something unimportant, you are implicitly saying no to your core priorities. Establishing clear boundaries is not selfish; it is an act of clarity and respect for your time. The next time someone asks for an unnecessary commitment, pause and evaluate whether it aligns with your long-term goals. Protecting your focus allows you to deliver your highest contribution where it truly counts.'
  },

  // ================= 🔴 Hard (高級) =================
  {
    id: 'res-hard-ai-creativity',
    title: 'AI and the Future of Human Creativity',
    difficulty: 'hard',
    category: 'Tech',
    readTime: '3 mins',
    summary: '探討生成式人工智慧時代，人類的同理心、深層經驗與原創價值在哪裡。',
    keyWords: ['unprecedented', 'authenticity', 'empathy', 'evolutionary'],
    content:
      'The emergence of generative artificial intelligence has initiated an unprecedented transformation across creative industries. Algorithms can synthesize sophisticated prose, compose intricate melodies, and generate visually stunning imagery within seconds. Yet this technological revolution compels us to reconsider what authenticity truly represents. Machines analyze statistical patterns derived from historical data, but they do not possess subjective consciousness, grief, or personal vulnerability. Human creativity is not merely aesthetic arrangement; it is an emotional dialogue shaped by lived experience, empathy, and existential longing. In an era saturated with synthetic abundance, genuine human voice and emotional resonance will become increasingly irreplaceable.'
  },
  {
    id: 'res-hard-start-with-why',
    title: 'Simon Sinek: Start With Why',
    difficulty: 'hard',
    category: 'Philosophy',
    readTime: '3 mins',
    summary: '偉大的領袖與企業不只推銷商品，而是激勵人們相信其背後的核心信念。',
    keyWords: ['inspire', 'manipulation', 'clarity', 'loyalty'],
    content:
      'People do not buy what you do; they buy why you do it. Every organization on the planet knows what they do, and some know how they do it, but remarkably few people or companies can clearly articulate why they do what they do. The Golden Circle demonstrates that inspirational leaders and organizations communicate from the inside out. When you communicate from the outside in, people can understand vast amounts of complicated information, but it does not drive behavior or cultivate lasting loyalty. When you start with Why, you speak directly to the limbic brain, the part that controls decision-making and visceral gut emotions. True leadership is not about wielding authority; it is about inspiring individuals to commit to a purpose greater than themselves.'
  },
  {
    id: 'res-hard-pale-blue-dot',
    title: 'Carl Sagan: The Pale Blue Dot',
    difficulty: 'hard',
    category: 'Philosophy',
    readTime: '3 mins',
    summary: '天文學傳奇散文：從太空深處回望地球這顆微小的藍點，體悟人類的謙卑與和平。',
    keyWords: ['obscurity', 'significance', 'arrogance', 'presumption'],
    content:
      'Look again at that dot. That’s here. That’s home. That’s us. On it everyone you love, everyone you know, everyone you ever heard of, every human being who ever was, lived out their lives. The aggregate of our joy and suffering, thousands of confident religions, ideologies, and economic doctrines, every hunter and forager, every hero and coward, every creator and destroyer of civilization lived there—on a mote of dust suspended in a sunbeam. The Earth is a very small stage in a vast cosmic arena. Our posturings, our imagined self-importance, the delusion that we have some privileged position in the Universe, are challenged by this point of pale light. There is perhaps no better demonstration of the folly of human conceits than this distant image of our tiny world. To me, it underscores our responsibility to deal more kindly with one another, and to preserve and cherish the pale blue dot, the only home we’ve ever known.'
  }
];
