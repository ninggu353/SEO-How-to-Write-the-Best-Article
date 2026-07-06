import React from 'react';
import { StatusDot } from './StatusDot';

function keywordSourceType(item) {
  const sourceType = String(item?.source_type || '').toLowerCase();
  if (sourceType === 'gsc_api') return 'api';
  if (sourceType === 'gsc_csv' || sourceType === 'legacy_gsc') return 'csv';
  if (sourceType === 'sample') return 'sample';
  if (sourceType === 'opportunity_table' || sourceType === 'keyword_pool') return 'local';
  return 'unknown';
}

function keywordSourceLabel(item) {
  const sourceType = keywordSourceType(item);
  if (item?.source_label) return item.source_label;
  if (sourceType === 'api') return 'GSC API';
  if (sourceType === 'csv') return 'GSC 文件导入';
  if (sourceType === 'sample') return '演示数据';
  if (sourceType === 'local') return '本地关键词库';
  return '来源待确认';
}

function keywordEvidenceLine(item) {
  const parts = [];
  if (item?.site_url) parts.push(`站点：${item.site_url}`);
  if (item?.date_start || item?.date_end) parts.push(`日期：${item.date_start || '?'} 至 ${item.date_end || '?'}`);
  if (item?.page) parts.push(`页面：${item.page}`);
  if (item?.source_job_id) parts.push(`任务ID：${item.source_job_id}`);
  return parts.join(' · ');
}

function keywordEffectScore(item) {
  const score = Number(item?.gsc_effect_score ?? item?.score ?? 0);
  return Number.isFinite(score) ? score.toFixed(1) : '0.0';
}

