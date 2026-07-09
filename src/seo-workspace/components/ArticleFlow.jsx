import React from 'react';
import { GitBranch } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { StatusDot } from './StatusDot';

export function ArticleFlow({ article, steps, onStepSelect }) {
  const currentStep = steps.find((step) => step.key === article.currentStepKey);

  return (
    <Card className="seo-panel seo-flow-panel" size="sm">
      <CardHeader className="seo-stage-header">
        <div>
          <CardTitle>
            <GitBranch />
            现阶段
          </CardTitle>
          <CardDescription>{article.title}</CardDescription>
        </div>
        <Badge variant="outline">当前：{currentStep?.label || '-'}</Badge>
      </CardHeader>

      <CardContent>
        <div className="seo-flow-strip">
        {steps.map((step) => (
          <Button key={step.key} type="button" variant="outline" className="seo-flow-chip h-auto" onClick={() => onStepSelect(step.key)}>
            <StatusDot status={article.stepStatus[step.key]} />
            {step.label}
          </Button>
        ))}
        </div>
      </CardContent>
    </Card>
  );
}
