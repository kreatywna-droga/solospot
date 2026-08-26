import { describe, it, expect } from 'vitest';
import {
  STANDARD_PROJECT_TEMPLATES,
  instantiateTemplate,
} from '../ProjectTemplates';
import {
  createWelcomeScreenState,
  STANDARD_TUTORIALS,
  STANDARD_SAMPLE_PROJECTS,
} from '../StartupExperience';
import { createRecentProjectsState, recordRecentProject } from '../RecentProjects';
import { createProjectMetadata } from '../ProjectMetadata';

describe('ProjectTemplates & StartupExperience (Sprint S5, ETAP 4)', () => {
  it('provides standard project templates', () => {
    expect(STANDARD_PROJECT_TEMPLATES.length).toBeGreaterThan(2);
    const blank = STANDARD_PROJECT_TEMPLATES.find((t) => t.templateId === 'tpl-blank');
    expect(blank?.category).toBe('blank');
  });

  it('instantiates template into BuilderDocument', () => {
    const tpl = STANDARD_PROJECT_TEMPLATES[0];
    const doc = instantiateTemplate(tpl, 'new-p-1', 'tenant-1', 'user-1');
    expect(doc.id).toBe('new-p-1');
    expect(doc.tenantId).toBe('tenant-1');
  });

  it('builds welcome screen state with tutorials and samples', () => {
    const recent = createRecentProjectsState();
    const meta = createProjectMetadata({ projectId: 'p-w1', name: 'My Store', authorId: 'u1', tenantId: 't1' });
    const withRecent = recordRecentProject(recent, meta);
    const screen = createWelcomeScreenState(withRecent.entries, STANDARD_PROJECT_TEMPLATES);
    expect(screen.recentProjects).toHaveLength(1);
    expect(screen.tutorials).toHaveLength(STANDARD_TUTORIALS.length);
    expect(screen.sampleProjects).toHaveLength(STANDARD_SAMPLE_PROJECTS.length);
  });
});
