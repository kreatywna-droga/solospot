export interface ThemeComponent {
  name: string;
  type: 'layout' | 'widget' | 'atom';
  render(props: Record<string, any>): string;
}

export class ComponentNotFoundException extends Error {
  constructor(componentName: string) {
    super(`Theme component not found in registry: '${componentName}'`);
    this.name = 'ComponentNotFoundException';
  }
}

export class ComponentRegistry {
  private readonly components = new Map<string, ThemeComponent>();

  public register(componentName: string, component: ThemeComponent): void {
    this.components.set(componentName.toLowerCase(), component);
  }

  public resolve(componentName: string): ThemeComponent {
    const key = componentName.toLowerCase();
    const component = this.components.get(key);
    if (!component) {
      throw new ComponentNotFoundException(componentName);
    }
    return component;
  }

  public has(componentName: string): boolean {
    return this.components.has(componentName.toLowerCase());
  }

  public clear(): void {
    this.components.clear();
  }
}
