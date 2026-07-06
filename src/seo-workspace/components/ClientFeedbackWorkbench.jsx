import React from 'react';

const SAMPLE_DOCX_PATH = '';

const SAMPLE_REPORT = {
  documentTitle: 'How to Choose a Mixing Tank Agitator for Deep Tanks?',
  formalInsertions: 1,
  formalDeletions: 1,
  comments: 3,
  visualDeletions: 4,
  visualInsertions: 2,
  excludedLinks: 5,
  suspiciousFormats: 1,
};

const SAMPLE_CHANGES = [
  {
    id: 'change-visual-1',
    type: '红色删除线 + 蓝色新增',
    section: 'Why Does Deep-Tank Mixing Become a Procurement Risk?',
    deletedText: 'These signs should be reviewed together before the agitator is treated as a simple motor-size purchase.',
    insertedText: 'Review these signs together before you treat the agitator as a simple motor-size purchase.',
    context: 'Deep-tank procurement risk usually appears in three connected places: batch quality, circulation path, and early model selection.',
    status: '代码已识别',
  },
  {
    id: 'change-comment-1',
    type: '批注',
    section: 'Bottom Dead Zones From Poor Circulation',
    deletedText: '',
    insertedText: '',
    commentText: 'Solids may settle near the wall or cone. If the bottom turnover is not strong enough, the discharge line can carry uneven material.',
    context: 'Poor circulation causes concentration gradients, solid settling, and dead zones near the tank bottom or wall.',
    status: '代码已识别',
  },
  {
    id: 'change-revision-1',
    type: 'Word 正式删除 + 插入',
    section: 'How Does Example Brand Extra Long Agitator Handle Deep-Tank Chemical Projects?',
    deletedText: 'The industry may be different, but the attention to slurry movement, suspension, and mechanical stability is useful when a slurry agitator must work across a high liquid level.',
    insertedText: 'Designed for the demanding conditions of mineral processing and nonferrous metallurgy, it addresses the same core challenges: maintaining uniform slurry movement, preventing solids settlement, and sustaining structural integrity under continuous, high-torque operation.',
    context: 'For solids-heavy duties, buyers can also review Example Brand experience with Agitator for Nonferrous Industry and Beneficiation.',
    status: '代码已识别',
  },
];

const SAMPLE_PARAGRAPHS = [
  {
    id: 'p-title',
    kind: 'heading',
    segments: [{ text: 'How to Choose a Mixing Tank Agitator for Deep Tanks?', type: 'normal' }],
  },
  {
    id: 'p-intro',
    kind: 'paragraph',
    segments: [
      {
        text: 'Deep tanks and high-liquid-level vessels can turn normal mixing problems into expensive production issues. A mixing tank agitator must prevent uneven concentration, slurry settling, dead zones, heat-transfer imbalance, and shaft vibration.',
        type: 'normal',
      },
    ],
  },
  {
    id: 'p-risk-heading',
    kind: 'heading',
    segments: [{ text: 'Why Does Deep-Tank Mixing Become a Procurement Risk?', type: 'normal' }],
  },
  {
    id: 'p-risk',
    kind: 'paragraph',
    segments: [
      {
        text: 'Deep-tank procurement risk usually appears in three connected places: batch quality, circulation path, and early model selection. ',
        type: 'normal',
      },
      {
        text: 'These signs should be reviewed together before the agitator is treated as a simple motor-size purchase.',
        type: 'visual-delete',
        changeId: 'change-visual-1',
      },
      {
        text: ' ',
        type: 'normal',
      },
      {
        text: 'Review these signs together before you treat the agitator as a simple motor-size purchase.',
        type: 'visual-insert',
        changeId: 'change-visual-1',
      },
    ],
  },
  {
    id: 'p-bottom-heading',
    kind: 'heading',
    segments: [{ text: 'Bottom Dead Zones From Poor Circulation', type: 'normal' }],
  },
  {
    id: 'p-bottom',
    kind: 'paragraph',
    segments: [
      {
        text: 'Poor circulation causes concentration gradients, solid settling, and dead zones near the tank bottom or wall. ',
        type: 'normal',
      },
      {
        text: 'Solids may settle near the wall or cone, and the discharge line can carry uneven material if bottom turnover is not strong enough.',
        type: 'comment',
        changeId: 'change-comment-1',
      },
    ],
  },
  {
    id: 'p-product-heading',
    kind: 'heading',
    segments: [{ text: 'How Does Example Brand Extra Long Agitator Handle Deep-Tank Chemical Projects?', type: 'normal' }],
  },
  {
    id: 'p-product',
    kind: 'paragraph',
    segments: [
      {
        text: 'For solids-heavy duties, buyers can also review Example Brand experience with ',
        type: 'normal',
      },
      {
        text: 'Agitator for Nonferrous Industry and Beneficiation',
        type: 'link',
      },
      {
        text: '. ',
        type: 'normal',
      },
      {
        text: 'The industry may be different, but the attention to slurry movement, suspension, and mechanical stability is useful when a slurry agitator must work across a high liquid level.',
        type: 'formal-delete',
        changeId: 'change-revision-1',
      },
      {
        text: ' Designed for the demanding conditions of mineral processing and nonferrous metallurgy, it addresses the same core challenges: maintaining uniform slurry movement, preventing solids settlement, and sustaining structural integrity under continuous, high-torque operation.',
        type: 'formal-insert',
        changeId: 'change-revision-1',
      },
    ],
  },
];

