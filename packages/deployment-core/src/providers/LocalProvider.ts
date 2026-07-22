import * as fs from 'fs/promises';
import * as path from 'path';
import { DeployProvider } from '../DeployProvider';
import { DeployRequest } from '../DeployRequest';
import { DeployResult } from '../DeployResult';
import { DeploymentCapability } from '../DeploymentCapability';

export class LocalProvider implements DeployProvider {
  readonly type = 'local';
  readonly capabilities: ReadonlyArray<DeploymentCapability> = ['OVERWRITE', 'ROLLBACK'];

  async deploy(request: DeployRequest): Promise<DeployResult> {
    const start = Date.now();
    const dest = request.target.destination;

    if (!dest) {
      return {
        success: false,
        deployedArtifactsCount: 0,
        errors: ['Deployment failed: Missing destination folder in target'],
        durationMs: Date.now() - start
      };
    }

    try {
      await fs.mkdir(dest, { recursive: true });

      for (const artifact of request.artifacts) {
        const filePath = path.join(dest, artifact.path);
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        
        const data = typeof artifact.content === 'string' ? artifact.content : Buffer.from(artifact.content);
        await fs.writeFile(filePath, data);
      }

      return {
        success: true,
        url: `file:///${path.resolve(dest).replace(/\\/g, '/')}`,
        deployedArtifactsCount: request.artifacts.length,
        errors: [],
        durationMs: Date.now() - start
      };
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        deployedArtifactsCount: 0,
        errors: [`Local deployment failed: ${errMsg}`],
        durationMs: Date.now() - start
      };
    }
  }

  async rollback(request: DeployRequest): Promise<DeployResult> {
    const start = Date.now();
    const dest = request.target.destination;

    if (!dest) {
      return {
        success: false,
        deployedArtifactsCount: 0,
        errors: ['Rollback failed: Missing destination folder in target'],
        durationMs: Date.now() - start
      };
    }

    try {
      for (const artifact of request.artifacts) {
        const filePath = path.join(dest, artifact.path);
        try {
          await fs.unlink(filePath);
        } catch {
          // Ignore files that are already gone
        }
      }
      return {
        success: true,
        deployedArtifactsCount: 0,
        errors: [],
        durationMs: Date.now() - start
      };
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        deployedArtifactsCount: 0,
        errors: [`Local rollback failed: ${errMsg}`],
        durationMs: Date.now() - start
      };
    }
  }
}
