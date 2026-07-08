import React from 'react';
import { CheckCircle2, Clock3, FileText, Layers3 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { ApiSettingsPanel } from './components/ApiSettingsPanel';
import { ArticleFlow } from './components/ArticleFlow';
import { ProjectList } from './components/ProjectList';
import { RevisionPanel } from './components/RevisionPanel';
import { StepCard } from './components/StepCard';
import { StepEditor } from './components/StepEditor';
import { sampleWorkspace } from './sampleWorkspaceData';
import './seo-workspace.css';

function firstArticleForProject(workspace, projectId) {
  return workspace.articlesByProject[projectId]?.[0] || null;
}

function cloneArticle(article) {
  return {
    ...article,
    stepStatus: { ...article.stepStatus },
    stepContents: { ...article.stepContents },
    stepStructuredFields: { ...(article.stepStructuredFields || {}) },
    productLinks: { ...(article.productLinks || {}) },
    productLinkHistory: [...(article.productLinkHistory || [])],
    dedupCandidates: [...(article.dedupCandidates || [])],
    dedupInput: { ...(article.dedupInput || {}) },
    revisions: [...article.revisions],
  };
}

function seedProjectPreferenceMemory(project) {
  const memories = Array.isArray(project?.preferenceMemory) ? project.preferenceMemory : [];
  return memories.map((item, index) => ({
    id: item.id || `${project.id}-memory-${index}`,
    title: item.title || '项目偏好记忆',
    summary: item.summary || '',
    createdAt: item.createdAt || '初始记忆',
    category: item.category || 'project',
  }));
}

const DEFAULT_API_SETTINGS = {
  backendUrl: 'http://127.0.0.1:8000',
  provider: 'relay',
  baseUrl: 'https://api.openai.com/v1',
  model: 'gpt-4o-mini',
  apiKey: '',
  hasApiKey: false,
};

function backendBaseUrl() {
  return window.localStorage.getItem('seoWorkspace.backendUrl') || DEFAULT_API_SETTINGS.backendUrl;
}

function countCjk(text) {
  return (text.match(/[\u3400-\u9fff]/g) || []).length;
}

function bytesFromMojibake(text, encoding) {
  const cp1252 = new Map([
    ['€', 0x80], ['‚', 0x82], ['ƒ', 0x83], ['„', 0x84], ['…', 0x85], ['†', 0x86], ['‡', 0x87],
    ['ˆ', 0x88], ['‰', 0x89], ['Š', 0x8a], ['‹', 0x8b], ['Œ', 0x8c], ['Ž', 0x8e],
    ['‘', 0x91], ['’', 0x92], ['“', 0x93], ['”', 0x94], ['•', 0x95], ['–', 0x96], ['—', 0x97],
    ['˜', 0x98], ['™', 0x99], ['š', 0x9a], ['›', 0x9b], ['œ', 0x9c], ['ž', 0x9e], ['Ÿ', 0x9f],
  ]);
  const bytes = [];
  for (const char of text) {
    const code = char.charCodeAt(0);
    if (encoding === 'cp1252' && cp1252.has(char)) {
      bytes.push(cp1252.get(char));
    } else if (code <= 255) {
      bytes.push(code);
    } else {
      return null;
    }
  }
  return new Uint8Array(bytes);
}

function repairMojibake(text) {
  if (!text) return text;
  let best = text;
  let bestCjk = countCjk(text);
  for (const encoding of ['latin1', 'cp1252']) {
    try {
      const bytes = bytesFromMojibake(text, encoding);
      if (!bytes) continue;
      const candidate = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
      const cjk = countCjk(candidate);
      if (cjk > bestCjk && cjk >= bestCjk + 3) {
        best = candidate;
        bestCjk = cjk;
      }
    } catch {
      // Keep the original text when it is not mojibake.
    }
  }
  return best;
}

function structuredFieldsForStep(step) {
  if (step.key === 'topic_tdk') {
    return [
      { key: 'topic', label: '主题', placeholder: '这篇文章具体写什么主题' },
      { key: 'title', label: 'T', placeholder: 'Title，可直接用于发布' },
      { key: 'description', label: 'D', placeholder: 'Description，说明文章价值和点击理由' },
      { key: 'keywords', label: 'K', placeholder: '主关键词、辅助关键词' },
      { key: 'reason', label: '选取的理由', placeholder: '为什么现在写这个主题和关键词' },
    ];
  }
  return step.records.map((record, index) => ({
    key: `field_${index}`,
    label: record,
    placeholder: `填写${record}`,
  }));
}

function emptyStructuredFields(step) {
  return Object.fromEntries(structuredFieldsForStep(step).map((field) => [field.key, '']));
}

function formatStructuredFields(step, fields) {
  const lines = structuredFieldsForStep(step).map((field) => `${field.label}：${fields[field.key] || ''}`.trimEnd());
  return lines.join('\n');
}

function previewText(text) {
  const cleaned = String(text || '').replace(/\s+/g, ' ').trim();
  return cleaned ? `${cleaned.slice(0, 72)}${cleaned.length > 72 ? '…' : ''}` : '空内容';
}

function asProductLinkList(value) {
  if (Array.isArray(value)) {
    const items = value.map((item) => String(item || '').trim());
    return items.length ? items : [''];
  }
  const text = String(value || '').trim();
  return text ? [text] : [''];
}

function filledProductLinks(value) {
  return asProductLinkList(value).map((item) => item.trim()).filter(Boolean);
}

function hasAnyProductLink(links) {
  return filledProductLinks(links.primary).length > 0 || filledProductLinks(links.secondary).length > 0;
}

function defaultProductLinks(article) {
  return {
    primary: asProductLinkList(article?.productLinks?.primary),
    secondary: asProductLinkList(article?.productLinks?.secondary),
  };
}

function normalizeUrl(value) {
  return String(value || '').trim().replace(/\/+$/, '').toLowerCase();
}

function extractUrls(text) {
  const matches = String(text || '').match(/https?:\/\/[^\s"'<>，。；、)）]+/g) || [];
  return [...new Set(matches.map((url) => url.replace(/[.,;，。；]+$/, '')))];
}

function defaultProductLinkCheck() {
  return {
    checked: false,
    hasInput: false,
    primaryMatches: [],
    secondaryMatches: [],
    resultText: '等待检查近 4 篇是否重复使用同一产品链接。',
  };
}

function buildProductLinkCheck(links, history) {
  const primaryUrls = filledProductLinks(links.primary).map(normalizeUrl);
  const secondaryUrls = filledProductLinks(links.secondary).map(normalizeUrl);
  const hasAnyInput = primaryUrls.length > 0 || secondaryUrls.length > 0;
  const primaryMatches = primaryUrls.length
    ? history.filter((item) => primaryUrls.includes(normalizeUrl(item.productUrl)))
    : [];
  const secondaryMatches = secondaryUrls.length
    ? history.filter((item) => secondaryUrls.includes(normalizeUrl(item.productUrl)))
    : [];
  const hasMatches = primaryMatches.length > 0 || secondaryMatches.length > 0;
  const lines = [
    !hasAnyInput
      ? '当前还没有填写产品链接，请先人工输入主产品链接或辅助产品链接。'
      : hasMatches
        ? '近 4 篇发现产品链接重复，请决定换产品链接或换文章话题。'
        : '近 4 篇未发现当前主/辅助产品链接重复。',
  ];
  if (primaryMatches.length) {
    lines.push(`主产品链接重复：${primaryMatches.map((item) => `${item.deliveredAt}交付 - ${item.title}`).join('；')}`);
  }
  if (secondaryMatches.length) {
    lines.push(`辅助产品链接重复：${secondaryMatches.map((item) => `${item.deliveredAt}交付 - ${item.title}`).join('；')}`);
  }
  return {
    checked: true,
    hasInput: hasAnyInput,
    primaryMatches,
    secondaryMatches,
    resultText: lines.join('\n'),
  };
}

function formatProductLinks(links, check = null) {
  const primaryLinks = filledProductLinks(links.primary);
  const secondaryLinks = filledProductLinks(links.secondary);
  const lines = [
    '主产品链接：',
    ...(primaryLinks.length ? primaryLinks.map((url, index) => `${index + 1}. ${url}`) : ['未填写']),
    '辅助产品链接：',
    ...(secondaryLinks.length ? secondaryLinks.map((url, index) => `${index + 1}. ${url}`) : ['未填写']),
  ];
  if (check?.checked) {
    lines.push('', `近 4 篇产品链接排重：${check.resultText}`);
  }
  return lines.join('\n');
}

function formatProductLinksInline(value) {
  const links = filledProductLinks(value);
  return links.length ? links.join('；') : '未填写';
}

function isoDateDaysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

function emptyGscSyncState(project) {
  return {
    status: 'idle',
    siteUrl: project?.gscSiteUrl || project?.siteUrl || '',
    dateStart: isoDateDaysAgo(90),
    dateEnd: isoDateDaysAgo(1),
    message: '可先同步 Search Console API，再读取文章效果关键词。',
    jobId: '',
    rowCount: 0,
    syncedAt: '',
  };
}

function emptyGscKeywordState() {
  return {
    status: 'idle',
    message: '请读取该项目的 GSC API 文章效果关键词，再人工选择主关键词和辅助关键词。',
    keywords: [],
    fetchedAt: '',
    source: '',
    hasGscApiEvidence: false,
    sourceLabel: '',
  };
}

function emptyTopicKeywordSelection() {
  return {
    main: '',
    secondary: [],
    ignored: [],
  };
}

function formatSelectedKeywords(selection) {
  const secondary = Array.isArray(selection.secondary) ? selection.secondary : [];
  return [
    `主关键词：${selection.main || '未选择'}`,
    `辅助关键词：${secondary.length ? secondary.join(', ') : '未选择'}`,
  ].join('\n');
}

function emptyProductLinkSuggestions() {
  return {
    text: '',
    urls: [],
    decisions: {},
    rejectionNotes: {},
  };
}

function emptyProductCandidateState() {
  return {
    boardUrl: '',
    status: 'idle',
    message: '输入具体类目页或板块页 URL 后，系统会先读取候选产品链接。',
    candidates: [],
    fetchedAt: '',
  };
}

function formatProductCandidatePool(candidates) {
  if (!Array.isArray(candidates) || !candidates.length) {
    return '暂无候选池。请先点击“读取该板块产品”；如果没有候选池，API 不允许编造具体产品链接。';
  }
  return candidates
    .slice(0, 60)
    .map((item, index) => [
      `${index + 1}. ${item.url}`,
      item.title ? `标题：${item.title}` : '',
      item.image_alt ? `图片 alt：${item.image_alt}` : '',
      item.source_text ? `页面锚文本：${item.source_text}` : '',
    ].filter(Boolean).join(' | '))
    .join('\n');
}

function keywordListFromText(value) {
  return String(value || "")
    .toLowerCase()
    .split(/[,，;；\n]+/)
    .map((item) => item.replace(/^(主关键词|辅助关键词|关键词|k|keywords?)[:：]\s*/i, '').trim())
    .filter(Boolean);
}

function extractTopicTdkInput(article, draft, manualFields, productLinks, keywordSelection) {
  const text = String(draft || article.stepContents?.topic_tdk || '');
  const matchLine = (labels) => {
    for (const label of labels) {
      const pattern = new RegExp(`${label}\\s*[:：]\\s*([^\\n]+)`, 'i');
      const match = text.match(pattern);
      if (match?.[1]) return match[1].trim();
    }
    return '';
  };
  const secondary = Array.isArray(keywordSelection.secondary) ? keywordSelection.secondary : [];
  const selectedKeywords = [keywordSelection.main, ...secondary].filter(Boolean).join(', ');
  return {
    topic: manualFields.topic || matchLine(['文章主题', '主题', 'topic']) || article.dedupInput?.topic || '',
    keywords: selectedKeywords || manualFields.keywords || matchLine(['主关键词', '辅助关键词', '关键词', 'K', 'keywords']) || article.dedupInput?.keywords || '',
    productUrl: [...filledProductLinks(productLinks.primary), ...filledProductLinks(productLinks.secondary)].join('；') || article.dedupInput?.productUrl || '',
    angle: manualFields.reason || matchLine(['选取的理由', '理由', '角度', 'angle']) || article.dedupInput?.angle || '',
    buyerStage: article.dedupInput?.buyerStage || '',
  };
}

function keywordOverlapScore(left, right) {
  const leftItems = new Set(keywordListFromText(left));
  const rightItems = keywordListFromText(right);
  return rightItems.filter((item) => leftItems.has(item)).length;
}

function summarizeTopicTdkDedup(article, draft, manualFields, productLinks, keywordSelection) {
  const input = extractTopicTdkInput(article, draft, manualFields, productLinks, keywordSelection);
  const candidates = article.dedupCandidates || [];
  const topicNeedle = String(input.topic || '').toLowerCase().trim();
  const topicMatches = candidates.filter((item) => {
    if (item.matchTypes?.includes('topic')) return true;
    const oldTopic = String(item.topic || '').toLowerCase();
    return topicNeedle && oldTopic && (oldTopic.includes(topicNeedle) || topicNeedle.includes(oldTopic));
  });
  const keywordMatches = candidates.filter((item) => item.matchTypes?.includes('keyword_combo') || keywordOverlapScore(input.keywords, item.keywords) >= 2);
  const mediumRisk = topicMatches.length > 0 || keywordMatches.length > 0;
  const hasInput = Boolean(input.topic || input.keywords);
  const riskLevel = !hasInput ? 'unknown' : mediumRisk ? 'medium' : 'low';
  const suggestedAction = !hasInput
    ? '请先确认主题或关键词，再运行主题/TDK排重。'
    : mediumRisk
      ? '发现主题或关键词组合疑似重复。'
      : '主题和关键词组合未发现明显重复。';
  const checks = [
    {
      key: 'topic',
      label: '主题',
      status: !hasInput ? 'waiting' : topicMatches.length ? 'risk' : 'pass',
      detail: topicMatches.length ? `发现 ${topicMatches.length} 篇相似主题` : hasInput ? '未发现相似主题' : '等待主题确认',
    },
    {
      key: 'keyword_combo',
      label: '关键词组合',
      status: !hasInput ? 'waiting' : keywordMatches.length ? 'risk' : 'pass',
      detail: keywordMatches.length ? '近 4 篇存在相似关键词组合' : hasInput ? '近 4 篇未重复使用同组关键词' : '等待关键词确认',
    },
  ];
  const apiInputPreview = [...new Map([...topicMatches, ...keywordMatches].map((item) => [item.id, item])).values()].slice(0, 3);
  return {
    status: hasInput ? 'prechecked' : 'idle',
    riskLevel,
    apiUsed: false,
    suggestedAction,
    input,
    checks,
    candidates,
    apiInputPreview,
    decision: [
      '主题/TDK排重：',
      `${checks[0].label}：${checks[0].detail}`,
      `${checks[1].label}：${checks[1].detail}`,
    ].join('\n'),
  };
}

function formatTopicTdkSaveContent(draft, keywordSelection, dedupState) {
  return [
    'GSC/关键词筛选：',
    formatSelectedKeywords(keywordSelection),
    '',
    '选题/TDK正文：',
    draft || '未填写',
    '',
    '主题/TDK排重：',
    dedupState?.decision || dedupState?.suggestedAction || '未运行',
  ].join('\n');
}

function formatPreferenceMemory(entries) {
  if (!Array.isArray(entries) || !entries.length) return '暂无';
  return entries
    .map((item, index) => `${index + 1}. ${item.title}：${item.summary}`.trim())
    .join('\n');
}

function inferProductLinksFromSuggestions(suggestions) {
  const urls = suggestions.urls || [];
  const acceptedUrls = urls.filter((url) => suggestions.decisions?.[url] !== 'rejected');
  const primary = [];
  const secondary = [];
  for (const [index, url] of acceptedUrls.entries()) {
    const escaped = url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = suggestions.text.match(new RegExp(`.{0,80}${escaped}.{0,80}`, 'i'));
    const context = match?.[0] || '';
    if (/辅助|secondary|related|category|support/i.test(context)) {
      secondary.push(url);
    } else if (/主产品|primary|main|核心/i.test(context)) {
      primary.push(url);
    } else if (index === 0) {
      primary.push(url);
    } else {
      secondary.push(url);
    }
  }
  return {
    primary: primary.length ? primary : [''],
    secondary: secondary.length ? secondary : [''],
  };
}

function defaultDedupState(article) {
  return {
    status: 'idle',
    riskLevel: 'unknown',
    apiUsed: false,
    suggestedAction: '先运行数据库预检',
    input: article.dedupInput || {},
    checks: [
      { key: 'topic', label: '主题', status: 'waiting', detail: '等待历史库检查' },
      { key: 'keyword_combo', label: '关键词组合', status: 'waiting', detail: '等待近 4 篇关键词组合检查' },
      { key: 'product_url', label: '产品链接', status: 'waiting', detail: '等待近 4 篇产品链接检查' },
    ],
    candidates: article.dedupCandidates || [],
    apiInputPreview: [],
    decision: '',
  };
}

function summarizeDedupPrecheck(article) {
  const candidates = article.dedupCandidates || [];
  const topicMatches = candidates.filter((item) => item.matchTypes?.includes('topic'));
  const keywordMatches = candidates.filter((item) => item.matchTypes?.includes('keyword_combo'));
  const productMatches = candidates.filter((item) => item.matchTypes?.includes('product_url'));
  const highRisk = candidates.some((item) => item.matchTypes?.includes('topic') && item.matchTypes?.includes('product_url') && item.daysAgo <= 90);
  const mediumRisk = topicMatches.length > 0 || keywordMatches.length > 0 || productMatches.length > 0;
  const riskLevel = highRisk ? 'high' : mediumRisk ? 'medium' : 'low';
  const suggestedAction = highRisk
    ? '高风险：建议返回选题/TDK，换主题、换角度或换产品链接'
    : mediumRisk
      ? '中风险：建议调用 API 判断疑似项，或人工确认特殊情况'
      : '低风险：未发现明显重复，可继续下一步';
  const checks = [
    {
      key: 'topic',
      label: '主题',
      status: topicMatches.length ? 'risk' : 'pass',
      detail: topicMatches.length ? `发现 ${topicMatches.length} 篇相似主题` : '未发现相似主题',
    },
    {
      key: 'keyword_combo',
      label: '关键词组合',
      status: keywordMatches.length ? 'risk' : 'pass',
      detail: keywordMatches.length ? `近 4 篇存在相似关键词组合` : '近 4 篇未重复使用同组关键词',
    },
    {
      key: 'product_url',
      label: '产品链接',
      status: productMatches.length ? 'risk' : 'pass',
      detail: productMatches.length ? `近 4 篇存在相同或高度相似产品链接` : '近 4 篇未重复承接同一产品链接',
    },
  ];
  return {
    status: 'prechecked',
    riskLevel,
    apiUsed: false,
    suggestedAction,
    input: article.dedupInput || {},
    checks,
    candidates,
    apiInputPreview: candidates.slice(0, 3),
    decision: [
      `数据库预检结果：${suggestedAction}`,
      `主题：${checks[0].detail}`,
      `关键词组合：${checks[1].detail}`,
      `产品链接：${checks[2].detail}`,
      candidates.length ? `疑似历史文章：${candidates.slice(0, 3).map((item) => item.title).join('；')}` : '疑似历史文章：0 篇',
    ].join('\n'),
  };
}

function friendlyApiError(message) {
  const text = String(message || '');
  if (text.includes('Expecting value')) {
    return '中转站返回的不是标准 API JSON。请检查 Base URL 是否需要 /v1，或确认 key/model 是否正确。';
  }
  if (text.includes('Failed to fetch')) {
    return '浏览器没有连上本地后端。请确认 http://localhost:8000 正在运行。';
  }
  if (text.includes('HTTP 401') || text.includes('unauthorized')) {
    return 'API Key 可能无效或没有权限。';
  }
  if (text.includes('HTTP 404')) {
    return '中转站接口地址可能不对。请检查 Base URL 是否为 OpenAI-compatible 地址。';
  }
  return text || '未知错误';
}

const API_PROGRESS_STAGES = [
  '读取项目和当前步骤',
  '整理历史修改原因',
  '组织本次生成指令',
  '等待模型返回内容',
  '清理编码和格式',
  '写入创作区等待确认',
];

const API_REWRITE_STAGES = [
  '读取当前内容',
  '读取修改原因',
  '组织重写指令',
  '等待模型返回新版本',
  '检查新版本格式',
  '保存为修改版本',
];

const API_DEDUP_STAGES = [
  '读取当前选题/TDK',
  '查询历史库疑似项',
  '只截取 Top 3 疑似文章',
  '让 API 判断是否真重复',
  '整理风险等级和建议',
  '写入排重记录',
];

const API_PRODUCT_LINK_STAGES = [
  '读取项目和文章目标',
  '读取板块产品候选池',
  '读取本项目偏好记忆',
  '组织产品承接判断',
  '等待模型推荐主/辅助链接',
  '提取推荐理由和 URL',
  '写入产品链接候选',
];

const PRODUCT_CANDIDATE_STAGES = [
  '检查板块 URL',
  '请求本地后端读取页面',
  '解析候选产品链接',
  '过滤类目页和重复链接',
  '写入候选池',
];

export function SeoArticleWorkspace({ initialProjectId = 'demo_project_a', workspace = sampleWorkspace }) {
  const visibleSteps = React.useMemo(() => workspace.steps.filter((step) => step.key !== 'dedup'), [workspace.steps]);
  const initialArticle = React.useMemo(() => cloneArticle(firstArticleForProject(workspace, initialProjectId)), [initialProjectId, workspace]);
  const initialStepKey = visibleSteps.some((step) => step.key === initialArticle.currentStepKey) ? initialArticle.currentStepKey : visibleSteps[0].key;
  const [selectedProjectId, setSelectedProjectId] = React.useState(initialProjectId);
  const [articleState, setArticleState] = React.useState(initialArticle);
  const [selectedStepKey, setSelectedStepKey] = React.useState(initialStepKey);
  const [draft, setDraft] = React.useState(initialArticle.stepContents[initialStepKey] || '');
  const [interactionMode, setInteractionMode] = React.useState('api');
  const [manualFields, setManualFields] = React.useState(() => emptyStructuredFields((visibleSteps.find((step) => step.key === articleState.currentStepKey) || visibleSteps[0])));
  const [apiInstruction, setApiInstruction] = React.useState('');
  const [generationProgress, setGenerationProgress] = React.useState({ running: false, percent: 0, label: '等待开始', elapsed: 0, estimate: 0 });
  const [lastSaveNotice, setLastSaveNotice] = React.useState(null);
  const [dedupState, setDedupState] = React.useState(() => summarizeTopicTdkDedup(articleState, articleState.stepContents.topic_tdk || '', {}, defaultProductLinks(articleState), emptyTopicKeywordSelection()));
  const [productLinks, setProductLinks] = React.useState(() => defaultProductLinks(articleState));
  const [productLinkCheck, setProductLinkCheck] = React.useState(defaultProductLinkCheck);
  const [productLinkSuggestions, setProductLinkSuggestions] = React.useState(emptyProductLinkSuggestions);
  const [productCandidateState, setProductCandidateState] = React.useState(emptyProductCandidateState);
  const [gscSyncState, setGscSyncState] = React.useState(() => emptyGscSyncState(workspace.projects.find((project) => project.id === initialProjectId)));
  const [gscKeywordState, setGscKeywordState] = React.useState(() => emptyGscKeywordState(workspace.projects.find((project) => project.id === initialProjectId)));
  const [topicKeywordSelection, setTopicKeywordSelection] = React.useState(emptyTopicKeywordSelection);
  const [projectPreferenceMemoryById, setProjectPreferenceMemoryById] = React.useState(() => Object.fromEntries(
    (workspace.projects || []).map((project) => [project.id, seedProjectPreferenceMemory(project)]),
  ));
  const [editReason, setEditReason] = React.useState('');
  const [revisionType, setRevisionType] = React.useState('operator');
  const [apiSettings, setApiSettings] = React.useState(DEFAULT_API_SETTINGS);
  const [apiStatus, setApiStatus] = React.useState({ kind: 'idle', text: '未连接后端' });

  const selectedProject = workspace.projects.find((project) => project.id === selectedProjectId);
  const selectedStep = visibleSteps.find((step) => step.key === selectedStepKey) || visibleSteps[0];
  const selectedProjectPreferenceMemory = projectPreferenceMemoryById[selectedProjectId] || [];
  const workspaceStats = React.useMemo(() => (
    (workspace.projects || []).reduce(
      (totals, project) => ({
        projects: totals.projects + 1,
        articles: totals.articles + project.articleTotal,
        inProgress: totals.inProgress + project.inProgressCount,
        completed: totals.completed + project.completedCount,
      }),
      { projects: 0, articles: 0, inProgress: 0, completed: 0 },
    )
  ), [workspace.projects]);

  React.useEffect(() => {
    let cancelled = false;
    async function loadApiConfig() {
      try {
        const response = await fetch(`${backendBaseUrl()}/api/llm/config`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        const active = (data.providers || []).find((item) => item.provider === data.active_provider) || data.providers?.[0];
        if (!cancelled && active) {
          setApiSettings({
            backendUrl: backendBaseUrl(),
            provider: active.provider || 'relay',
            baseUrl: active.base_url || '',
            model: active.model || '',
            apiKey: '',
            hasApiKey: Boolean(active.has_api_key),
          });
          setApiStatus({ kind: active.has_api_key ? 'ready' : 'warn', text: active.has_api_key ? '后端已连接' : '后端已连接，未配置 key' });
        }
      } catch (error) {
        if (!cancelled) setApiStatus({ kind: 'warn', text: '后端未启动，暂用本地预览' });
      }
    }
    loadApiConfig();
    return () => {
      cancelled = true;
    };
  }, []);

  function selectProject(projectId) {
    const nextArticle = cloneArticle(firstArticleForProject(workspace, projectId));
    const nextStepKey = visibleSteps.some((step) => step.key === nextArticle.currentStepKey) ? nextArticle.currentStepKey : visibleSteps[0].key;
    const nextProject = workspace.projects.find((project) => project.id === projectId);
    setSelectedProjectId(projectId);
    setArticleState(nextArticle);
    setSelectedStepKey(nextStepKey);
    setDraft(nextArticle.stepContents[nextStepKey] || '');
    setManualFields(nextArticle.stepStructuredFields?.[nextStepKey] || emptyStructuredFields(visibleSteps.find((step) => step.key === nextStepKey)));
    setApiInstruction('');
    setGenerationProgress({ running: false, percent: 0, label: '等待开始', elapsed: 0, estimate: 0 });
    setLastSaveNotice(null);
    const nextProductLinks = defaultProductLinks(nextArticle);
    const emptySelection = emptyTopicKeywordSelection();
    setDedupState(summarizeTopicTdkDedup(nextArticle, nextArticle.stepContents.topic_tdk || '', {}, nextProductLinks, emptySelection));
    setProductLinks(nextProductLinks);
    setProductLinkCheck(defaultProductLinkCheck());
    setProductLinkSuggestions(emptyProductLinkSuggestions());
    setProductCandidateState(emptyProductCandidateState());
    setGscSyncState(emptyGscSyncState(nextProject));
    setGscKeywordState(emptyGscKeywordState(nextProject));
    setTopicKeywordSelection(emptySelection);
    setEditReason('');
  }

  function appendProjectPreferenceMemory(projectId, entry) {
    const normalizedEntry = {
      id: entry.id || `${projectId}-memory-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      title: entry.title || '项目偏好记忆',
      summary: entry.summary || '',
      createdAt: entry.createdAt || new Date().toLocaleString('zh-CN', { hour12: false }),
      category: entry.category || 'project',
    };
    setProjectPreferenceMemoryById((current) => ({
      ...current,
      [projectId]: [...(current[projectId] || []), normalizedEntry],
    }));
  }

  function selectStep(stepKey) {
    const safeStepKey = visibleSteps.some((step) => step.key === stepKey) ? stepKey : visibleSteps[0].key;
    const nextStep = visibleSteps.find((step) => step.key === safeStepKey);
    setSelectedStepKey(safeStepKey);
    setDraft(safeStepKey === 'product_links'
      ? articleState.stepContents[safeStepKey] || formatProductLinks(productLinks, productLinkCheck)
      : articleState.stepContents[safeStepKey] || '');
    setManualFields(articleState.stepStructuredFields?.[safeStepKey] || emptyStructuredFields(nextStep));
    setApiInstruction('');
    setGenerationProgress({ running: false, percent: 0, label: '等待开始', elapsed: 0, estimate: 0 });
    setLastSaveNotice(null);
    if (safeStepKey === 'topic_tdk') {
      setDedupState((current) => current.status === 'idle'
        ? summarizeTopicTdkDedup(articleState, articleState.stepContents.topic_tdk || '', manualFields, productLinks, topicKeywordSelection)
        : current);
    }
    if (safeStepKey === 'product_links') {
      setProductLinkSuggestions(emptyProductLinkSuggestions());
    }
    setEditReason('');
  }

  function saveRevision(action, source = 'manual') {
    const trimmedReason = editReason.trim();
    if (action === 'modify' && !trimmedReason) {
      setLastSaveNotice({
        kind: 'error',
        title: '修改未保存',
        detail: '请先填写修改原因，再保存修改记录。',
      });
      return false;
    }
    const reason = trimmedReason || (action === 'confirm' ? '人工确认当前内容。' : '记录本次修改原因。');
    const contentToSave = selectedStepKey === 'product_links'
      ? formatProductLinks(productLinks, productLinkCheck)
      : selectedStepKey === 'topic_tdk'
        ? formatTopicTdkSaveContent(draft, topicKeywordSelection, dedupState)
        : draft;
    const previousContent = articleState.stepContents[selectedStepKey] || '';
    const revision = {
      id: `${selectedStepKey}-${Date.now()}`,
      stepKey: selectedStepKey,
      type: revisionType,
      source,
      action,
      reason,
      createdAt: new Date().toLocaleString('zh-CN', { hour12: false }),
      previousContent,
      newContent: contentToSave,
      previousSummary: previewText(previousContent),
      newSummary: previewText(contentToSave),
      summary: `${selectedStep.label} 已${action === 'confirm' ? '确认' : '修改'}：${previewText(contentToSave)}`,
    };
    setArticleState((current) => ({
      ...current,
      productLinks: selectedStepKey === 'product_links' ? { ...productLinks } : current.productLinks,
      stepContents: {
        ...current.stepContents,
        [selectedStepKey]: contentToSave,
      },
      stepStructuredFields: {
        ...(current.stepStructuredFields || {}),
        [selectedStepKey]: manualFields,
      },
      revisions: [
        ...current.revisions,
        revision,
      ],
    }));
    setLastSaveNotice({
      kind: 'success',
      title: action === 'confirm' ? '确认已保存' : '修改已保存',
      detail: `${revision.createdAt} · ${revision.summary}`,
      reason,
      currentContent: contentToSave,
      previousContent,
      previousSummary: revision.previousSummary,
      newSummary: revision.newSummary,
    });
    if (selectedStepKey === 'product_links') setDraft(contentToSave);
    setEditReason('');
    return true;
  }

  function updateApiSettings(patch) {
    setApiSettings((current) => {
      const next = { ...current, ...patch };
      if (patch.backendUrl) window.localStorage.setItem('seoWorkspace.backendUrl', patch.backendUrl);
      return next;
    });
  }

  async function saveApiSettings() {
    setApiStatus({ kind: 'running', text: '正在保存 API 配置' });
    try {
      const response = await fetch(`${apiSettings.backendUrl || backendBaseUrl()}/api/llm/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: apiSettings.provider,
          base_url: apiSettings.baseUrl,
          model: apiSettings.model,
          api_key: apiSettings.apiKey,
          enabled: true,
        }),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || `HTTP ${response.status}`);
      }
      const data = await response.json();
      const active = (data.providers || []).find((item) => item.provider === data.active_provider) || data.providers?.[0];
      setApiSettings((current) => ({ ...current, apiKey: '', hasApiKey: Boolean(active?.has_api_key) }));
      setApiStatus({ kind: 'ready', text: 'API 配置已保存' });
    } catch (error) {
      setApiStatus({ kind: 'error', text: `保存失败：${error.message}` });
    }
  }

  function buildStepPrompt(testOnly = false) {
    const linkContext = formatProductLinks(selectedStepKey === 'product_links' ? productLinks : articleState.productLinks || productLinks);
    const keywordContext = selectedStepKey === 'topic_tdk' ? formatSelectedKeywords(topicKeywordSelection) : '非选题/TDK步骤';
    const topicDedupContext = selectedStepKey === 'topic_tdk' ? (dedupState.decision || dedupState.suggestedAction || '未运行') : '非选题/TDK步骤';
    return [
      `项目：${selectedProject.name}`,
      `文章：${articleState.title}`,
      `当前步骤：${selectedStep.label}`,
      `步骤目标：${selectedStep.purpose}`,
      `必须记录：${selectedStep.records.join('、')}`,
      `已确认产品链接：\n${linkContext}`,
      `已选择关键词：\n${keywordContext}`,
      `主题/TDK排重结果：\n${topicDedupContext}`,
      `本项目偏好记忆：\n${formatPreferenceMemory(selectedProjectPreferenceMemory)}`,
      `当前草稿：${draft || '暂无'}`,
      `人工补充要求：${apiInstruction.trim() || '无'}`,
      `历史修改原因：${articleState.revisions.map((item) => `${item.type}: ${item.reason}`).join('；') || '暂无'}`,
      testOnly ? '请只返回一句中文测试文案，确认接口可用。' : '请生成本步骤可供人工审核的内容，要求简洁、结构清楚、不要编造客户资料。',
    ].join('\n');
  }

  function buildRewritePrompt() {
    return [
      `项目：${selectedProject.name}`,
      `文章：${articleState.title}`,
      `当前步骤：${selectedStep.label}`,
      `步骤目标：${selectedStep.purpose}`,
      `必须记录：${selectedStep.records.join('、')}`,
      '请根据修改原因重写当前内容。',
      '要求：只输出修改后的最终内容，不要解释修改过程，不要编造客户资料。',
      `当前内容：\n${draft || '暂无'}`,
      `修改原因/修改指令：${editReason.trim() || '暂无'}`,
      `历史修改原因：${articleState.revisions.map((item) => `${item.type}: ${item.reason}`).join('；') || '暂无'}`,
    ].join('\n');
  }

  function buildDedupPrompt(state) {
    const input = state.input || {};
    const candidates = (state.apiInputPreview || []).slice(0, 3);
    return [
      '请作为 SEO 文章排重审核员，只判断是否需要返回选题/TDK修改。',
      '不要因为单个关键词重复就直接拦截。重点看：主题、搜索意图、文章角度、产品链接、近期关键词组合。',
      '',
      '当前候选：',
      `主题：${input.topic || '未填写'}`,
      `关键词组合：${input.keywords || '未填写'}`,
      `产品链接：${input.productUrl || '未填写'}`,
      `文章角度：${input.angle || '未填写'}`,
      `买家阶段：${input.buyerStage || '未填写'}`,
      '',
      '历史库疑似文章 Top 3：',
      candidates.length
        ? candidates.map((item, index) => `${index + 1}. ${item.title} | 主题：${item.topic} | 关键词：${item.keywords} | 产品链接：${item.productUrl} | 角度：${item.angle} | ${item.daysAgo} 天前`).join('\n')
        : '无',
      '',
      '请输出：风险等级、是否真重复、重复原因、建议动作、如果可继续应换成什么角度。用中文，结构清楚。',
    ].join('\n');
  }

  function buildProductLinkPrompt(extraInstruction = '') {
    const preferenceMemory = formatPreferenceMemory(selectedProjectPreferenceMemory);
    const productCandidatePool = formatProductCandidatePool(productCandidateState.candidates);
    const hasCandidatePool = productCandidateState.candidates.length > 0;
    return [
      '请作为独立站 SEO 文章的产品承接助手，帮我判断本篇文章应该承接哪个主产品链接和哪个辅助产品链接。',
      hasCandidatePool
        ? '重要：本轮已经由代码读取出候选产品链接池。你只能从候选池中选择主产品链接和辅助产品链接，不允许编造候选池以外的 URL。'
        : '重要：当前没有候选产品链接池。不要编造无法确认的真实链接；如果信息不足，请明确说需要先读取板块产品或人工补充产品库。',
      '',
      `项目：${selectedProject.name}`,
      `官网：${selectedProject.siteUrl}`,
      `文章：${articleState.title}`,
      `当前板块 URL：${productCandidateState.boardUrl || '未填写'}`,
      `候选产品链接池：\n${productCandidatePool}`,
      `当前已填主产品链接：${formatProductLinksInline(productLinks.primary)}`,
      `当前已填辅助产品链接：${formatProductLinksInline(productLinks.secondary)}`,
      `当前选题/TDK：\n${articleState.stepContents.topic_tdk || draft || '暂无'}`,
      `本项目产品链接偏好记忆：\n${preferenceMemory}`,
      `本轮产品链接排重结果：${productLinkCheck.checked ? productLinkCheck.resultText : '尚未运行排重检查'}`,
      `人工补充要求：${apiInstruction.trim() || '无'}`,
      extraInstruction ? `本轮修改要求：\n${extraInstruction}` : '',
      '',
      '请输出：',
      '1. 建议主产品链接，必须明确写出 URL',
      '2. 建议辅助产品链接，必须明确写出 URL',
      '3. 为什么这样承接',
      '4. 是否与本项目偏好冲突；如果重复，应换产品链接还是换文章话题',
      '5. 如果信息不足，请列出需要人工补充的产品库字段',
    ].join('\n');
  }

  async function callBackendGenerate(prompt, purpose = 'workspace_step_generation') {
    const response = await fetch(`${apiSettings.backendUrl || backendBaseUrl()}/api/llm/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ purpose, prompt }),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }
    return response.json();
  }

  async function generateApiDraft() {
    setInteractionMode('api');
    setApiStatus({ kind: 'running', text: 'API 正在生成草稿' });
    const startedAt = Date.now();
    setGenerationProgress({ running: true, percent: 5, label: API_PROGRESS_STAGES[0], elapsed: 0, estimate: 45 });
    const progressTimer = window.setInterval(() => {
      setGenerationProgress((current) => {
        if (!current.running) return current;
        const elapsed = Math.max(1, Math.round((Date.now() - startedAt) / 1000));
        const nextPercent = Math.min(90, current.percent + (elapsed < 12 ? 5 : 2));
        const stageIndex = Math.min(API_PROGRESS_STAGES.length - 2, Math.floor((nextPercent / 100) * API_PROGRESS_STAGES.length));
        return {
          running: true,
          percent: nextPercent,
          label: API_PROGRESS_STAGES[stageIndex],
          elapsed,
          estimate: Math.max(8, 55 - elapsed),
        };
      });
    }, 1000);
    try {
      const data = await callBackendGenerate(buildStepPrompt(false));
      setDraft(repairMojibake(data.text || ''));
      setGenerationProgress({
        running: false,
        percent: 100,
        label: API_PROGRESS_STAGES[API_PROGRESS_STAGES.length - 1],
        elapsed: Math.max(1, Math.round((Date.now() - startedAt) / 1000)),
        estimate: 0,
      });
      setApiStatus({ kind: 'ready', text: `生成完成：${data.provider} / ${data.model}` });
    } catch (error) {
      const readableError = friendlyApiError(error.message);
      const nextDraft = [
        `${selectedStep.label} API 草稿`,
        `本阶段目标：${selectedStep.purpose}`,
        `必须记录：${selectedStep.records.join('、')}`,
        `后端暂不可用：${readableError}`,
        '当前先使用本地预览草稿；配置 API key 并启动后端后可真实生成。',
      ].join('\n');
      setDraft(nextDraft);
      setGenerationProgress({
        running: false,
        percent: 0,
        label: `生成失败：${readableError}`,
        elapsed: Math.max(1, Math.round((Date.now() - startedAt) / 1000)),
        estimate: 0,
      });
      setApiStatus({ kind: 'error', text: `生成失败：${readableError}` });
    } finally {
      window.clearInterval(progressTimer);
    }
  }

  function runProgress(stages, startedAt, initialLabel) {
    setGenerationProgress({ running: true, percent: 5, label: initialLabel || stages[0], elapsed: 0, estimate: 45 });
    return window.setInterval(() => {
      setGenerationProgress((current) => {
        if (!current.running) return current;
        const elapsed = Math.max(1, Math.round((Date.now() - startedAt) / 1000));
        const nextPercent = Math.min(90, current.percent + (elapsed < 12 ? 5 : 2));
        const stageIndex = Math.min(stages.length - 2, Math.floor((nextPercent / 100) * stages.length));
        return {
          running: true,
          percent: nextPercent,
          label: stages[stageIndex],
          elapsed,
          estimate: Math.max(8, 55 - elapsed),
        };
      });
    }, 1000);
  }

  async function apiRewriteDraft() {
    const trimmedReason = editReason.trim();
    if (!trimmedReason) {
      setLastSaveNotice({
        kind: 'error',
        title: '无法调用 API 修改',
        detail: '请先填写修改原因或修改指令，再让 API 按原因重写。',
      });
      return;
    }
    setInteractionMode('api');
    setApiStatus({ kind: 'running', text: 'API 正在按修改原因重写' });
    const previousContent = articleState.stepContents[selectedStepKey] || '';
    const startedAt = Date.now();
    const progressTimer = runProgress(API_REWRITE_STAGES, startedAt, API_REWRITE_STAGES[0]);
    try {
      const data = await callBackendGenerate(buildRewritePrompt(), 'workspace_step_rewrite');
      const rewrittenText = repairMojibake(data.text || '');
      setDraft(rewrittenText);
      const revision = {
        id: `${selectedStepKey}-${Date.now()}`,
        stepKey: selectedStepKey,
        type: revisionType,
        source: 'api_rewrite',
        action: 'modify',
        reason: trimmedReason,
        createdAt: new Date().toLocaleString('zh-CN', { hour12: false }),
        previousContent,
        newContent: rewrittenText,
        previousSummary: previewText(previousContent),
        newSummary: previewText(rewrittenText),
        summary: `${selectedStep.label} 已由 API 按原因重写：${previewText(rewrittenText)}`,
      };
      setArticleState((current) => ({
        ...current,
        stepContents: {
          ...current.stepContents,
          [selectedStepKey]: rewrittenText,
        },
        revisions: [
          ...current.revisions,
          revision,
        ],
      }));
      setLastSaveNotice({
        kind: 'success',
        title: 'API 修改已保存',
        detail: `${revision.createdAt} · ${revision.summary}`,
        reason: trimmedReason,
        currentContent: rewrittenText,
        previousContent,
        previousSummary: revision.previousSummary,
        newSummary: revision.newSummary,
      });
      setEditReason('');
      setGenerationProgress({
        running: false,
        percent: 100,
        label: API_REWRITE_STAGES[API_REWRITE_STAGES.length - 1],
        elapsed: Math.max(1, Math.round((Date.now() - startedAt) / 1000)),
        estimate: 0,
      });
      setApiStatus({ kind: 'ready', text: `API 修改完成：${data.provider} / ${data.model}` });
    } catch (error) {
      const readableError = friendlyApiError(error.message);
      setGenerationProgress({
        running: false,
        percent: 0,
        label: `API 修改失败：${readableError}`,
        elapsed: Math.max(1, Math.round((Date.now() - startedAt) / 1000)),
        estimate: 0,
      });
      setApiStatus({ kind: 'error', text: `API 修改失败：${readableError}` });
      setLastSaveNotice({
        kind: 'error',
        title: 'API 修改失败',
        detail: readableError,
      });
    } finally {
      window.clearInterval(progressTimer);
    }
  }

  function runDedupPrecheck() {
    const nextState = summarizeDedupPrecheck(articleState);
    setDedupState(nextState);
    setDraft(nextState.decision);
    setLastSaveNotice({
      kind: nextState.riskLevel === 'high' ? 'error' : 'success',
      title: nextState.riskLevel === 'low' ? '排重预检通过' : '排重预检发现风险',
      detail: nextState.suggestedAction,
      currentContent: nextState.decision,
    });
  }

  function updateProductLink(role, index, value) {
    setProductLinks((current) => {
      const nextList = asProductLinkList(current[role]);
      nextList[index] = value;
      const next = { ...current, [role]: nextList };
      const nextCheck = defaultProductLinkCheck();
      setProductLinkCheck(nextCheck);
      setDraft(formatProductLinks(next, nextCheck));
      return next;
    });
  }

  function addProductLink(role) {
    setProductLinks((current) => {
      const next = { ...current, [role]: [...asProductLinkList(current[role]), ''] };
      const nextCheck = defaultProductLinkCheck();
      setProductLinkCheck(nextCheck);
      setDraft(formatProductLinks(next, nextCheck));
      return next;
    });
  }

  function removeProductLink(role, index) {
    setProductLinks((current) => {
      const currentList = asProductLinkList(current[role]);
      const nextList = currentList.filter((_, itemIndex) => itemIndex !== index);
      const next = { ...current, [role]: nextList.length ? nextList : [''] };
      const nextCheck = defaultProductLinkCheck();
      const content = formatProductLinks(next, nextCheck);
      setProductLinkCheck(nextCheck);
      setDraft(content);
      return next;
    });
  }

  function runProductLinkCheck() {
    const nextCheck = buildProductLinkCheck(productLinks, articleState.productLinkHistory || []);
    const content = formatProductLinks(productLinks, nextCheck);
    const hasInput = hasAnyProductLink(productLinks);
    setProductLinkCheck(nextCheck);
    setDraft(content);
    setLastSaveNotice({
      kind: !hasInput || nextCheck.primaryMatches.length || nextCheck.secondaryMatches.length ? 'error' : 'success',
      title: !hasInput ? '请先填写产品链接' : nextCheck.primaryMatches.length || nextCheck.secondaryMatches.length ? '发现产品链接重复' : '产品链接未发现重复',
      detail: nextCheck.resultText,
      currentContent: content,
    });
  }

  function updateGscSyncField(field, value) {
    setGscSyncState((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function syncGscSearchAnalytics() {
    const parsedClientId = Number(selectedProject.clientId);
    if (!Number.isInteger(parsedClientId) || parsedClientId <= 0) {
      setGscSyncState((current) => ({
        ...current,
        status: 'error',
        message: '当前项目没有绑定后端 client_id，不能同步 Search Console API。',
      }));
      return;
    }
    const siteUrl = String(gscSyncState.siteUrl || selectedProject.gscSiteUrl || selectedProject.siteUrl || '').trim();
    if (!siteUrl) {
      setGscSyncState((current) => ({
        ...current,
        status: 'error',
        message: '请先填写 Search Console 站点地址。URL 前缀资源通常是 https://www.xxx.com/，域名资源通常是 sc-domain:xxx.com。',
      }));
      return;
    }
    setGscSyncState((current) => ({
      ...current,
      status: 'loading',
      message: '正在同步 Search Console API 的 page + query 数据。',
    }));
    try {
      const response = await fetch(`${apiSettings.backendUrl || backendBaseUrl()}/clients/${parsedClientId}/gsc/sync-search-analytics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          site_url: siteUrl,
          date_start: gscSyncState.dateStart,
          date_end: gscSyncState.dateEnd,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.detail || `HTTP ${response.status}`);
      }
      setGscSyncState((current) => ({
        ...current,
        status: data.status === 'completed' ? 'ready' : 'empty',
        message: data.status === 'completed'
          ? `同步完成：已导入 ${data.row_count || 0} 条 Search Console API 行。`
          : data.message || 'Search Console API 已返回，但暂未导入有效关键词。',
        jobId: data.job_id || '',
        rowCount: data.row_count || 0,
        syncedAt: new Date().toLocaleString('zh-CN', { hour12: false }),
      }));
      setLastSaveNotice({
        kind: data.status === 'completed' ? 'success' : 'error',
        title: data.status === 'completed' ? 'GSC API 同步完成' : 'GSC API 没有有效数据',
        detail: data.status === 'completed'
          ? `任务 ${data.job_id} 已进入文章效果评分和关键词筛选链路。`
          : data.message || '请检查站点、日期范围或 Search Console 权限。',
      });
      await readGscKeywords();
    } catch (error) {
      const readableError = friendlyApiError(error.message);
      setGscSyncState((current) => ({
        ...current,
        status: 'error',
        message: readableError,
      }));
      setLastSaveNotice({
        kind: 'error',
        title: 'GSC API 同步失败',
        detail: readableError,
      });
    }
  }

  async function readGscKeywords() {
    setGscKeywordState((current) => ({
      ...current,
      status: 'loading',
      message: '正在读取 GSC API 文章效果关键词。',
    }));
    try {
      const params = new URLSearchParams();
      const parsedClientId = Number(selectedProject.clientId);
      if (Number.isInteger(parsedClientId) && parsedClientId > 0) {
        params.set('client_id', String(parsedClientId));
      } else {
        params.set('client_slug', selectedProject.name || selectedProject.id || selectedProject.siteUrl || '');
      }
      params.set('limit', '50');
      params.set('require_gsc_api', 'true');
      const response = await fetch(`${apiSettings.backendUrl || backendBaseUrl()}/api/gsc-keyword-candidates?${params.toString()}`);
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || `HTTP ${response.status}`);
      }
      const data = await response.json();
      const keywords = Array.isArray(data.keywords) ? data.keywords : [];
      const hasGscApiEvidence = Boolean(data.has_gsc_api_evidence);
      setGscKeywordState({
        status: keywords.length ? 'ready' : 'empty',
        message: keywords.length
          ? `GSC API：已读取 ${keywords.length} 个带文章效果证据的关键词。请选择主关键词和辅助关键词。`
          : '当前项目没有 GSC API 来源关键词。请先同步 Search Console API 后再选词。',
        keywords,
        fetchedAt: new Date().toLocaleString('zh-CN', { hour12: false }),
        source: keywords.length ? 'gsc_api' : '',
        hasGscApiEvidence,
        sourceLabel: keywords.length ? 'GSC API 数据' : '无 GSC API 数据',
      });
      setLastSaveNotice({
        kind: keywords.length ? 'success' : 'error',
        title: keywords.length ? 'GSC API 效果关键词已读取' : '暂无 GSC API 关键词',
        detail: keywords.length
          ? '这批关键词来自 Search Console API，并带有历史文章效果依据。'
          : '后端没有找到 Search Console API 同步记录，请先同步该项目 GSC API 数据。',
      });
    } catch (error) {
      const readableError = friendlyApiError(error.message);
      setGscKeywordState((current) => ({
        ...current,
        status: 'error',
        message: readableError,
        keywords: [],
        hasGscApiEvidence: false,
        sourceLabel: 'GSC API 读取失败',
      }));
      setLastSaveNotice({
        kind: 'error',
        title: 'GSC API 效果关键词读取失败',
        detail: readableError,
      });
    }
  }

  function applyKeywordCandidate(keyword, role) {
    const cleaned = String(keyword || '').trim();
    if (!cleaned) return;
    setTopicKeywordSelection((current) => {
      const secondary = Array.isArray(current.secondary) ? current.secondary.filter((item) => item !== cleaned) : [];
      const ignored = Array.isArray(current.ignored) ? current.ignored.filter((item) => item !== cleaned) : [];
      let next;
      if (role === 'main') {
        next = { ...current, main: cleaned, secondary, ignored };
      } else if (role === 'secondary') {
        next = { ...current, secondary: current.main === cleaned ? secondary : [...secondary, cleaned], ignored };
      } else {
        next = {
          ...current,
          main: current.main === cleaned ? '' : current.main,
          secondary,
          ignored: [...ignored, cleaned],
        };
      }
      setManualFields((fields) => ({ ...fields, keywords: formatSelectedKeywords(next) }));
      return next;
    });
    setDedupState((current) => ({ ...current, status: 'idle', suggestedAction: '关键词已调整，请重新运行主题/TDK排重。' }));
  }

  function runTopicTdkDedupCheck() {
    const nextState = summarizeTopicTdkDedup(articleState, draft, manualFields, productLinks, topicKeywordSelection);
    setDedupState(nextState);
    setLastSaveNotice({
      kind: nextState.riskLevel === 'high' || nextState.riskLevel === 'unknown' ? 'error' : 'success',
      title: nextState.riskLevel === 'low' ? '主题/TDK排重通过' : '主题/TDK排重已检查',
      detail: '已检查主题和关键词组合。',
      currentContent: formatTopicTdkSaveContent(draft, topicKeywordSelection, nextState),
    });
  }

  function updateProductCandidateBoardUrl(value) {
    setProductCandidateState((current) => ({
      ...current,
      boardUrl: value,
      status: current.status === 'error' ? 'idle' : current.status,
      message: current.status === 'error' ? 'URL 已修改，可以重新读取该板块产品。' : current.message,
    }));
  }

  async function readProductCandidatesFromBoard() {
    const boardUrl = productCandidateState.boardUrl.trim();
    if (!boardUrl) {
      setProductCandidateState((current) => ({
        ...current,
        status: 'error',
        message: '请先填写板块 URL，例如产品类目页或系列页。',
      }));
      setLastSaveNotice({
        kind: 'error',
        title: '无法读取板块产品',
        detail: '请先填写板块 URL。',
      });
      return;
    }
    const startedAt = Date.now();
    const progressTimer = runProgress(PRODUCT_CANDIDATE_STAGES, startedAt, PRODUCT_CANDIDATE_STAGES[0]);
    setProductCandidateState((current) => ({
      ...current,
      status: 'loading',
      message: '正在读取板块页面并提取候选产品链接，这一步不调用 API。',
    }));
    try {
      const response = await fetch(`${apiSettings.backendUrl || backendBaseUrl()}/api/product-link-candidates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section_url: boardUrl, limit: 60 }),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || `HTTP ${response.status}`);
      }
      const data = await response.json();
      const candidates = Array.isArray(data.candidates) ? data.candidates : [];
      setProductCandidateState({
        boardUrl,
        status: candidates.length ? 'ready' : 'empty',
        message: candidates.length
          ? `已读取 ${candidates.length} 个候选产品链接。API 推荐时会优先且只能从这些候选里选择。`
          : '没有读取到具体产品链接。请确认该页面是否真的列出了产品页，或换一个更具体的类目页。',
        candidates,
        fetchedAt: new Date().toLocaleString('zh-CN', { hour12: false }),
      });
      setGenerationProgress({
        running: false,
        percent: 100,
        label: PRODUCT_CANDIDATE_STAGES[PRODUCT_CANDIDATE_STAGES.length - 1],
        elapsed: Math.max(1, Math.round((Date.now() - startedAt) / 1000)),
        estimate: 0,
      });
      setLastSaveNotice({
        kind: candidates.length ? 'success' : 'error',
        title: candidates.length ? '板块产品已读取' : '未读取到产品候选',
        detail: candidates.length ? `候选池共 ${candidates.length} 个链接，下一步可让 API 从候选池挑主/辅产品。` : '请换一个具体产品列表页，或手动补充产品链接。',
      });
    } catch (error) {
      const readableError = friendlyApiError(error.message);
      setProductCandidateState((current) => ({
        ...current,
        status: 'error',
        message: readableError,
        candidates: [],
      }));
      setGenerationProgress({
        running: false,
        percent: 0,
        label: `读取失败：${readableError}`,
        elapsed: Math.max(1, Math.round((Date.now() - startedAt) / 1000)),
        estimate: 0,
      });
      setLastSaveNotice({
        kind: 'error',
        title: '读取板块产品失败',
        detail: readableError,
      });
    } finally {
      window.clearInterval(progressTimer);
    }
  }

  async function recommendProductLinksByApi(extraInstruction = '') {
    setApiStatus({ kind: 'running', text: 'API 正在推荐产品链接' });
    const startedAt = Date.now();
    const progressTimer = runProgress(API_PRODUCT_LINK_STAGES, startedAt, API_PRODUCT_LINK_STAGES[0]);
    try {
      const data = await callBackendGenerate(buildProductLinkPrompt(extraInstruction), 'workspace_product_link_recommendation');
      const text = repairMojibake(data.text || '');
      const urls = extractUrls(text);
      const decisions = Object.fromEntries(urls.map((url) => [url, 'pending']));
      setProductLinkSuggestions({ text, urls, decisions, rejectionNotes: {} });
      const content = [
        formatProductLinks(productLinks, productLinkCheck),
        '',
        'API 产品链接建议：',
        text || 'API 没有返回建议。',
      ].join('\n');
      setDraft(content);
      setGenerationProgress({
        running: false,
        percent: 100,
        label: API_PRODUCT_LINK_STAGES[API_PRODUCT_LINK_STAGES.length - 1],
        elapsed: Math.max(1, Math.round((Date.now() - startedAt) / 1000)),
        estimate: 0,
      });
      setApiStatus({ kind: 'ready', text: `产品链接建议完成：${data.provider} / ${data.model}` });
      setLastSaveNotice({
        kind: 'success',
        title: 'API 产品链接建议已生成',
        detail: urls.length ? `识别到 ${urls.length} 个 URL，可一键设为主/辅助产品链接。` : '未识别到 URL，请根据建议人工填写。',
        currentContent: content,
      });
    } catch (error) {
      const readableError = friendlyApiError(error.message);
      setGenerationProgress({
        running: false,
        percent: 0,
        label: `产品链接 API 失败：${readableError}`,
        elapsed: Math.max(1, Math.round((Date.now() - startedAt) / 1000)),
        estimate: 0,
      });
      setApiStatus({ kind: 'error', text: `产品链接 API 失败：${readableError}` });
      setLastSaveNotice({
        kind: 'error',
        title: '产品链接 API 失败',
        detail: readableError,
      });
    } finally {
      window.clearInterval(progressTimer);
    }
  }

  function applyProductLinkSuggestion(role, url) {
    const currentUrls = filledProductLinks(productLinks[role]);
    const nextRoleUrls = currentUrls.includes(url) ? currentUrls : [...currentUrls, url];
    const next = { ...productLinks, [role]: nextRoleUrls.length ? nextRoleUrls : [''] };
    const nextCheck = defaultProductLinkCheck();
    setProductLinks(next);
    setProductLinkCheck(nextCheck);
    setDraft(formatProductLinks(next, nextCheck));
    setLastSaveNotice({
      kind: 'success',
      title: role === 'primary' ? '已设为主产品链接' : '已设为辅助产品链接',
      detail: '最后点击“确认当前内容”才会保存进记录。',
      currentContent: formatProductLinks(next, nextCheck),
    });
  }

  function saveAcceptedProductLinksFromSuggestions(suggestions, detail = '已接受 API 推荐。') {
    const nextLinks = inferProductLinksFromSuggestions(suggestions);
    const nextCheck = defaultProductLinkCheck();
    const content = formatProductLinks(nextLinks, nextCheck);
    const acceptedUrls = (suggestions.urls || []).filter((url) => suggestions.decisions?.[url] !== 'rejected');
    const rejectedUrls = (suggestions.urls || []).filter((url) => suggestions.decisions?.[url] === 'rejected');
    setProductLinks(nextLinks);
    setProductLinkCheck(nextCheck);
    appendProjectPreferenceMemory(selectedProjectId, {
      title: '本轮产品链接确认',
      summary: [
        `已接受 ${acceptedUrls.length} 条推荐链接`,
        rejectedUrls.length ? `已拒绝 ${rejectedUrls.length} 条推荐链接` : '未拒绝推荐链接',
        `主产品链接：${formatProductLinksInline(nextLinks.primary)}`,
        `辅助产品链接：${formatProductLinksInline(nextLinks.secondary)}`,
      ].join('；'),
      category: 'product_links',
    });
    setSelectedStepKey('product_links');
    setDraft(content);
    setManualFields(articleState.stepStructuredFields?.product_links || emptyStructuredFields(visibleSteps.find((step) => step.key === 'product_links')));
    setLastSaveNotice({
      kind: 'success',
      title: 'API 推荐已接受',
      detail: `${detail}请点击“确认当前内容”保存本轮产品链接，或者继续修改后再确认。`,
      currentContent: content,
    });
  }

  function acceptAllProductSuggestions() {
    if (!productLinkSuggestions.urls.length) {
      setLastSaveNotice({
        kind: 'error',
        title: '没有可接受的 API 推荐',
        detail: '请先运行 API 推荐产品链接。',
      });
      return;
    }
    const nextSuggestions = {
      ...productLinkSuggestions,
      decisions: Object.fromEntries(productLinkSuggestions.urls.map((url) => [
        url,
        productLinkSuggestions.decisions?.[url] === 'rejected' ? 'rejected' : 'accepted',
      ])),
    };
    setProductLinkSuggestions(nextSuggestions);
    saveAcceptedProductLinksFromSuggestions(nextSuggestions, '所有 API 推荐链接已标记为接受。');
  }

  function updateProductSuggestionDecision(url, decision) {
    const nextSuggestions = {
      ...productLinkSuggestions,
      decisions: {
        ...(productLinkSuggestions.decisions || {}),
        [url]: decision,
      },
    };
    setProductLinkSuggestions(nextSuggestions);
    if (nextSuggestions.urls.length && nextSuggestions.urls.every((item) => nextSuggestions.decisions[item] === 'accepted')) {
      saveAcceptedProductLinksFromSuggestions(nextSuggestions, '所有 API 推荐链接均已接受。');
    }
  }

  function updateProductSuggestionNote(url, note) {
    setProductLinkSuggestions((current) => ({
      ...current,
      rejectionNotes: {
        ...(current.rejectionNotes || {}),
        [url]: note,
      },
    }));
  }

  function saveProductSuggestionNote(url) {
    appendProjectPreferenceMemory(selectedProjectId, {
      title: '本轮拒绝 API 推荐',
      summary: `拒绝链接：${url}；原因：${productLinkSuggestions.rejectionNotes?.[url] || '未填写，请在下一轮继续补充。'}`,
      category: 'product_links',
    });
    setLastSaveNotice({
      kind: 'success',
      title: '拒绝原因已保存',
      detail: `已记录：${productLinkSuggestions.rejectionNotes?.[url] || '未填写具体原因'}`,
    });
  }

  async function regenerateProductLinksFromRejected() {
    const rejectedUrls = (productLinkSuggestions.urls || []).filter((url) => productLinkSuggestions.decisions?.[url] === 'rejected');
    if (!rejectedUrls.length) {
      setLastSaveNotice({
        kind: 'error',
        title: '没有被拒绝的链接',
        detail: '请先拒绝不合适的 API 推荐链接，并填写原因。',
      });
      return;
    }
    const instruction = [
      '以下 API 推荐链接被人工拒绝，请根据原因重新推荐主产品链接和辅助产品链接。',
      ...rejectedUrls.map((url) => `拒绝链接：${url}\n拒绝原因：${productLinkSuggestions.rejectionNotes?.[url] || '未填写，请结合近 4 篇重复和文章主题重新判断'}`),
      '请不要再次推荐已被拒绝且没有新理由支持的链接。',
    ].join('\n');
    await recommendProductLinksByApi(instruction);
  }

  async function runDedupApiReview() {
    const stateForReview = dedupState.status === 'idle' ? summarizeDedupPrecheck(articleState) : dedupState;
    if (!stateForReview.candidates.length) {
      setLastSaveNotice({
        kind: 'success',
        title: '无需调用 API',
        detail: '历史库未筛出疑似重复项，当前排重已通过。',
        currentContent: stateForReview.decision || '无明显重复，可继续下一步。',
      });
      setDedupState({ ...stateForReview, riskLevel: 'low', suggestedAction: '低风险：无疑似项，不调用 API' });
      return;
    }
    setApiStatus({ kind: 'running', text: 'API 正在判断疑似重复项' });
    const startedAt = Date.now();
    const progressTimer = runProgress(API_DEDUP_STAGES, startedAt, API_DEDUP_STAGES[0]);
    try {
      const data = await callBackendGenerate(buildDedupPrompt(stateForReview), 'workspace_dedup_review');
      const apiDecision = repairMojibake(data.text || '');
      const nextState = {
        ...stateForReview,
        status: 'api_reviewed',
        apiUsed: true,
        decision: apiDecision,
        suggestedAction: '已由 API 判断疑似项，请按结论决定继续或返回选题/TDK',
      };
      setDedupState(nextState);
      setDraft(apiDecision);
      setLastSaveNotice({
        kind: 'success',
        title: 'API 排重判断已生成',
        detail: `只发送 ${stateForReview.apiInputPreview.length} 条疑似历史文章，节省 token`,
        currentContent: apiDecision,
      });
      setGenerationProgress({
        running: false,
        percent: 100,
        label: API_DEDUP_STAGES[API_DEDUP_STAGES.length - 1],
        elapsed: Math.max(1, Math.round((Date.now() - startedAt) / 1000)),
        estimate: 0,
      });
      setApiStatus({ kind: 'ready', text: `排重判断完成：${data.provider} / ${data.model}` });
    } catch (error) {
      const readableError = friendlyApiError(error.message);
      setGenerationProgress({
        running: false,
        percent: 0,
        label: `排重 API 失败：${readableError}`,
        elapsed: Math.max(1, Math.round((Date.now() - startedAt) / 1000)),
        estimate: 0,
      });
      setApiStatus({ kind: 'error', text: `排重 API 失败：${readableError}` });
      setLastSaveNotice({
        kind: 'error',
        title: 'API 排重失败',
        detail: readableError,
      });
    } finally {
      window.clearInterval(progressTimer);
    }
  }

  function returnToTopicTdk() {
    selectStep('topic_tdk');
    setLastSaveNotice({
      kind: 'error',
      title: '已返回选题/TDK',
      detail: '请修改主题、关键词组合或产品链接后，再进入排重。',
    });
  }

  function allowDedupException() {
    const reason = editReason.trim();
    if (!reason) {
      setLastSaveNotice({
        kind: 'error',
        title: '无法确认特殊情况',
        detail: '请填写为什么允许重复，例如角度不同、买家阶段不同或产品承接不同。',
      });
      return;
    }
    const previousContent = articleState.stepContents[selectedStepKey] || '';
    const decision = [
      '特殊情况人工确认：允许继续。',
      `确认原因：${reason}`,
      '注意：该原因会进入历史库，后续排重会参考这次判断。',
    ].join('\n');
    const revision = {
      id: `${selectedStepKey}-${Date.now()}`,
      stepKey: selectedStepKey,
      type: revisionType,
      source: 'manual',
      action: 'modify',
      reason,
      createdAt: new Date().toLocaleString('zh-CN', { hour12: false }),
      previousContent,
      newContent: decision,
      previousSummary: previewText(previousContent),
      newSummary: previewText(decision),
      summary: `${selectedStep.label} 特殊情况确认：${previewText(decision)}`,
    };
    setDedupState((current) => ({
      ...current,
      status: 'allowed_exception',
      riskLevel: 'medium',
      suggestedAction: '人工确认特殊情况，允许继续下一步',
      decision,
    }));
    setDraft(decision);
    setArticleState((current) => ({
      ...current,
      stepContents: {
        ...current.stepContents,
        [selectedStepKey]: decision,
      },
      revisions: [
        ...current.revisions,
        revision,
      ],
    }));
    setLastSaveNotice({
      kind: 'success',
      title: '特殊情况已确认',
      detail: `${revision.createdAt} · ${revision.summary}`,
      reason,
      currentContent: decision,
      previousContent,
      previousSummary: revision.previousSummary,
      newSummary: revision.newSummary,
    });
    setEditReason('');
  }

  async function testGenerate() {
    setApiStatus({ kind: 'running', text: '正在测试 API' });
    try {
      const data = await callBackendGenerate(buildStepPrompt(true), 'workspace_api_test');
      setDraft(repairMojibake(data.text || '测试成功，但模型没有返回正文。'));
      setApiStatus({ kind: 'ready', text: `测试成功：${data.provider} / ${data.model}` });
    } catch (error) {
      setApiStatus({ kind: 'error', text: `测试失败：${error.message}` });
    }
  }

  function generateManualHint() {
    setInteractionMode('manual');
    setDraft(formatStructuredFields(selectedStep, manualFields));
  }

  function updateManualField(key, value) {
    setManualFields((current) => {
      const next = { ...current, [key]: value };
      setDraft(formatStructuredFields(selectedStep, next));
      return next;
    });
  }

  function markConfirm() {
    const saved = saveRevision('confirm', interactionMode === 'api' ? 'api' : 'manual');
    if (!saved) return;
    setArticleState((current) => ({
      ...current,
      stepStatus: {
        ...current.stepStatus,
        [selectedStepKey]: 'done',
      },
    }));
    if (selectedStepKey === 'product_links') {
      appendProjectPreferenceMemory(selectedProjectId, {
        title: '最终产品链接偏好',
        summary: `主产品链接：${formatProductLinksInline(productLinks.primary)}；辅助产品链接：${formatProductLinksInline(productLinks.secondary)}。`,
        category: 'product_links',
      });
    }
  }

  function markModify() {
    saveRevision('modify', interactionMode === 'api' ? 'api' : 'manual');
  }

  return (
    <div className="seo-workspace">
      <header className="seo-workspace-hero">
        <div className="seo-hero-copy">
          <Badge variant="outline">Storybook UI Prototype</Badge>
          <h1>SEO 文章写作工作台</h1>
          <p>项目 → 现阶段 → 具体步骤创作区。所有确认和修改都保留记录，不覆盖旧版本。</p>
        </div>
        <div className="seo-hero-metrics">
          <Card className="seo-metric-card" size="sm">
            <CardContent>
              <Layers3 className="seo-metric-icon" />
              <span>项目</span>
              <strong>{workspaceStats.projects}</strong>
            </CardContent>
          </Card>
          <Card className="seo-metric-card" size="sm">
            <CardContent>
              <FileText className="seo-metric-icon" />
              <span>文章</span>
              <strong>{workspaceStats.articles}</strong>
            </CardContent>
          </Card>
          <Card className="seo-metric-card" size="sm">
            <CardContent>
              <Clock3 className="seo-metric-icon" />
              <span>进行中</span>
              <strong>{workspaceStats.inProgress}</strong>
            </CardContent>
          </Card>
          <Card className="seo-metric-card" size="sm">
            <CardContent>
              <CheckCircle2 className="seo-metric-icon" />
              <span>完成</span>
              <strong>{workspaceStats.completed}</strong>
            </CardContent>
          </Card>
        </div>
        <div className="seo-status-legend">
          <Badge variant="outline"><i className="seo-dot seo-dot--done" />完成</Badge>
          <Badge variant="outline"><i className="seo-dot seo-dot--current" />当前</Badge>
          <Badge variant="outline"><i className="seo-dot seo-dot--todo" />待开始</Badge>
        </div>
      </header>

      <ApiSettingsPanel
        settings={apiSettings}
        status={apiStatus}
        onChange={updateApiSettings}
        onSave={saveApiSettings}
        onTestGenerate={testGenerate}
      />

      <div className="seo-home-grid">
        <ProjectList projects={workspace.projects} selectedProjectId={selectedProjectId} onSelectProject={selectProject} />
        <div className="seo-stage-stack">
          <ArticleFlow article={articleState} steps={visibleSteps} onStepSelect={selectStep} />
          <StepEditor
            project={selectedProject}
            article={articleState}
            step={selectedStep}
            status={articleState.stepStatus[selectedStepKey]}
            draft={draft}
            interactionMode={interactionMode}
            apiInstruction={apiInstruction}
            generationProgress={generationProgress}
            manualFields={manualFields}
            manualFieldDefs={structuredFieldsForStep(selectedStep)}
            lastSaveNotice={lastSaveNotice}
            editReason={editReason}
            revisionType={revisionType}
            dedupState={dedupState}
            productLinks={productLinks}
            productLinkHistory={articleState.productLinkHistory || []}
            productLinkCheck={productLinkCheck}
            productLinkSuggestions={productLinkSuggestions}
            productCandidateState={productCandidateState}
            gscSyncState={gscSyncState}
            gscKeywordState={gscKeywordState}
            topicKeywordSelection={topicKeywordSelection}
            projectPreferenceMemory={selectedProjectPreferenceMemory}
            onDraftChange={setDraft}
            onInteractionModeChange={setInteractionMode}
            onApiInstructionChange={setApiInstruction}
            onManualFieldChange={updateManualField}
            onReasonChange={setEditReason}
            onRevisionTypeChange={setRevisionType}
            onApiGenerate={generateApiDraft}
            onApiRewrite={apiRewriteDraft}
            onManualMode={generateManualHint}
            onDedupPrecheck={runDedupPrecheck}
            onDedupApiReview={runDedupApiReview}
            onReturnTopicTdk={returnToTopicTdk}
            onDedupAllowException={allowDedupException}
            onProductLinkChange={updateProductLink}
            onProductLinkAdd={addProductLink}
            onProductLinkRemove={removeProductLink}
            onProductLinkCheck={runProductLinkCheck}
            onProductCandidateBoardUrlChange={updateProductCandidateBoardUrl}
            onReadProductCandidates={readProductCandidatesFromBoard}
            onApplyProductCandidate={applyProductLinkSuggestion}
            onProductLinkApiRecommend={recommendProductLinksByApi}
            onApplyProductSuggestion={applyProductLinkSuggestion}
            onAcceptAllProductSuggestions={acceptAllProductSuggestions}
            onProductSuggestionDecision={updateProductSuggestionDecision}
            onProductSuggestionNoteChange={updateProductSuggestionNote}
            onProductSuggestionNoteSave={saveProductSuggestionNote}
            onRegenerateProductSuggestions={regenerateProductLinksFromRejected}
            onGscSyncFieldChange={updateGscSyncField}
            onSyncGscSearchAnalytics={syncGscSearchAnalytics}
            onReadGscApiKeywords={readGscKeywords}
            onKeywordCandidateDecision={applyKeywordCandidate}
            onTopicTdkDedupCheck={runTopicTdkDedupCheck}
            onConfirm={markConfirm}
            onModify={markModify}
          />
        </div>
      </div>

      <section className="seo-panel">
        <h2>单篇文章流程</h2>
        <div className="seo-step-list">
          {visibleSteps.map((step) => (
            <StepCard
              key={step.key}
              step={step}
              status={articleState.stepStatus[step.key]}
              content={articleState.stepContents[step.key]}
              isOpen={step.key === selectedStepKey}
              onSelect={() => selectStep(step.key)}
              onGenerateApi={generateApiDraft}
              onGenerateGuide={generateManualHint}
              onSaveDraft={() => saveRevision('modify', 'manual')}
            />
          ))}
        </div>
      </section>

      <RevisionPanel revisions={articleState.revisions.filter((revision) => revision.stepKey === selectedStepKey)} />
    </div>
  );
}
