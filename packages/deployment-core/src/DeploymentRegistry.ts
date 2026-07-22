import { DeployProvider } from './DeployProvider';
import { DeploymentTarget } from './DeploymentTarget';

export interface DeploymentRegistry {
  register(type: string, provider: DeployProvider): void;
  unregister(type: string): void;
  get(type: string): DeployProvider | undefined;
  resolve(target: DeploymentTarget): DeployProvider;
}

export class DefaultDeploymentRegistry implements DeploymentRegistry {
  private readonly providers = new Map<string, DeployProvider>();

  register(type: string, provider: DeployProvider): void {
    this.providers.set(type.toLowerCase(), provider);
  }

  unregister(type: string): void {
    this.providers.delete(type.toLowerCase());
  }

  get(type: string): DeployProvider | undefined {
    return this.providers.get(type.toLowerCase());
  }

  resolve(target: DeploymentTarget): DeployProvider {
    const provider = this.get(target.type);
    if (!provider) {
      throw new Error(`Deployment provider not found for target type: ${target.type}`);
    }
    return provider;
  }
}
