import React from 'react';
import { StatusDot } from './StatusDot';

export function StepCard({ step, status = 'todo', content = '', isOpen = false, onSelect }) {
  return (
    <article className={`seo-step-card ${isOpen ? 'is-current' : ''}`}>
      <button type="button" className="seo-step-head" onClick={onSelect}>
        <span className="seo-step-index">
          <StatusDot status={status} />
          {step.label}
        </span>
        <span className="seo-step-purpose">{step.purpose}</span>
      </button>

      <div className="seo-step-body">
        <div className="seo-step-columns">
          <div>
            <p className="seo-label">必须记录</p>
            <ul className="seo-list">
              {step.records.map((record) => (
                <li key={record}>{record}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="seo-label">当前内容</p>
            <textarea className="seo-textarea" defaultValue={content} rows={7} placeholder="这里显示本步骤当前草稿或确认内容" />
          </div>
        </div>

        <div className="seo-step-actions">
          <button type="button" className="seo-primary" onClick={onSelect}>进入上方创作区</button>
        </div>
      </div>
    </article>
  );
}
