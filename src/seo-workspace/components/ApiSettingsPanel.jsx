import React from 'react';

export function ApiSettingsPanel({
  settings,
  status,
  onChange,
  onSave,
  onTestGenerate,
}) {
  return (
    <section className="seo-panel seo-api-panel">
      <div className="seo-api-title">
        <div>
          <h2>API 接入</h2>
          <p className="seo-muted">填写中转站或 OpenAI-compatible 接口。Key 由后端保存到本地外部数据目录，不写进项目代码。</p>
        </div>
        <span className={`seo-api-status seo-api-status--${status.kind}`}>{status.text}</span>
      </div>

      <div className="seo-api-grid">
        <label>
          后端地址
          <input
            value={settings.backendUrl}
            onChange={(event) => onChange({ backendUrl: event.target.value })}
            placeholder="http://127.0.0.1:8000"
          />
        </label>
        <label>
          Provider
          <input
            value={settings.provider}
            onChange={(event) => onChange({ provider: event.target.value })}
            placeholder="relay / openrouter / openai"
          />
        </label>
        <label>
          中转站 Base URL
          <input
            value={settings.baseUrl}
            onChange={(event) => onChange({ baseUrl: event.target.value })}
            placeholder="https://your-relay.example.com/v1"
          />
        </label>
        <label>
          Model
          <input
            value={settings.model}
            onChange={(event) => onChange({ model: event.target.value })}
            placeholder="gpt-4o-mini / claude... / relay-model"
          />
        </label>
        <label>
          API Key
          <input
            type="password"
            value={settings.apiKey}
            onChange={(event) => onChange({ apiKey: event.target.value })}
            placeholder={settings.hasApiKey ? '已保存；留空则沿用后端已保存 key' : '粘贴你的中转站 API key'}
          />
        </label>
      </div>

      <div className="seo-api-actions">
        <button type="button" className="seo-primary" onClick={onSave}>保存 API 配置</button>
        <button type="button" onClick={onTestGenerate}>测试生成一句话</button>
      </div>
    </section>
  );
}
