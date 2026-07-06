import React from 'react';

import { SeoArticleWorkspace } from './SeoArticleWorkspace';
import { ClientFeedbackWorkbench } from './components/ClientFeedbackWorkbench';
import { sampleWorkspace } from './data/sampleWorkspaceData';

export default {
  title: 'SEO/Article Workspace',
  component: SeoArticleWorkspace,
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    initialProjectId: {
      control: 'select',
      options: sampleWorkspace.projects.map((project) => project.id),
    },
  },
  args: {
    initialProjectId: 'demo_project_a',
  },
};

export const Default = {};

export const SectionFocus = {
  args: {
    initialProjectId: 'demo_project_a',
  },
};

export const CompetitorFocus = {
  args: {
    initialProjectId: 'demo_project_b',
  },
};

export const ProductLinkFocus = {
  args: {
    initialProjectId: 'demo_project_c',
  },
};

export const AiRateFocus = {
  args: {
    initialProjectId: 'demo_project_d',
  },
};

export const ClientFeedbackReview = {
  name: '客户修改沉淀',
  render: () => React.createElement(ClientFeedbackWorkbench),
};
