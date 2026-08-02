import { SecurityFinding } from '../model/SecurityModel';

export class SecurityAnalyzer {
  public static analyzeCodeExposure(filePath: string, codeContent: string): SecurityFinding[] {
    const findings: SecurityFinding[] = [];

    // Check wildcard postMessage
    if (codeContent.includes("postMessage('*')") || codeContent.includes('postMessage("*")')) {
      findings.push({
        id: `sec_${Math.random().toString(36).substring(2, 6)}`,
        category: 'exposure',
        severity: 'high',
        message: `Insecure wildcard target origin 'postMessage("*")' detected in '${filePath}'.`,
        targetPath: filePath,
      });
    }

    // Check dangerous eval
    if (/\beval\s*\(/.test(codeContent)) {
      findings.push({
        id: `sec_${Math.random().toString(36).substring(2, 6)}`,
        category: 'sandbox',
        severity: 'critical',
        message: `Dangerous dynamic execution 'eval()' detected in '${filePath}'.`,
        targetPath: filePath,
      });
    }

    // Check innerHTML injection vulnerability
    if (codeContent.includes('.innerHTML =')) {
      findings.push({
        id: `sec_${Math.random().toString(36).substring(2, 6)}`,
        category: 'exposure',
        severity: 'medium',
        message: `Unsanitized '.innerHTML =' assignment detected in '${filePath}'.`,
        targetPath: filePath,
      });
    }

    return findings;
  }
}
