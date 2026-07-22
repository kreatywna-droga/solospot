import * as fs from 'fs/promises';
import * as path from 'path';
import { DeployProvider } from '../DeployProvider';
import { DeployRequest } from '../DeployRequest';
import { DeployResult } from '../DeployResult';
import { DeploymentCapability } from '../DeploymentCapability';

export class StaticExportProvider implements DeployProvider {
  readonly type = 'static-export';
  readonly capabilities: ReadonlyArray<DeploymentCapability> = ['OVERWRITE'];

  async deploy(request: DeployRequest): Promise<DeployResult> {
    const start = Date.now();
    const dest = request.target.destination;

    if (dest === undefined || dest === null || dest === '') {
      return {
        success: false,
        deployedArtifactsCount: 0,
        errors: ['Static export failed: Missing destination folder in target'],
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
        url: path.resolve(dest),
        deployedArtifactsCount: request.artifacts.length,
        errors: [],
        durationMs: Date.now() - start
      };
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        deployedArtifactsCount: 0,
        errors: [`Static export failed: ${errMsg}`],
        durationMs: Date.now() - start
      };
    }
  }
}
