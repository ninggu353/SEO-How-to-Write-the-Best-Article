import React from 'react';
import { PlugZap, Save, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';

function apiStatusVariant(kind) {
  if (kind === 'error') return 'destructive';
  if (kind === 'idle' || kind === 'warn') return 'secondary';
  return 'outline';
}

export function ApiSettingsPanel({
  settings,
  status,
  onChange,
  onSave,
  onTestGenerate,
}) {
  return (
    <Card className="seo-panel seo-api-panel" size="sm">
      <CardHeader className="seo-api-title">
        <div>
          <CardTitle className="seo-api-heading">
            <PlugZap />
            API 接入
          </CardTitle>
          <CardDescription>填写中转站或 OpenAI-compatible 接口。Key 由后端保存到本地外部数据目录，不写进项目代码。</CardDescription>
        </div>
        <Badge variant={apiStatusVariant(status.kind)} className={`seo-api-status seo-api-status--${status.kind}`}>{status.text}</Badge>
      </CardHeader>

      <CardContent className="seo-api-body">
        <div className="seo-api-grid">
        <label>
          后端地址
          <Input
            value={settings.backendUrl}
            onChange={(event) => onChange({ backendUrl: event.target.value })}
            placeholder="http://127.0.0.1:8000"
          />
        </label>
        <label>
          Provider
          <Input
            value={settings.provider}
            onChange={(event) => onChange({ provider: event.target.value })}
            placeholder="relay / openrouter / openai"
          />
        </label>
        <label>
          中转站 Base URL
          <Input
            value={settings.baseUrl}
            onChange={(event) => onChange({ baseUrl: event.target.value })}
            placeholder="https://your-relay.example.com/v1"
          />
        </label>
        <label>
          Model
          <Input
            value={settings.model}
            onChange={(event) => onChange({ model: event.target.value })}
            placeholder="gpt-4o-mini / claude... / relay-model"
          />
        </label>
        <label>
          API Key
          <Input
            type="password"
            value={settings.apiKey}
            onChange={(event) => onChange({ apiKey: event.target.value })}
            placeholder={settings.hasApiKey ? '已保存；留空则沿用后端已保存 key' : '粘贴你的中转站 API key'}
          />
        </label>
        </div>

        <div className="seo-api-actions">
          <Button type="button" onClick={onSave}>
            <Save data-icon="inline-start" />
            保存 API 配置
          </Button>
          <Button type="button" variant="outline" onClick={onTestGenerate}>
            <Sparkles data-icon="inline-start" />
            测试生成一句话
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
