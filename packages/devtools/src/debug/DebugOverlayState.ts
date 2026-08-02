export interface ComponentDiagnosticInfo {
  componentId: string;
  componentType: string;
  renderTimeMs: number;
  lastRenderTimestamp: string;
  bounds?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface ValidationErrorEntry {
  id: string;
  componentId?: string;
  property?: string;
  message: string;
  timestamp: string;
}

export interface WarningEntry {
  id: string;
  message: string;
  timestamp: string;
}

export class DebugOverlayState {
  private isVisible: boolean = false;
  private activeComponent: ComponentDiagnosticInfo | null = null;
  private componentHistory: Map<string, ComponentDiagnosticInfo> = new Map();
  private validationErrors: ValidationErrorEntry[] = [];
  private warnings: WarningEntry[] = [];
  private maxEntries: number = 100;

  public toggleVisibility(): boolean {
    this.isVisible = !this.isVisible;
    return this.isVisible;
  }

  public show(): void {
    this.isVisible = true;
  }

  public hide(): void {
    this.isVisible = false;
  }

  public getIsVisible(): boolean {
    return this.isVisible;
  }

  public reportComponentRender(
    componentId: string,
    componentType: string,
    renderTimeMs: number,
    bounds?: ComponentDiagnosticInfo['bounds']
  ): void {
    const info: ComponentDiagnosticInfo = {
      componentId,
      componentType,
      renderTimeMs,
      lastRenderTimestamp: new Date().toISOString(),
      bounds,
    };
    this.activeComponent = info;
    this.componentHistory.set(componentId, info);
  }

  public reportValidationError(message: string, componentId?: string, property?: string): void {
    const entry: ValidationErrorEntry = {
      id: `err_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      componentId,
      property,
      message,
      timestamp: new Date().toISOString(),
    };
    this.validationErrors.push(entry);
    if (this.validationErrors.length > this.maxEntries) {
      this.validationErrors.shift();
    }
  }

  public reportWarning(message: string): void {
    const entry: WarningEntry = {
      id: `warn_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      message,
      timestamp: new Date().toISOString(),
    };
    this.warnings.push(entry);
    if (this.warnings.length > this.maxEntries) {
      this.warnings.shift();
    }
  }

  public getActiveComponent(): ComponentDiagnosticInfo | null {
    return this.activeComponent;
  }

  public getComponentInfo(componentId: string): ComponentDiagnosticInfo | undefined {
    return this.componentHistory.get(componentId);
  }

  public getValidationErrors(): ValidationErrorEntry[] {
    return [...this.validationErrors];
  }

  public getWarnings(): WarningEntry[] {
    return [...this.warnings];
  }

  public clearDiagnostics(): void {
    this.activeComponent = null;
    this.componentHistory.clear();
    this.validationErrors = [];
    this.warnings = [];
  }
}