const markLabels = {
  delete: '删除内容',
  insert: '新增内容',
  comment: '批注相关',
  normal: '普通正文',
  link: '普通链接',
};

function backendBaseUrl() {
  return window.localStorage.getItem('seoWorkspace.backendUrl') || 'http://127.0.0.1:8000';
}

function shortText(text, maxLength = 120) {
  const cleaned = String(text || '').replace(/\s+/g, ' ').trim();
  return cleaned.length > maxLength ? `${cleaned.slice(0, maxLength)}...` : cleaned;
}

function buildApiPrompt({ selectedText, selectedChange, apiInstruction, selectedMark }) {
  return [
    '请作为 Word 客户回稿修改识别助手，判断选中文本是否属于客户修改痕迹。',
    '重点识别：正式修订、批注、红色删除线、蓝色新增文字；普通超链接不要误判为新增。',
    '',
    `选中文本：${selectedText || '未选择'}`,
    selectedMark ? `人工预标记：${markLabels[selectedMark] || selectedMark}` : '人工预标记：无',
    selectedChange ? `代码当前识别类型：${selectedChange.type}` : '代码当前识别类型：未命中已有修改记录',
    selectedChange ? `所在位置：${selectedChange.section}` : '',
    selectedChange?.deletedText ? `删除内容：${selectedChange.deletedText}` : '',
    selectedChange?.insertedText ? `新增内容：${selectedChange.insertedText}` : '',
    selectedChange?.commentText ? `批注内容：${selectedChange.commentText}` : '',
    selectedChange?.context ? `局部上下文：${selectedChange.context}` : '',
    `用户补充说明：${apiInstruction || '无'}`,
    '',
    '请输出：1. 是否应加入修改记录；2. 应标记为什么类型；3. 代码可能漏读的原因；4. 是否建议沉淀为客户写作规则。',
  ].filter(Boolean).join('\n');
}

