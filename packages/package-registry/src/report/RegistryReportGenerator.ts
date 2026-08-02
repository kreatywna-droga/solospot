import { PackageManifest } from '../manifest/PackageManifestModel';
import { ManifestValidator, ValidationResult } from '../validator/ManifestValidator';
import { PackageDependencyGraph, GraphReport } from '../graph/PackageDependencyGraph';

export interface RegistryReportData {
  timestamp: string;
  totalPackages: number;
  totalCapabilities: number;
  validation: ValidationResult;
  graph: GraphReport;
  packages: PackageManifest[];
}

export class RegistryReportGenerator {
  public static generate(manifests: PackageManifest[]): RegistryReportData {
    const validation = ManifestValidator.validateRegistry(manifests);

    const graphEngine = new PackageDependencyGraph();
    graphEngine.buildGraph(manifests);
    const graphReport = graphEngine.generateReport();

    const allCapabilities = new Set<string>();
    for (const m of manifests) {
      if (m.capabilities) {
        for (const c of m.capabilities) {
          allCapabilities.add(c.id);
        }
      }
    }

    return {
      timestamp: new Date().toISOString(),
      totalPackages: manifests.length,
      totalCapabilities: allCapabilities.size,
      validation,
      graph: graphReport,
      packages: manifests,
    };
  }

  public static toMarkdown(data: RegistryReportData): string {
    const lines: string[] = [];

    lines.push('# Package Registry Analysis Report');
    lines.push('');
    lines.push(`- **Timestamp:** \`${data.timestamp}\``);
    lines.push(`- **Total Registered Packages:** ${data.totalPackages}`);
    lines.push(`- **Total Capabilities Discovered:** ${data.totalCapabilities}`);
    lines.push(`- **Validation Status:** ${data.validation.isValid ? 'VALID ✅' : 'INVALID ❌'}`);
    lines.push(`- **Dependency Cycles:** ${data.graph.hasCycles ? `⚠️ ${data.graph.cycles.length} cycles detected` : 'None ✅'}`);
    lines.push('');

    lines.push('## Registered Packages');
    lines.push('');
    lines.push('| ID | Name | Version | Type | Author | Capabilities |');
    lines.push('|----|------|---------|------|--------|--------------|');

    for (const p of data.packages) {
      const caps = p.capabilities ? p.capabilities.map(c => c.name).join(', ') : 'None';
      lines.push(`| \`${p.id}\` | ${p.name} | \`${p.version}\` | \`${p.type}\` | ${p.author.name} | ${caps} |`);
    }
    lines.push('');

    if (data.graph.loadOrder.length > 0) {
      lines.push('## Recommended Load Order');
      lines.push('');
      data.graph.loadOrder.forEach((id, idx) => {
        lines.push(`${idx + 1}. \`${id}\``);
      });
      lines.push('');
    }

    if (data.validation.errors.length > 0) {
      lines.push('## Validation Errors');
      lines.push('');
      for (const err of data.validation.errors) {
        lines.push(`- ❌ **[${err.field}]**: ${err.message} (${err.code})`);
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  public static toJSON(data: RegistryReportData): string {
    return JSON.stringify(data, null, 2);
  }
}
