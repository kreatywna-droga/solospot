import { AuthoringProject, DraftStatus } from './AuthoringProject';

export interface WorkspaceState {
  projectId: string | null;
  activePanel: 'explorer' | 'properties' | 'preview' | 'validation' | 'build' | 'publish';
  activeDocument: string | null;
  selection: string | null;
  previewVisible: boolean;
}

export interface WorkspaceEvent {
  type: 'PROJECT_OPENED' | 'PROJECT_CLOSED' | 'DRAFT_UPDATED' | 'WORKSPACE_CHANGED' | 
        'AUTOSAVE_STARTED' | 'AUTOSAVE_COMPLETED' | 'WORKSPACE_RECOVERED';
  projectId?: string;
  panel?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export type WorkspaceEventListener = (event: WorkspaceEvent) => void;

export class Workspace {
  private _project: AuthoringProject | null = null;
  private _state: WorkspaceState = {
    projectId: null,
    activePanel: 'explorer',
    activeDocument: null,
    selection: null,
    previewVisible: false
  };
  private listeners: WorkspaceEventListener[] = [];

  get project(): AuthoringProject | null { return this._project; }
  get state(): WorkspaceState { return { ...this._state }; }

  openProject(project: AuthoringProject): void {
    this._project = project;
    this._state.projectId = project.id;
    this.emit({ type: 'PROJECT_OPENED', projectId: project.id, timestamp: new Date().toISOString() });
  }

  closeProject(): void {
    if (this._project) {
      this.emit({ type: 'PROJECT_CLOSED', projectId: this._project.id, timestamp: new Date().toISOString() });
    }
    this._project = null;
    this._state = {
      projectId: null,
      activePanel: 'explorer',
      activeDocument: null,
      selection: null,
      previewVisible: false
    };
  }

  setActivePanel(panel: WorkspaceState['activePanel']): void {
    this._state.activePanel = panel;
    this.emit({ 
      type: 'WORKSPACE_CHANGED', 
      projectId: this._project?.id,
      panel,
      timestamp: new Date().toISOString() 
    });
  }

  setActiveDocument(documentId: string | null): void {
    this._state.activeDocument = documentId;
    this.emit({ type: 'WORKSPACE_CHANGED', timestamp: new Date().toISOString() });
  }

  setSelection(selectionId: string | null): void {
    this._state.selection = selectionId;
  }

  togglePreview(visible: boolean): void {
    this._state.previewVisible = visible;
  }

  updateProject(project: AuthoringProject): void {
    this._project = project;
    this.emit({ 
      type: 'DRAFT_UPDATED', 
      projectId: project.id, 
      timestamp: new Date().toISOString() 
    });
  }

  autosave(): void {
    if (!this._project) return;
    
    this.emit({ type: 'AUTOSAVE_STARTED', projectId: this._project.id, timestamp: new Date().toISOString() });
    
    this._project = {
      ...this._project,
      draftStatus: 'saved'
    };
    
    this.emit({ type: 'AUTOSAVE_COMPLETED', projectId: this._project.id, timestamp: new Date().toISOString() });
  }

  recover(): void {
    this.emit({ type: 'WORKSPACE_RECOVERED', timestamp: new Date().toISOString() });
  }

  addEventListener(listener: WorkspaceEventListener): void {
    this.listeners.push(listener);
  }

  removeEventListener(listener: WorkspaceEventListener): void {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  private emit(event: WorkspaceEvent): void {
    for (const listener of this.listeners) {
      listener(event);
    }
  }
}