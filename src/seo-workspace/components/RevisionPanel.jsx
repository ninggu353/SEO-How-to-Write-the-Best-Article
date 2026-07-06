import React from 'react';

const typeLabel = {
  operator: '运营修改',
  client: '客户修改',
};

const sourceLabel = {
  api: 'API生成',
  api_rewrite: 'API修改',
  manual: '手动输入',
  web_gpt: '网页GPT',
};

export function RevisionPanel({ revisions }) {
  return (
    <section className="seo-panel seo-learning-panel">
      <h2>修改记录与沉淀</h2>
      {revisions.length === 0 ? (
        <p className="seo-muted">暂无修改记录。确认或修改后，会在这里保留旧版本和修改原因。</p>
      ) : (
        <div className="seo-revision-list">
          {revisions.map((revision) => (
            <article key={revision.id} className="seo-revision-item">
              <strong>{typeLabel[revision.type] || '修改'}</strong>
              <span>{sourceLabel[revision.source] || revision.source}</span>
              <p>{revision.summary}</p>
              <p className="seo-muted">原因：{revision.reason || '未填写'}</p>
              {revision.newContent ? (
                <details className="seo-revision-detail">
                  <summary>查看保存后的完整内容</summary>
                  <pre>{revision.newContent}</pre>
                </details>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
