export interface FileMetric {
  filePath: string;
  lineCount: number;
  byteSize: number;
  exportCount: number;
  interfaceCount: number;
  typeCount: number;
  classCount: number;
  functionCount: number;
}

export interface ProjectMetricsSummary {
  totalFiles: number;
  totalLines: number;
  totalByteSize: number;
  averageLinesPerFile: number;
  totalExports: number;
  totalInterfaces: number;
  totalTypes: number;
  totalClasses: number;
  totalFunctions: number;
}

export class CodeMetricsEngine {
  public static analyzeSource(filePath: string, sourceCode: string): FileMetric {
    const lines = sourceCode.split('\n');
    const lineCount = lines.length;
    const byteSize = new TextEncoder().encode(sourceCode).length;

    const exportMatches = sourceCode.match(/export\s+/g) || [];
    const interfaceMatches = sourceCode.match(/export\s+interface\s+/g) || [];
    const typeMatches = sourceCode.match(/export\s+type\s+/g) || [];
    const classMatches = sourceCode.match(/export\s+class\s+/g) || [];
    const functionMatches = sourceCode.match(/export\s+function\s+/g) || [];

    return {
      filePath,
      lineCount,
      byteSize,
      exportCount: exportMatches.length,
      interfaceCount: interfaceMatches.length,
      typeCount: typeMatches.length,
      classCount: classMatches.length,
      functionCount: functionMatches.length,
    };
  }

  public static aggregateMetrics(metrics: FileMetric[]): ProjectMetricsSummary {
    let totalLines = 0;
    let totalByteSize = 0;
    let totalExports = 0;
    let totalInterfaces = 0;
    let totalTypes = 0;
    let totalClasses = 0;
    let totalFunctions = 0;

    for (const m of metrics) {
      totalLines += m.lineCount;
      totalByteSize += m.byteSize;
      totalExports += m.exportCount;
      totalInterfaces += m.interfaceCount;
      totalTypes += m.typeCount;
      totalClasses += m.classCount;
      totalFunctions += m.functionCount;
    }

    const totalFiles = metrics.length;
    const averageLinesPerFile = totalFiles > 0 ? Math.round(totalLines / totalFiles) : 0;

    return {
      totalFiles,
      totalLines,
      totalByteSize,
      averageLinesPerFile,
      totalExports,
      totalInterfaces,
      totalTypes,
      totalClasses,
      totalFunctions,
    };
  }
}
