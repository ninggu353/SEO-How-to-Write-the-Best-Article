import React from 'react';

export function ProjectList({ projects, selectedProjectId, onSelectProject }) {
  return (
    <section className="seo-panel seo-project-panel">
      <h2>项目</h2>
      <div className="seo-project-list">
        {projects.map((project) => (
          <button
            key={project.id}
            type="button"
            className={`seo-project-button ${project.id === selectedProjectId ? 'is-selected' : ''}`}
            onClick={() => onSelectProject(project.id)}
          >
            <span className="seo-project-name">{project.name}</span>
            <span className="seo-project-site">{project.siteUrl}</span>
            <span className="seo-project-stats">
              本周文章 {project.articleTotal}
              <span>进行中 {project.inProgressCount}</span>
              <span>完成 {project.completedCount}</span>
              <span>需修改 {project.needsRevisionCount}</span>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