export function StepEditor({
  project,
  article,
  step,
  status,
  draft,
  interactionMode,
  apiInstruction,
  generationProgress,
  manualFields,
  manualFieldDefs,
  lastSaveNotice,
  editReason,
  revisionType,
  dedupState,
  productLinks,
  productLinkHistory,
  productLinkCheck,
  productLinkSuggestions,
  productCandidateState,
  gscSyncState,
  gscKeywordState,
  topicKeywordSelection,
  projectPreferenceMemory,
  onDraftChange,
  onInteractionModeChange,
  onApiInstructionChange,
  onManualFieldChange,
  onReasonChange,
  onRevisionTypeChange,
  onApiGenerate,
  onApiRewrite,
  onManualMode,
  onDedupPrecheck,
  onDedupApiReview,
  onReturnTopicTdk,
  onDedupAllowException,
  onProductLinkChange,
  onProductLinkAdd,
  onProductLinkRemove,
  onProductLinkCheck,
  onProductCandidateBoardUrlChange,
  onReadProductCandidates,
  onApplyProductCandidate,
  onProductLinkApiRecommend,
  onApplyProductSuggestion,
  onAcceptAllProductSuggestions,
  onProductSuggestionDecision,
  onProductSuggestionNoteChange,
  onProductSuggestionNoteSave,
  onRegenerateProductSuggestions,
  onGscSyncFieldChange,
  onSyncGscSearchAnalytics,
  onReadGscApiKeywords,
  onKeywordCandidateDecision,
  onTopicTdkDedupCheck,
  onConfirm,
  onModify,
}) {
  const isDedupStep = step.key === 'dedup';
  const isProductLinkStep = step.key === 'product_links';
  const isTopicTdkStep = step.key === 'topic_tdk';
  const productMatches = [
    ...(productLinkCheck.primaryMatches || []).map((item) => ({ ...item, matchedRole: '主产品链接' })),
    ...(productLinkCheck.secondaryMatches || []).map((item) => ({ ...item, matchedRole: '辅助产品链接' })),
  ];
  const productCheckHasRisk = productLinkCheck.checked && (!productLinkCheck.hasInput || productMatches.length > 0);
  const primaryProductLinks = Array.isArray(productLinks.primary) ? productLinks.primary : productLinks.primary ? [productLinks.primary] : [''];
  const secondaryProductLinks = Array.isArray(productLinks.secondary) ? productLinks.secondary : productLinks.secondary ? [productLinks.secondary] : [''];
  const rejectedSuggestionCount = (productLinkSuggestions.urls || []).filter((url) => productLinkSuggestions.decisions?.[url] === 'rejected').length;
  const acceptedSuggestionCount = (productLinkSuggestions.urls || []).filter((url) => productLinkSuggestions.decisions?.[url] === 'accepted').length;
  const pendingSuggestionCount = (productLinkSuggestions.urls || []).filter((url) => !productLinkSuggestions.decisions?.[url] || productLinkSuggestions.decisions?.[url] === 'pending').length;
  const productPreferenceMemory = Array.isArray(projectPreferenceMemory) ? projectPreferenceMemory : [];
  const productCandidates = Array.isArray(productCandidateState?.candidates) ? productCandidateState.candidates : [];
  const candidateStatus = productCandidateState?.status || 'idle';
  const gscKeywords = Array.isArray(gscKeywordState?.keywords) ? gscKeywordState.keywords : [];
  const selectedSecondaryKeywords = Array.isArray(topicKeywordSelection?.secondary) ? topicKeywordSelection.secondary : [];
  const ignoredKeywords = Array.isArray(topicKeywordSelection?.ignored) ? topicKeywordSelection.ignored : [];
  return (
    <section className="seo-editor-shell">
      <div className="seo-editor-title">
        <span>{project.name}</span>
        <strong>{step.label}</strong>
        <span>
          <StatusDot status={status} />
        </span>
      </div>

      {!isDedupStep && !isProductLinkStep ? (
        <div className="seo-mode-switch">
          <button
            type="button"
            className={`seo-mode-button seo-mode-button--api ${interactionMode === 'api' ? 'is-active' : ''}`}
            onClick={() => onInteractionModeChange('api')}
          >
            API生成
          </button>
          <button
            type="button"
            className={`seo-mode-button seo-mode-button--manual ${interactionMode === 'manual' ? 'is-active' : ''}`}
            onClick={onManualMode}
          >
            手动输入
          </button>
        </div>
      ) : null}

      {isProductLinkStep ? (
        <div className="seo-product-layout">
          <aside className="seo-product-panel seo-product-panel--manual">
            <div>
              <h3>本次文章具体产品链接</h3>
              <p className="seo-muted">先确定本篇文章要承接的主产品页和辅助产品页，后面的选题/TDK 会直接读取这里的结果。</p>
            </div>

            <div className="seo-product-link-rows">
              <div className="seo-product-link-group">
                <div className="seo-product-link-group-head">
                  <strong>主产品链接</strong>
                </div>
                {primaryProductLinks.map((url, index) => (
                  <div className="seo-product-link-row" key={`primary-${index}`}>
                    <input
                      value={url}
                      onChange={(event) => onProductLinkChange('primary', index, event.target.value)}
                      placeholder="https://..."
                    />
                    <div className="seo-product-link-actions">
                      <button type="button" className="seo-icon-action" onClick={() => onProductLinkAdd('primary')} aria-label="增加主产品链接">+</button>
                      <button type="button" className="seo-icon-action" onClick={() => onProductLinkRemove('primary', index)} aria-label="删除主产品链接">−</button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="seo-product-link-group">
                <div className="seo-product-link-group-head">
                  <strong>辅助产品链接</strong>
                </div>
                {secondaryProductLinks.map((url, index) => (
                  <div className="seo-product-link-row" key={`secondary-${index}`}>
                    <input
                      value={url}
                      onChange={(event) => onProductLinkChange('secondary', index, event.target.value)}
                      placeholder="https://..."
                    />
                    <div className="seo-product-link-actions">
                      <button type="button" className="seo-icon-action" onClick={() => onProductLinkAdd('secondary')} aria-label="增加辅助产品链接">+</button>
                      <button type="button" className="seo-icon-action" onClick={() => onProductLinkRemove('secondary', index)} aria-label="删除辅助产品链接">−</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="seo-product-manual-note">
              <div>
                <h3>人工选择产品链接</h3>
                <p className="seo-muted">产品页必须由人工确认，系统只负责检查这些链接是否在近期文章里用过，不再从类目页自动猜链接。</p>
              </div>
              <ul>
                <li>主产品链接：本篇正文前段重点承接的产品页。</li>
                <li>辅助产品链接：可在对比、补充场景或 CTA 中自然出现。</li>
                <li>点击右侧“检查近 4 篇重复”后，再决定是否换链接。</li>
              </ul>
            </div>
          </aside>

          <main className="seo-product-panel seo-product-panel--result">
            <div className="seo-product-check-head">
              <div>
                <h3>产品链接排重</h3>
                <p className="seo-muted">检查当前主/辅助产品链接是否和近 4 篇交付文章重复。</p>
              </div>
              <button type="button" className="seo-primary" onClick={onProductLinkCheck}>检查近 4 篇重复</button>
            </div>

            <div className={`seo-product-check-result ${productCheckHasRisk ? 'has-risk' : 'is-clean'}`}>
              <strong>{productLinkCheck.checked ? (!productLinkCheck.hasInput ? '请先填写' : productMatches.length ? '发现重复' : '未发现重复') : '等待检查'}</strong>
              <p>{productLinkCheck.resultText}</p>
            </div>

            {productLinkCheck.checked && productMatches.length ? (
              <div className="seo-product-history seo-product-history--matched">
                <p className="seo-label">重复命中的历史文章</p>
                {productMatches.map((item) => (
                  <article key={`${item.id}-${item.matchedRole}`}>
                    <strong>{item.deliveredAt}交付 - {item.title}</strong>
                    <span>{item.matchedRole} / 历史记录：{item.role}</span>
                    <p>{item.productUrl}</p>
                    {item.topic ? <p>当时主题：{item.topic}</p> : null}
                  </article>
                ))}
              </div>
            ) : null}

            <div className="seo-product-history">
              <p className="seo-label">近 4 篇产品链接记录</p>
              {productLinkHistory.length ? (
                productLinkHistory.map((item) => (
                  <article key={item.id}>
                    <strong>{item.deliveredAt}交付 - {item.title}</strong>
                    <span>{item.role}</span>
                    <p>{item.productUrl}</p>
                  </article>
                ))
              ) : (
                <p className="seo-muted">暂无近 4 篇产品链接记录。</p>
              )}
            </div>

            <div className="seo-product-current">
              <p className="seo-label">当前将保存的产品链接</p>
              <p><strong>主产品链接：</strong>{primaryProductLinks.filter(Boolean).join('；') || '未填写'}</p>
              <p><strong>辅助产品链接：</strong>{secondaryProductLinks.filter(Boolean).join('；') || '未填写'}</p>
            </div>

            <div className="seo-product-memory">
              <div className="seo-product-memory-head">
                <p className="seo-label">本项目偏好记忆</p>
                <span>API 下次只读取这些压缩规则，不重新分析全部历史。</span>
              </div>
              {productPreferenceMemory.length ? (
                <div className="seo-product-memory-list">
                  {productPreferenceMemory.map((item) => (
                    <article key={item.id}>
                      <strong>{item.title}</strong>
                      <p>{item.summary}</p>
                      <span>{item.createdAt}</span>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="seo-muted">暂无偏好记忆。确认链接、接受/拒绝 API 推荐后会沉淀到这里。</p>
              )}
            </div>
          </main>
        </div>
      ) : isDedupStep ? (
        <div className="seo-dedup-layout">
          <aside className="seo-dedup-panel">
            <div>
              <h3>历史库排重预检</h3>
              <p className="seo-muted">先用数据库筛选主题、近 4 篇关键词组合和产品链接。只有疑似项才调用 API。</p>
            </div>

            <div className="seo-dedup-input">
              <p><strong>主题：</strong>{dedupState.input?.topic || '未从选题/TDK提取'}</p>
              <p><strong>关键词：</strong>{dedupState.input?.keywords || '未从选题/TDK提取'}</p>
              <p><strong>产品链接：</strong>{dedupState.input?.productUrl || '未填写'}</p>
              <p><strong>角度：</strong>{dedupState.input?.angle || '未填写'}</p>
            </div>

            <div className="seo-dedup-checks">
              {dedupState.checks.map((check) => (
                <div key={check.key} className={`seo-dedup-check seo-dedup-check--${check.status}`}>
                  <strong>{check.label}</strong>
                  <span>{check.detail}</span>
                </div>
              ))}
            </div>

            <div className={`seo-dedup-risk seo-dedup-risk--${dedupState.riskLevel}`}>
              <span>风险等级</span>
              <strong>{dedupState.riskLevel === 'unknown' ? '待检查' : dedupState.riskLevel}</strong>
              <p>{dedupState.suggestedAction}</p>
            </div>

            <div className="seo-dedup-actions">
              <button type="button" className="seo-primary" onClick={onDedupPrecheck}>数据库排重预检</button>
              <button type="button" className="seo-api-rewrite-button" onClick={onDedupApiReview} disabled={generationProgress.running}>
                API 判断疑似重复
              </button>
              <button type="button" onClick={onReturnTopicTdk}>返回选题/TDK修改</button>
            </div>

            <div className="seo-progress-card">
              <div className="seo-progress-meta">
                <strong>{generationProgress.label}</strong>
                <span>{generationProgress.percent}%</span>
              </div>
              <div className="seo-progress-track">
                <i style={{ width: `${generationProgress.percent}%` }} />
              </div>
              <p className="seo-muted">
                {generationProgress.running ? `已用 ${generationProgress.elapsed}s，预计还需约 ${generationProgress.estimate}s` : 'API 只会读取 Top 3 疑似项'}
              </p>
            </div>
          </aside>

          <main className="seo-creation-area seo-creation-area--dedup">
            <p className="seo-muted">排重记录</p>
            <textarea
              className="seo-big-textarea"
              value={draft}
              onChange={(event) => onDraftChange(event.target.value)}
              placeholder="这里会显示数据库预检或 API 判断结果"
            />
            <div className="seo-dedup-candidates">
              <p className="seo-label">API 将只读取这些疑似历史文章</p>
              {dedupState.apiInputPreview.length ? (
                dedupState.apiInputPreview.map((item) => (
                  <article key={item.id}>
                    <strong>{item.title}</strong>
                    <span>{item.daysAgo} 天前 · {item.matchTypes.join(' / ')}</span>
                    <p>{item.topic}</p>
                  </article>
                ))
              ) : (
                <p className="seo-muted">暂无疑似项。低风险时不需要调用 API。</p>
              )}
            </div>
          </main>
        </div>
      ) : (
        <div className={`seo-work-panel seo-work-panel--${interactionMode}`}>
          {isTopicTdkStep ? (
            <div className="seo-product-summary-banner">
              <strong>上一步已确认产品链接</strong>
              <span>主产品链接：{primaryProductLinks.filter(Boolean).join('；') || '未填写'}</span>
              <span>辅助产品链接：{secondaryProductLinks.filter(Boolean).join('；') || '未填写'}</span>
            </div>
          ) : null}
          {isTopicTdkStep ? (
            <div className="seo-topic-tools">
              <section className={`seo-topic-keyword-card seo-topic-keyword-card--${gscKeywordState?.status || 'idle'}`}>
                <div className="seo-topic-card-head">
                  <div>
                    <h3>GSC API 文章效果选词</h3>
                    <p className="seo-muted">只读取该项目 Search Console API 的页面和关键词表现，根据以往文章效果选择下一篇文章的主关键词和辅助关键词。</p>
                  </div>
                  <div className="seo-topic-head-actions">
                    <button type="button" className="seo-primary" onClick={onReadGscApiKeywords}>读取 GSC API 效果关键词</button>
                  </div>
                </div>
                <div className={`seo-gsc-sync-panel seo-gsc-sync-panel--${gscSyncState?.status || 'idle'}`}>
                  <div className="seo-gsc-sync-grid">
                    <label>
                      <span>GSC 站点</span>
                      <input
                        type="text"
                        value={gscSyncState?.siteUrl || ''}
                        onChange={(event) => onGscSyncFieldChange('siteUrl', event.target.value)}
                        placeholder="https://www.demo_project_cgroup.com/ 或 sc-domain:demo_project_cgroup.com"
                      />
                    </label>
                    <label>
                      <span>开始日期</span>
                      <input
                        type="date"
                        value={gscSyncState?.dateStart || ''}
                        onChange={(event) => onGscSyncFieldChange('dateStart', event.target.value)}
                      />
                    </label>
                    <label>
                      <span>结束日期</span>
                      <input
                        type="date"
                        value={gscSyncState?.dateEnd || ''}
                        onChange={(event) => onGscSyncFieldChange('dateEnd', event.target.value)}
                      />
                    </label>
                  </div>
                  <div className="seo-gsc-sync-actions">
                    <button
                      type="button"
                      className="seo-primary"
                      onClick={onSyncGscSearchAnalytics}
                      disabled={gscSyncState?.status === 'loading'}
                    >
                      {gscSyncState?.status === 'loading' ? '正在同步 GSC' : '同步 Search Console API'}
                    </button>
                    <span>{gscSyncState?.message || '等待同步。'}</span>
                  </div>
                  {gscSyncState?.jobId ? (
                    <small className="seo-small-note">
                      同步任务：{gscSyncState.jobId} · 导入 {gscSyncState.rowCount || 0} 行
                      {gscSyncState.syncedAt ? ` · ${gscSyncState.syncedAt}` : ''}
                    </small>
                  ) : null}
                </div>
                <p className="seo-topic-status">{gscKeywordState?.message || '等待读取关键词。'}</p>
                {gscKeywordState?.sourceLabel ? (
                  <div className={`seo-keyword-source-summary seo-keyword-source-summary--${gscKeywordState?.hasGscApiEvidence ? 'api' : 'local'}`}>
                    {gscKeywordState.hasGscApiEvidence
                      ? '当前列表只包含 GSC API 来源数据，可用于按历史文章效果选词。'
                      : '当前项目还没有 GSC API 同步数据，暂不能按文章效果选词。'}
                  </div>
                ) : null}
                {gscKeywordState?.fetchedAt ? <span className="seo-small-note">读取时间：{gscKeywordState.fetchedAt}</span> : null}
                <div className="seo-selected-keywords">
                  <span>主关键词：{topicKeywordSelection?.main || '未选择'}</span>
                  <span>辅助关键词：{selectedSecondaryKeywords.length ? selectedSecondaryKeywords.join('，') : '未选择'}</span>
                </div>
                {gscKeywords.length ? (
                  <div className="seo-keyword-candidate-list">
                    {gscKeywords.map((item, index) => {
                      const keyword = item.keyword || item.query || '';
                      const state = topicKeywordSelection?.main === keyword
                        ? 'main'
                        : selectedSecondaryKeywords.includes(keyword)
                          ? 'secondary'
                          : ignoredKeywords.includes(keyword)
                            ? 'ignored'
                            : 'pending';
                      return (
                        <article key={`${keyword}-${index}`} className={`seo-keyword-candidate seo-keyword-candidate--${state}`}>
                          <div>
                            <strong>{keyword}</strong>
                            <p>
                              曝光 {Number(item.impressions || 0).toLocaleString()} · 点击 {Number(item.clicks || 0).toLocaleString()}
                              {item.ctr ? ` · CTR ${(Number(item.ctr) * 100).toFixed(2)}%` : ''}
                              {item.avg_position ? ` · 排名 ${Number(item.avg_position).toFixed(1)}` : ''}
                            </p>
                            <span className={`seo-keyword-source-badge seo-keyword-source-badge--${keywordSourceType(item)}`}>
                              {keywordSourceLabel(item)}
                            </span>
                            <span className="seo-keyword-effect-score">效果推荐分：{keywordEffectScore(item)}</span>
                            {item.recommendation_effect_label ? (
                              <span className="seo-keyword-effect-label">{item.recommendation_effect_label}</span>
                            ) : null}
                            {keywordEvidenceLine(item) ? <small className="seo-keyword-evidence">{keywordEvidenceLine(item)}</small> : null}
                            {item.why_recommended ? <small className="seo-keyword-effect-reason">{item.why_recommended}</small> : null}
                          </div>
                          <div className="seo-product-url-actions">
                            <button type="button" onClick={() => onKeywordCandidateDecision(keyword, 'main')}>设为主关键词</button>
                            <button type="button" onClick={() => onKeywordCandidateDecision(keyword, 'secondary')}>设为辅助关键词</button>
                            <button type="button" onClick={() => onKeywordCandidateDecision(keyword, 'ignored')}>不用</button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <p className="seo-muted">暂无 GSC API 效果关键词。请先同步该项目的 Search Console API 数据。</p>
                )}
              </section>

              <section className="seo-topic-dedup-card">
                <div className="seo-topic-card-head">
                  <div>
                    <h3>主题/TDK 排重</h3>
                    <p className="seo-muted">检查当前主题和关键词组合是否和近 4 篇或历史库重复。</p>
                  </div>
                  <button type="button" className="seo-primary" onClick={onTopicTdkDedupCheck}>检查主题/关键词重复</button>
                </div>
                <div className="seo-dedup-checks">
                  {(dedupState?.checks || []).map((check) => (
                    <div key={check.key} className={`seo-dedup-check seo-dedup-check--${check.status}`}>
                      <strong>{check.label}</strong>
                      <span>{check.detail}</span>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          ) : null}
          {interactionMode === 'api' ? (
          <aside className="seo-api-work">
            <div>
              <h3>API生成过程</h3>
              <p className="seo-muted">这里显示 API 当前在做什么。生成成功后，结果会进入右侧创作区。</p>
            </div>
            <label>
              你想对 API 说的话
              <textarea
                value={apiInstruction}
                onChange={(event) => onApiInstructionChange(event.target.value)}
                rows={4}
                placeholder="可选：补充本次生成要求，例如不要泛泛科普、必须输出正常中文、重点写某个产品场景"
              />
            </label>
            <button type="button" className="seo-primary seo-primary--api" onClick={onApiGenerate} disabled={generationProgress.running}>
              {generationProgress.running ? '生成中' : '开始 API 生成'}
            </button>
            <div className="seo-progress-card">
              <div className="seo-progress-meta">
                <strong>{generationProgress.label}</strong>
                <span>{generationProgress.percent}%</span>
              </div>
              <div className="seo-progress-track">
                <i style={{ width: `${generationProgress.percent}%` }} />
              </div>
              <p className="seo-muted">
                {generationProgress.running
                  ? `已用 ${generationProgress.elapsed}s，预计还需约 ${generationProgress.estimate}s`
                  : generationProgress.elapsed
                    ? `本次用时 ${generationProgress.elapsed}s`
                    : '点击后开始记录生成进度'}
              </p>
            </div>
          </aside>
          ) : (
          <aside className="seo-manual-work">
            <div>
              <h3>手动输入</h3>
              <p className="seo-muted">按字段填写，系统会同步整理成创作区文本。</p>
            </div>
            <div className="seo-manual-fields">
              {manualFieldDefs.map((field) => (
                <label key={field.key}>
                  {field.label}
                  <textarea
                    value={manualFields[field.key] || ''}
                    onChange={(event) => onManualFieldChange(field.key, event.target.value)}
                    rows={field.key === 'description' || field.key === 'reason' ? 3 : 2}
                    placeholder={field.placeholder}
                  />
                </label>
              ))}
            </div>
          </aside>
          )}

          <main className="seo-creation-area">
            <p className="seo-muted">{article.title}</p>
            <textarea
              className="seo-big-textarea"
              value={draft}
              onChange={(event) => onDraftChange(event.target.value)}
              placeholder="创作区：API 生成或人工输入的内容都会在这里确认、修改和保存"
            />
          </main>
        </div>
      )}

      <div className="seo-save-flow">
        <div className="seo-reason-panel">
          <label>
            修改类型
            <select value={revisionType} onChange={(event) => onRevisionTypeChange(event.target.value)}>
              <option value="operator">运营修改</option>
              <option value="client">客户修改</option>
            </select>
          </label>
          <label>
            修改原因
            <textarea
              value={editReason}
              onChange={(event) => onReasonChange(event.target.value)}
              rows={3}
              placeholder="先写修改原因，再点保存修改。例如：显示乱码、标题太泛、没有体现产品差异"
            />
          </label>
        </div>

        <div className="seo-save-actions">
          <button type="button" className="seo-primary" onClick={onConfirm}>确认当前内容</button>
          <button type="button" onClick={onModify}>手动保存修改</button>
          {isDedupStep ? (
            <button type="button" className="seo-api-rewrite-button" onClick={onDedupAllowException}>
              特殊情况确认继续
            </button>
          ) : (
            <button type="button" className="seo-api-rewrite-button" onClick={onApiRewrite} disabled={generationProgress.running}>
              API 按修改原因重写
            </button>
          )}
        </div>
      </div>

      {lastSaveNotice ? (
        <div className={`seo-save-notice seo-save-notice--${lastSaveNotice.kind}`}>
          <div className="seo-save-notice-head">
            <strong>{lastSaveNotice.title}</strong>
            <span>{lastSaveNotice.detail}</span>
          </div>
          {lastSaveNotice.reason ? <p>修改原因：{lastSaveNotice.reason}</p> : null}
          {lastSaveNotice.currentContent ? (
            <div className="seo-saved-content">
              <p className="seo-label">当前已保存内容</p>
              <pre>{lastSaveNotice.currentContent}</pre>
            </div>
          ) : null}
          {lastSaveNotice.previousSummary ? (
            <div className="seo-save-compare">
              <span>修改前摘要：{lastSaveNotice.previousSummary}</span>
              <span>修改后摘要：{lastSaveNotice.newSummary}</span>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
