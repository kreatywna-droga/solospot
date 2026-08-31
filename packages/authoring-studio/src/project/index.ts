/**
 * Project Management Barrel Export — Sprint S5 Studio Application Features & Production UX
 *
 * Project lifecycle, file operations, workspace persistence, autosave, crash recovery,
 * startup experience, templates, and recent projects.
 *
 * NO DOM, NO React, NO Browser API.
 */

export * from './ProjectMetadata';
export * from './ProjectSettings';
export * from './ProjectManager';
export * from './RecentProjects';
export * from './ProjectTemplates';
export * from './ProjectAutosave';
export {
  type RecoveryStatus,
  type RecoveryToken,
  type SessionRecoveryReport,
  detectDirtyDocument,
  createRecoveryToken
} from './ProjectRecovery';
export * from './WorkspacePersistence';
export * from './StartupExperience';
