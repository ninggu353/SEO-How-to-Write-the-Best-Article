import React from 'react';
import { Building2, CheckCircle2, Clock3, FileCheck2, FolderKanban } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export function ProjectList({ projects, selectedProjectId, onSelectProject }) {
  return (
    <Card className="seo-panel seo-project-panel seo-file-manager-panel" size="sm">
      <CardHeader className="seo-section-head">
        <div>
          <CardTitle>
            <FolderKanban />
            公司工作区
          </CardTitle>
          <CardDescription>每个公司是一套独立项目区，点击后进入二级工作台。</CardDescription>
        </div>
        <Badge variant="secondary">{projects.length} 个工作区</Badge>
      </CardHeader>
      <CardContent>
        <div className="seo-workspace-folder-grid">
        {projects.map((project) => (
          <Button
            key={project.id}
            type="button"
            variant="ghost"
            aria-pressed={project.id === selectedProjectId}
            className={`seo-workspace-folder h-auto ${project.id === selectedProjectId ? 'is-selected' : ''}`}
            onClick={() => onSelectProject(project.id)}
          >
            <span className="seo-folder-main">
              <span className="seo-folder-icon">
                <FolderKanban />
              </span>
              <span className="seo-folder-title-block">
                <span className="seo-project-name">{project.name}</span>
                <span className="seo-project-site">{project.siteUrl}</span>
              </span>
            </span>
            <span className="seo-folder-meta">
              <span><Building2 />Client {project.clientId}</span>
              <span><Clock3 />进行中 {project.inProgressCount}</span>
              <span><CheckCircle2 />完成 {project.completedCount}</span>
            </span>
            <span className="seo-project-stats">
              <Badge variant="outline"><FileCheck2 />文章 {project.articleTotal}</Badge>
              <Badge variant={project.needsRevisionCount ? 'secondary' : 'outline'}>需修改 {project.needsRevisionCount}</Badge>
            </span>
            <span className="seo-folder-open-label">打开项目区</span>
          </Button>
        ))}
        </div>
      </CardContent>
    </Card>
  );
}