export function ClientFeedbackWorkbench() {
  const [docxPath, setDocxPath] = React.useState(SAMPLE_DOCX_PATH);
  const [selectedFile, setSelectedFile] = React.useState(null);
  const [loaded, setLoaded] = React.useState(false);
  const [previewHtml, setPreviewHtml] = React.useState('');
  const [visualPreview, setVisualPreview] = React.useState(null);
  const [previewMode, setPreviewMode] = React.useState('html');
  const [report, setReport] = React.useState(SAMPLE_REPORT);
  const [changes, setChanges] = React.useState(SAMPLE_CHANGES);
  const [activeChangeId, setActiveChangeId] = React.useState('');
  const [selectedText, setSelectedText] = React.useState('');
  const [selectedMark, setSelectedMark] = React.useState('');
  const [apiInstruction, setApiInstruction] = React.useState('');
  const [apiResult, setApiResult] = React.useState('');
  const [apiStatus, setApiStatus] = React.useState({ kind: 'idle', text: '等待分析' });
  const [acceptedChanges, setAcceptedChanges] = React.useState([]);
  const [activePanel, setActivePanel] = React.useState('report');
  const previewFrameRef = React.useRef(null);

  const activeChange = changes.find((item) => item.id === activeChangeId) || null;

  async function loadDocument() {
    setApiStatus({ kind: 'running', text: '正在读取 Word 并生成预览' });
    try {
      let response;
      if (selectedFile) {
        const formData = new FormData();
        formData.append('reviewed', selectedFile);
        response = await fetch(`${backendBaseUrl()}/api/client-feedback/docx-preview/upload`, {
          method: 'POST',
          body: formData,
        });
      } else {
        response = await fetch(`${backendBaseUrl()}/api/client-feedback/docx-preview`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: docxPath.trim() }),
        });
      }
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || `HTTP ${response.status}`);
      }
      const data = await response.json();
      const nextChanges = data.changes || [];
      const nextVisualPreview = data.visual_preview || null;
      setPreviewHtml(data.preview_html || '');
      setVisualPreview(nextVisualPreview);
      setPreviewMode(nextVisualPreview?.status === 'ready' && nextVisualPreview?.preview_url ? 'visual' : 'html');
      setReport(data.report || SAMPLE_REPORT);
      setChanges(nextChanges);
      setLoaded(true);
      setActivePanel('report');
      setActiveChangeId(nextChanges[0]?.id || '');
      setSelectedText('');
      setSelectedMark('');
      setApiInstruction('');
      setApiResult('');
      setApiStatus({ kind: 'ready', text: 'Word 预览已生成，未调用 API' });
    } catch (error) {
      setLoaded(false);
      setVisualPreview(null);
      setPreviewMode('html');
      setApiStatus({ kind: 'error', text: `读取失败：${error.message}` });
    }
  }

  function captureSelectionFromFrame(frameDocument) {
    const text = frameDocument?.getSelection()?.toString().trim() || '';
    if (text) {
      setSelectedText(text);
      setActivePanel('api');
    }
  }

  function selectedMarkFromClass(className) {
    if (className.includes('delete')) return 'delete';
    if (className.includes('insert')) return 'insert';
    if (className.includes('comment')) return 'comment';
    if (className.includes('link')) return 'link';
    return 'normal';
  }

  function handlePreviewFrameLoad(event) {
    const frameDocument = event.currentTarget.contentDocument;
    if (!frameDocument) return;
    frameDocument.addEventListener('mouseup', () => captureSelectionFromFrame(frameDocument));
    frameDocument.addEventListener('click', (clickEvent) => {
      const target = clickEvent.target?.closest?.('[data-change-id]');
      if (!target) return;
      const changeId = target.getAttribute('data-change-id') || '';
      const text = target.textContent?.trim() || '';
      setActiveChangeId(changeId);
      setSelectedText(text);
      setSelectedMark(selectedMarkFromClass(target.className || ''));
      setActivePanel('api');
    });
  }

  function acceptCurrentEvidence(source = 'manual') {
    const text = selectedText || activeChange?.insertedText || activeChange?.deletedText || '';
    if (!text) return;
    const next = {
      id: `${source}-${Date.now()}`,
      source,
      mark: selectedMark || 'normal',
      text,
      instruction: apiInstruction,
      apiResult,
      changeId: activeChange?.id || '',
    };
    setAcceptedChanges((current) => [next, ...current]);
    setApiStatus({ kind: 'ready', text: source === 'api' ? 'API 结果已接受为修改记录' : '人工标记已加入修改记录' });
  }

  async function analyzeSelectionByApi() {
    const text = selectedText || activeChange?.deletedText || activeChange?.insertedText || '';
    if (!text) {
      setApiStatus({ kind: 'error', text: '请先在左侧选中文本，或点击一条已识别修改。' });
      return;
    }
    setApiStatus({ kind: 'running', text: 'API 正在分析选中文本' });
    const prompt = buildApiPrompt({ selectedText: text, selectedChange: activeChange, apiInstruction, selectedMark });
    try {
      const response = await fetch(`${backendBaseUrl()}/api/llm/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purpose: 'client_feedback_selection_review', prompt }),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || `HTTP ${response.status}`);
      }
      const data = await response.json();
      setApiResult(data.text || 'API 未返回分析内容。');
      setApiStatus({ kind: 'ready', text: `API 分析完成：${data.provider || 'provider'} / ${data.model || 'model'}` });
    } catch (error) {
      const fallback = [
        'API 暂不可用，以下为本地预览分析：',
        selectedMark === 'delete'
          ? '这段可先标记为删除内容。如果它有红色删除线，后端解析器应记录为 visual_delete。'
          : selectedMark === 'insert'
            ? '这段可先标记为新增内容。如果它是蓝色且不是超链接，后端解析器应记录为 visual_insert。'
            : '请结合颜色、删除线、批注范围和上下文确认它是否属于客户修改。',
        apiInstruction ? `你的说明：${apiInstruction}` : '',
      ].filter(Boolean).join('\n');
      setApiResult(fallback);
      setApiStatus({ kind: 'error', text: `API 暂不可用：${error.message}` });
    }
  }

  return (
    <div className="seo-workspace seo-feedback-workspace">
      <section className="seo-feedback-split">
        <main className="seo-feedback-doc">
          {loaded ? (
            <>
              <div className="seo-feedback-preview-toolbar">
                <div>
                  <button
                    type="button"
                    className={previewMode === 'visual' ? 'is-active' : ''}
                    disabled={visualPreview?.status !== 'ready' || !visualPreview?.preview_url}
                    onClick={() => setPreviewMode('visual')}
                  >
                    版式预览
                  </button>
                  <button
                    type="button"
                    className={previewMode === 'html' ? 'is-active' : ''}
                    onClick={() => setPreviewMode('html')}
                  >
                    可选文本
                  </button>
                </div>
                <span className={`seo-api-status seo-api-status--${visualPreview?.status === 'ready' ? 'ready' : 'idle'}`}>
                  {visualPreview?.status === 'ready'
                    ? `${visualPreview.label || '版式预览'}：${visualPreview.message || '已生成'}`
                    : visualPreview?.message || '可选文本预览已生成'}
                </span>
              </div>

              {previewMode === 'visual' && visualPreview?.status === 'ready' && visualPreview?.preview_url ? (
                visualPreview.kind === 'pdf' ? (
                  <iframe
                    title="Word PDF 版式预览"
                    className="seo-feedback-preview-frame seo-feedback-preview-frame--visual"
                    src={`${backendBaseUrl()}${visualPreview.preview_url}`}
                  />
                ) : (
                  <div className="seo-feedback-visual-preview">
                    <img src={`${backendBaseUrl()}${visualPreview.preview_url}`} alt="Word 图片版式预览" />
                  </div>
                )
              ) : (
                <iframe
                  ref={previewFrameRef}
                  title="Word 可选文本预览"
                  className="seo-feedback-preview-frame"
                  srcDoc={previewHtml}
                  onLoad={handlePreviewFrameLoad}
                />
              )}
            </>
          ) : (
            <div className="seo-feedback-empty-doc">
              <h1>Word 原文预览</h1>
              <p>右侧选择 Word 文件后点击“读取 Word 修改”，这里显示与原 Word 尽量一致的原文和修改痕迹。</p>
            </div>
          )}
        </main>

        <aside className="seo-feedback-side">
          <div className="seo-feedback-side-head">
            <div>
              <h1>客户修改沉淀</h1>
              <p>示例项目A / Word 修改审阅</p>
            </div>
            <div className={`seo-api-status seo-api-status--${apiStatus.kind}`}>
              {apiStatus.text}
            </div>
          </div>

          <section className="seo-feedback-loader">
            <label>
              Word 文件路径
              <input
                value={docxPath}
                onChange={(event) => {
                  setDocxPath(event.target.value);
                  setSelectedFile(null);
                }}
              />
            </label>
            <label>
              上传 Word
              <input
                type="file"
                accept=".docx"
                onChange={(event) => {
                  const file = event.target.files?.[0] || null;
                  setSelectedFile(file);
                  if (file) setDocxPath(file.name);
                }}
              />
            </label>
            <button type="button" className="seo-primary" onClick={loadDocument}>读取 Word 修改</button>
          </section>

          {loaded ? (
            <>
              <div className="seo-feedback-tabs">
                <button type="button" className={activePanel === 'report' ? 'is-active' : ''} onClick={() => setActivePanel('report')}>识别报告</button>
                <button type="button" className={activePanel === 'list' ? 'is-active' : ''} onClick={() => setActivePanel('list')}>修改列表</button>
                <button type="button" className={activePanel === 'api' ? 'is-active' : ''} onClick={() => setActivePanel('api')}>对 API 说</button>
                <button type="button" className={activePanel === 'accepted' ? 'is-active' : ''} onClick={() => setActivePanel('accepted')}>已接受</button>
              </div>

              {activePanel === 'report' ? (
                <div className="seo-feedback-card">
                  <h2>修改识别报告</h2>
                  <p className="seo-muted">文档：{shortText(report.documentTitle, 72)}</p>
                  <div className="seo-feedback-stat-list">
                    <span>Word 正式插入：{report.formalInsertions || 0} 条</span>
                    <span>Word 正式删除：{report.formalDeletions || 0} 条</span>
                    <span>批注：{report.comments || 0} 条</span>
                    <span>红色删除线：{report.visualDeletions || 0} 条</span>
                    <span>蓝色新增文字：{report.visualInsertions || 0} 条</span>
                    <span>普通超链接：{report.excludedLinks || 0} 条，已排除</span>
                    <span>疑似格式修改：{report.suspiciousFormats || 0} 条，需人工确认</span>
                  </div>
                  <div className="seo-feedback-actions">
                    <button type="button" onClick={() => setActivePanel('list')}>查看修改列表</button>
                    <button type="button" onClick={loadDocument}>重新读取</button>
                    <button type="button" className="seo-api-rewrite-button" onClick={() => setActivePanel('api')}>对 API 说的话</button>
                  </div>
                </div>
              ) : null}

              {activePanel === 'list' ? (
                <div className="seo-feedback-card">
                  <h2>修改列表</h2>
                  <div className="seo-feedback-change-list">
                    {changes.map((item) => (
                      <article key={item.id} className={item.id === activeChangeId ? 'is-active' : ''}>
                        <button type="button" onClick={() => { setActiveChangeId(item.id); setActivePanel('api'); }}>
                          <strong>{item.section}</strong>
                          <span>{item.type} · {item.status}</span>
                        </button>
                      </article>
                    ))}
                  </div>
                </div>
              ) : null}

              {activePanel === 'api' ? (
                <div className="seo-feedback-card">
                  <h2>选中文本与 API 分析</h2>
                  <div className="seo-feedback-selected">
                    <p className="seo-label">当前选中文本</p>
                    <blockquote>{selectedText || activeChange?.deletedText || activeChange?.insertedText || '请在左侧选中文本，或点击高亮修改。'}</blockquote>
                  </div>
                  <div className="seo-feedback-mark-buttons">
                    {Object.entries(markLabels).map(([key, label]) => (
                      <button
                        type="button"
                        key={key}
                        className={selectedMark === key ? 'is-active' : ''}
                        onClick={() => setSelectedMark(key)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <label className="seo-feedback-api-note">
                    你想对 API 说的话
                    <textarea
                      value={apiInstruction}
                      onChange={(event) => setApiInstruction(event.target.value)}
                      rows={5}
                      placeholder="例如：这段红色删除线没有识别出来；请判断它和后面的蓝色文字是否是一组删除/新增。"
                    />
                  </label>
                  <div className="seo-feedback-actions">
                    <button type="button" onClick={() => acceptCurrentEvidence('manual')}>直接加入修改记录</button>
                    <button type="button" className="seo-primary" onClick={analyzeSelectionByApi}>让 API 分析选中内容</button>
                    <button type="button" className="seo-api-rewrite-button" onClick={() => acceptCurrentEvidence('api')}>接受 API 结果</button>
                  </div>
                  {apiResult ? (
                    <div className="seo-feedback-api-result">
                      <p className="seo-label">API 分析结果</p>
                      <pre>{apiResult}</pre>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {activePanel === 'accepted' ? (
                <div className="seo-feedback-card">
                  <h2>已接受的修改记录</h2>
                  {acceptedChanges.length ? (
                    <div className="seo-feedback-accepted-list">
                      {acceptedChanges.map((item) => (
                        <article key={item.id}>
                          <strong>{markLabels[item.mark] || '修改记录'}</strong>
                          <p>{item.text}</p>
                          {item.instruction ? <span>说明：{item.instruction}</span> : null}
                        </article>
                      ))}
                    </div>
                  ) : (
                    <p className="seo-muted">还没有接受任何补充修改记录。</p>
                  )}
                </div>
              ) : null}
            </>
          ) : (
            <div className="seo-feedback-card">
              <h2>操作区</h2>
              <p className="seo-muted">先读取 Word 文件。读取后，左边显示原文，右边显示识别报告和 API 分析功能。</p>
            </div>
          )}
        </aside>
      </section>
    </div>
  );
}
