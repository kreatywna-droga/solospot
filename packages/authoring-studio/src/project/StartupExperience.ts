/**
 * StartupExperience.ts — Sprint S5 Startup UX Models (ETAP 4)
 *
 * Welcome Screen state, tutorial index, and sample project references.
 *
 * NO DOM, NO React, NO Browser API.
 */

import type { RecentProjectEntry } from './RecentProjects';
import type { ProjectTemplate } from './ProjectTemplates';

export interface TutorialEntry {
  readonly tutorialId: string;
  readonly title: string;
  readonly durationMinutes: number;
  readonly level: 'beginner' | 'intermediate' | 'advanced';
}

export interface SampleProject {
  readonly sampleId: string;
  readonly name: string;
  readonly description: string;
  readonly category: string;
}

export interface WelcomeScreenState {
  readonly recentProjects: ReadonlyArray<RecentProjectEntry>;
  readonly templates: ReadonlyArray<ProjectTemplate>;
  readonly tutorials: ReadonlyArray<TutorialEntry>;
  readonly sampleProjects: ReadonlyArray<SampleProject>;
}

export const STANDARD_TUTORIALS: ReadonlyArray<TutorialEntry> = [
  { tutorialId: 'tut-01', title: 'Creating Your First Animation', durationMinutes: 5, level: 'beginner' },
  { tutorialId: 'tut-02', title: 'Working with the Timeline', durationMinutes: 10, level: 'beginner' },
  { tutorialId: 'tut-03', title: 'Inspector and Properties', durationMinutes: 8, level: 'intermediate' },
  { tutorialId: 'tut-04', title: 'Export and Publish', durationMinutes: 7, level: 'intermediate' },
];

export const STANDARD_SAMPLE_PROJECTS: ReadonlyArray<SampleProject> = [
  { sampleId: 'sample-hero', name: 'Hero Animation', description: 'Animated hero section with fade-in', category: 'ecommerce' },
  { sampleId: 'sample-gallery', name: 'Product Gallery', description: 'Staggered product card animations', category: 'ecommerce' },
];

export function createWelcomeScreenState(
  recentProjects: ReadonlyArray<RecentProjectEntry>,
  templates: ReadonlyArray<ProjectTemplate>
): WelcomeScreenState {
  return {
    recentProjects,
    templates,
    tutorials: STANDARD_TUTORIALS,
    sampleProjects: STANDARD_SAMPLE_PROJECTS,
  };
}
