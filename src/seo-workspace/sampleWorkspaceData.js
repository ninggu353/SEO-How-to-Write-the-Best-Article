const steps = [
  {
    key: 'product_links',
    label: '产品链接',
    purpose: '先人工确认本篇文章承接的主产品页和辅助产品页。',
    records: ['主产品链接', '辅助产品链接', '近 4 篇重复检查结果'],
  },
  {
    key: 'topic_tdk',
    label: '选题/TDK',
    purpose: '结合关键词表现、产品链接和排重结果，确认文章主题与 TDK。',
    records: ['主题', 'Title', 'Description', 'Keywords', '选取理由'],
  },
  {
    key: 'outline',
    label: '大纲',
    purpose: '确定文章结构、核心小标题和每段要解决的问题。',
    records: ['H2/H3 结构', '搜索意图覆盖', '产品切入位置'],
  },
  {
    key: 'draft',
    label: '初稿',
    purpose: '根据确认后的大纲写出完整文章初稿。',
    records: ['正文草稿', '产品卖点植入', '内部链接建议'],
  },
  {
    key: 'review',
    label: '审核',
    purpose: '检查事实、SEO 要素、客户反馈和可发布状态。',
    records: ['审核问题', '修改原因', '最终确认记录'],
  },
];

function buildStepStatus(currentStepKey) {
  const status = Object.fromEntries(steps.map((step) => [step.key, 'todo']));
  const currentIndex = steps.findIndex((step) => step.key === currentStepKey);
  steps.forEach((step, index) => {
    if (index < currentIndex) status[step.key] = 'done';
    if (index === currentIndex) status[step.key] = 'current';
  });
  return status;
}

function buildStepContents({ productUrl, secondaryUrl, topic, title, description, keywords }) {
  return {
    product_links: [
      '主产品链接：',
      `- ${productUrl}`,
      '',
      '辅助产品链接：',
      `- ${secondaryUrl}`,
      '',
      '排重结果：等待检查近 4 篇是否重复使用同一产品链接。',
    ].join('\n'),
    topic_tdk: [
      `主题：${topic}`,
      `T：${title}`,
      `D：${description}`,
      `K：${keywords}`,
      '选取的理由：覆盖有商业意图的搜索问题，同时能自然承接已确认产品页。',
    ].join('\n'),
    outline: '1. 用户问题和购买场景\n2. 核心参数/标准\n3. 产品对比与选择建议\n4. 使用注意事项\n5. CTA 与内部链接',
    draft: '',
    review: '',
  };
}

function buildArticle({
  id,
  title,
  currentStepKey,
  productUrl,
  secondaryUrl,
  topic,
  tdkTitle,
  description,
  keywords,
}) {
  return {
    id,
    title,
    currentStepKey,
    stepStatus: buildStepStatus(currentStepKey),
    stepContents: buildStepContents({
      productUrl,
      secondaryUrl,
      topic,
      title: tdkTitle,
      description,
      keywords,
    }),
    stepStructuredFields: {},
    productLinks: {
      primary: [productUrl],
      secondary: [secondaryUrl],
    },
    productLinkHistory: [
      {
        id: `${id}-history-1`,
        title: 'How to Choose a Rechargeable Tactical Flashlight',
        deliveredAt: '2026-06-28',
        productUrl: secondaryUrl,
      },
      {
        id: `${id}-history-2`,
        title: 'Best Flashlight Beam Distance for Outdoor Work',
        deliveredAt: '2026-06-24',
        productUrl: 'https://example.com/products/long-range-flashlight',
      },
    ],
    dedupInput: {
      topic,
      keywords,
      productUrl,
      angle: '围绕采购前决策问题展开，避免泛泛科普。',
      buyerStage: 'comparison',
    },
    dedupCandidates: [
      {
        id: `${id}-dedup-1`,
        title: 'Best Tactical Flashlight for Home Emergency Kits',
        topic: 'home emergency tactical flashlight',
        keywords: 'tactical flashlight, emergency flashlight',
        productUrl: secondaryUrl,
        daysAgo: 18,
        matchTypes: ['keyword_combo', 'product_url'],
      },
    ],
    revisions: [],
  };
}

