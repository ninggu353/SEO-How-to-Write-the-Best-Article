import React from 'react';
import { FolderKanban } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export function ProjectList({ projects, selectedProjectId, onSelectProject }) {
  return (
    <Card className="seo-panel seo-project-panel" size="sm">
      <CardHeader className="seo-section-head">
        <CardTitle>
          <FolderKanban />
          项目
        </CardTitle>
        <Badge variant="secondary">{projects.length} 个项目</Badge>
      </CardHeader>
      <CardContent>
        <div className="seo-project-list">
        {projects.map((project) => (
          <Button
            key={project.id}
            type="button"
            variant="ghost"
            className={`seo-project-button h-auto ${project.id === selectedProjectId ? 'is-selected' : ''}`}
            onClick={() => onSelectProject(project.id)}
          >
            <span className="seo-project-name">{project.name}</span>
            <span className="seo-project-site">{project.siteUrl}</span>
            <span className="seo-project-stats">
              <Badge variant="outline">本周 {project.articleTotal}</Badge>
              <Badge variant="outline">进行中 {project.inProgressCount}</Badge>
              <Badge variant="outline">完成 {project.completedCount}</Badge>
              <Badge variant={project.needsRevisionCount ? 'secondary' : 'outline'}>需修改 {project.needsRevisionCount}</Badge>
            </span>
          </Button>
        ))}
        </div>
      </CardContent>
    </Card>
  );
}
