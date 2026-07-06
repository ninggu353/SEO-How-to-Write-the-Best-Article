import React from 'react';
import { StatusDot } from './StatusDot';

export function ArticleFlow({ article, steps, onStepSelect }) {
  return (
    <section className="seo-panel seo-flow-panel">
      <div className="seo-stage-header">
        <div>
          <h2>现阶段</h2>
          <p className="seo-muted">{article.title}</p>
        </div>
        <p className="seo-muted">当前：{steps.find((step) => step.key === article.currentStepKey)?.label || '-'}</p>
      </div>

      <div className="seo-flow-strip">
        {steps.map((step) => (
          <button key={step.key} type="button" className="seo-flow-chip" onClick={() => onStepSelect(step.key)}>
            <StatusDot status={article.stepStatus[step.key]} />
            {step.label}
          </button>
        ))}
      </div>
    </section>
  );
}