const projects = [
  {
    id: 'demo_project_a',
    name: '户外装备站',
    siteUrl: 'https://example-outdoor.com',
    gscSiteUrl: 'https://example-outdoor.com/',
    clientId: 101,
    articleTotal: 8,
    inProgressCount: 3,
    completedCount: 4,
    needsRevisionCount: 1,
    preferenceMemory: [
      {
        id: 'demo_project_a-memory-1',
        title: '产品链接偏好',
        summary: '优先承接具体产品页，避免把 CTA 指向类目页。',
        createdAt: '初始样例',
        category: 'product_links',
      },
    ],
  },
  {
    id: 'demo_project_b',
    name: '工业照明站',
    siteUrl: 'https://example-lighting.com',
    gscSiteUrl: 'https://example-lighting.com/',
    clientId: 102,
    articleTotal: 6,
    inProgressCount: 2,
    completedCount: 3,
    needsRevisionCount: 1,
    preferenceMemory: [],
  },
  {
    id: 'demo_project_c',
    name: '应急工具站',
    siteUrl: 'https://example-emergency.com',
    gscSiteUrl: 'https://example-emergency.com/',
    clientId: 103,
    articleTotal: 10,
    inProgressCount: 4,
    completedCount: 5,
    needsRevisionCount: 1,
    preferenceMemory: [],
  },
  {
    id: 'demo_project_d',
    name: 'AI 内容质检站',
    siteUrl: 'https://example-ai-content.com',
    gscSiteUrl: 'https://example-ai-content.com/',
    clientId: 104,
    articleTotal: 5,
    inProgressCount: 1,
    completedCount: 4,
    needsRevisionCount: 0,
    preferenceMemory: [],
  },
];

export const sampleWorkspace = {
  steps,
  projects,
  articlesByProject: {
    demo_project_a: [
      buildArticle({
        id: 'article-a-1',
        title: 'Best Tactical Flashlight for Search and Rescue',
        currentStepKey: 'topic_tdk',
        productUrl: 'https://example-outdoor.com/products/rescue-tactical-flashlight',
        secondaryUrl: 'https://example-outdoor.com/products/rechargeable-led-flashlight',
        topic: 'search and rescue tactical flashlight selection',
        tdkTitle: 'Best Tactical Flashlight for Search and Rescue Teams',
        description: 'Compare beam distance, runtime, durability, and charging choices before selecting a search and rescue flashlight.',
        keywords: 'search and rescue flashlight, tactical flashlight, rechargeable led flashlight',
      }),
    ],
    demo_project_b: [
      buildArticle({
        id: 'article-b-1',
        title: 'How to Choose Industrial Work Lights for Night Crews',
        currentStepKey: 'outline',
        productUrl: 'https://example-lighting.com/products/portable-work-light',
        secondaryUrl: 'https://example-lighting.com/products/magnetic-inspection-light',
        topic: 'industrial work lights for night crews',
        tdkTitle: 'How to Choose Industrial Work Lights for Night Crews',
        description: 'A practical buying guide for brightness, mounting, runtime, and jobsite durability.',
        keywords: 'industrial work lights, night crew lighting, portable work light',
      }),
    ],
    demo_project_c: [
      buildArticle({
        id: 'article-c-1',
        title: 'Emergency Flashlight Kit Checklist',
        currentStepKey: 'product_links',
        productUrl: 'https://example-emergency.com/products/emergency-flashlight-kit',
        secondaryUrl: 'https://example-emergency.com/products/usb-c-lantern',
        topic: 'emergency flashlight kit checklist',
        tdkTitle: 'Emergency Flashlight Kit Checklist for Homes and Teams',
        description: 'Build a reliable emergency lighting kit with the right flashlight, lantern, batteries, and storage plan.',
        keywords: 'emergency flashlight kit, home emergency lighting, usb c lantern',
      }),
    ],
    demo_project_d: [
      buildArticle({
        id: 'article-d-1',
        title: 'AI SEO Article Review Checklist',
        currentStepKey: 'review',
        productUrl: 'https://example-ai-content.com/products/content-quality-audit',
        secondaryUrl: 'https://example-ai-content.com/products/seo-brief-review',
        topic: 'AI SEO article review checklist',
        tdkTitle: 'AI SEO Article Review Checklist for Content Teams',
        description: 'Review AI-assisted articles for search intent, factual accuracy, originality, and client-specific requirements.',
        keywords: 'AI SEO article review, content quality checklist, SEO editing workflow',
      }),
    ],
  },
};
