import React from 'react';

const statusClass = {
  done: 'seo-dot--done',
  current: 'seo-dot--current',
  todo: 'seo-dot--todo',
};

export function StatusDot({ status = 'todo' }) {
  return <span className={`seo-dot ${statusClass[status] || statusClass.todo}`} aria-hidden="true" />;
}
