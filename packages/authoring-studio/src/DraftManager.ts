import { AuthoringProject, DraftStatus, Checkpoint } from './AuthoringProject';
import { Workspace, WorkspaceEvent } from './Workspace';

export class DraftManager {
  constructor(private readonly workspace: Workspace) {}

  createDraft(project: AuthoringProject): AuthoringProject {
    const draft = {
      ...project,
      draftStatus: 'dirty' as DraftStatus
    };
    
    this.workspace.updateProject(draft);
    this.createCheckpoint(draft, 'Draft created');
    
    return draft;
  }

  commitDraft(project: AuthoringProject): AuthoringProject {
    const committed = {
      ...project,
      draftStatus: 'clean' as DraftStatus
    };
    
    this.workspace.updateProject(committed);
    this.createCheckpoint(committed, 'Draft committed');
    
    return committed;
  }

  restoreDraft(project: AuthoringProject, checkpointId: string): AuthoringProject | null {
    const checkpoint = project.history.find(c => c.id === checkpointId);
    if (!checkpoint) return null;
    
    const restored = {
      ...project,
      draftStatus: 'clean' as DraftStatus
    };
    
    this.workspace.updateProject(restored);
    return restored;
  }

  private createCheckpoint(project: AuthoringProject, description: string): void {
    const checkpoint: Checkpoint = {
      id: `cp-${Date.now()}`,
      timestamp: new Date().toISOString(),
      description,
      changes: []
    };
    
    this.workspace.updateProject({
      ...project,
      history: [...(project.history || []), checkpoint]
    });
  }
}

export class SessionRecovery {
  private storageKey = 'authoring-studio-session';

  save(project: AuthoringProject): void {
    const session = {
      projectId: project.id,
      project: project,
      timestamp: new Date().toISOString()
    };
    
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.storageKey, JSON.stringify(session));
    }
  }

  recover(): AuthoringProject | null {
    if (typeof localStorage === 'undefined') return null;
    
    try {
      const sessionStr = localStorage.getItem(this.storageKey);
      if (!sessionStr) return null;
      
      const session = JSON.parse(sessionStr);
      const sessionTime = new Date(session.timestamp).getTime();
      const now = Date.now();
      
      if (now - sessionTime > 24 * 60 * 60 * 1000) {
        return null;
      }
      
      return session.project;
    } catch {
      return null;
    }
  }

  clear(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(this.storageKey);
    }
  }
}