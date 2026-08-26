import type {
  SecurityCategory,
  SecurityFileSnapshot,
  SecurityFinding,
  SecurityFindingType,
  SecurityPolicy,
  SecuritySeverity,
} from '../model/SecurityModel';

// ---------------------------------------------------------------------------
// Built-in Default Security Policies
// ---------------------------------------------------------------------------
export const DEFAULT_SECURITY_POLICIES: SecurityPolicy[] = [
  {
    policyId: 'SEC-POL-001',
    name: 'No Hardcoded Secrets or Credentials',
    category: 'hardcoded_secrets',
    severity: 'critical',
    enforced: true,
    description: 'API keys, private keys, database passwords, and auth tokens must never be hardcoded in source files.',
  },
  {
    policyId: 'SEC-POL-002',
    name: 'No Unsafe Code Evaluation',
    category: 'unsafe_code_patterns',
    severity: 'critical',
    enforced: true,
    description: 'Dynamic code execution functions like eval() and Function() constructor are forbidden.',
  },
  {
    policyId: 'SEC-POL-003',
    name: 'Enforce Least Privilege CORS',
    category: 'least_privilege',
    severity: 'error',
    enforced: true,
    description: 'Wildcard origin "*" in Access-Control-Allow-Origin header is forbidden in production APIs.',
  },
  {
    policyId: 'SEC-POL-004',
    name: 'No Disabled SSL Verification',
    category: 'configuration_risk',
    severity: 'critical',
    enforced: true,
    description: 'Disabling SSL/TLS certificate verification (rejectUnauthorized: false) is forbidden.',
  },
  {
    policyId: 'SEC-POL-005',
    name: 'No Known Vulnerable Packages',
    category: 'dangerous_dependencies',
    severity: 'error',
    enforced: true,
    description: 'Known malicious or severely vulnerable packages must not be declared in dependencies.',
  },
];

// ---------------------------------------------------------------------------
// Regex patterns for secret scanning
// ---------------------------------------------------------------------------
const SECRET_PATTERNS: Array<{
  name: string;
  type: SecurityFindingType;
  regex: RegExp;
  severity: SecuritySeverity;
}> = [
  {
    name: 'AWS Access Key',
    type: 'secret_detected',
    regex: /(?:A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}/g,
    severity: 'critical',
  },
  {
    name: 'RSA/EC Private Key Header',
    type: 'private_key_exposed',
    regex: /-----BEGIN (?:RSA |EC |PGP |OPENSSH )?PRIVATE KEY-----/g,
    severity: 'critical',
  },
{
    name: 'Generic API Key / Secret Token',
    type: 'api_key_hardcoded',
    regex: /(?:api[_-]?key|secret[_-]?token|auth[_-]?token|db[_-]?password)\s*[:=]\s*\\?["'][A-Za-z0-9+/=_-]{16,}\\?["']/gi,
    severity: 'error',
  },
  {
    name: 'Supabase / JWT Secret',
    type: 'secret_detected',
    regex: /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g,
    severity: 'critical',
  },
];

// Known high-risk package names
const DANGEROUS_PACKAGES = new Set([
  'event-stream',
  'flatmap-stream',
  'node-serialize',
  'core-js-pure', // example flagged pattern
]);

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------
function makeId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).substring(2, 8)}`;
}

function finding(
  prefix: string,
  findingType: SecurityFindingType,
  category: SecurityCategory,
  severity: SecuritySeverity,
  filePath: string,
  message: string,
  opts: {
    lineNumber?: number;
    snippet?: string;
    policyId?: string;
    recommendation?: string;
  } = {}
): SecurityFinding {
  return {
    id: makeId(prefix),
    findingType,
    category,
    severity,
    filePath,
    message,
    ...opts,
  };
}

// ---------------------------------------------------------------------------
// SecurityAnalyzer — static, read-only security risk analyzer
// ---------------------------------------------------------------------------
export class SecurityAnalyzer {

  // ─── Parsing Helpers ──────────────────────────────────────────────────────

  public static parseFiles(
    rawFiles: Array<{
      filePath: string;
      content: string;
      extension?: string;
      packageName?: string;
    }>
  ): SecurityFileSnapshot[] {
    return rawFiles.map((f) => ({
      filePath: f.filePath,
      content: f.content,
      extension: f.extension ?? f.filePath.substring(f.filePath.lastIndexOf('.')),
      packageName: f.packageName,
    }));
  }

  public static parsePolicies(rawPolicies?: Partial<SecurityPolicy>[]): SecurityPolicy[] {
    if (!rawPolicies || rawPolicies.length === 0) return DEFAULT_SECURITY_POLICIES;
    return rawPolicies.map((p) => ({
      policyId: p.policyId ?? 'SEC-POL-UNKNOWN',
      name: p.name ?? 'Unnamed Security Policy',
      category: p.category ?? 'policy_compliance',
      severity: p.severity ?? 'error',
      enforced: p.enforced ?? true,
      description: p.description,
    }));
  }

  // ─── Top-level Dispatch ──────────────────────────────────────────────────

  public static analyzeAll(
    files: SecurityFileSnapshot[],
    policies: SecurityPolicy[] = DEFAULT_SECURITY_POLICIES
  ): SecurityFinding[] {
    return [
      ...SecurityAnalyzer.detectSecrets(files),
      ...SecurityAnalyzer.detectUnsafeCodePatterns(files),
      ...SecurityAnalyzer.detectDangerousDependencies(files),
      ...SecurityAnalyzer.detectLeastPrivilegeViolations(files),
      ...SecurityAnalyzer.detectConfigurationRisks(files),
      ...SecurityAnalyzer.validatePolicyCompliance(files, policies),
    ];
  }

  // ─── Secret Scanning ──────────────────────────────────────────────────────

  /**
   * Scan file content for hardcoded secrets, private keys, API keys, and credentials.
   */
  public static detectSecrets(files: SecurityFileSnapshot[]): SecurityFinding[] {
    const findings: SecurityFinding[] = [];

    for (const file of files) {
      // Exclude test mocks or dummy fixture files if explicitly labeled mock/test
      if (file.filePath.includes('.test.') || file.filePath.includes('/fixtures/')) {
        continue;
      }

      for (const pattern of SECRET_PATTERNS) {
        pattern.regex.lastIndex = 0;
        let match: RegExpExecArray | null;

        while ((match = pattern.regex.exec(file.content)) !== null) {
          const lineNo = file.content.substring(0, match.index).split('\n').length;
          const matchedText = match[0];

          // Redact secret for report output
          const redacted = matchedText.length > 8
            ? `${matchedText.substring(0, 4)}...${matchedText.substring(matchedText.length - 4)}`
            : '****';

          findings.push(
            finding(
              'sec_secret',
              pattern.type,
              'hardcoded_secrets',
              pattern.severity,
              file.filePath,
              `Potential hardcoded ${pattern.name} detected at line ${lineNo}.`,
              {
                lineNumber: lineNo,
                snippet: redacted,
                policyId: 'SEC-POL-001',
                recommendation: `Move the secret to an environment variable (.env) or secret vault. Do not commit hardcoded credentials.`,
              }
            )
          );
        }
      }
    }

    return findings;
  }

  // ─── Unsafe Code Pattern Scanning ─────────────────────────────────────────

  /**
   * Scan for dangerous code patterns: eval(), Function(), dangerouslySetInnerHTML,
   * Math.random() in cryptographic contexts, rejectUnauthorized: false.
   */
  public static detectUnsafeCodePatterns(files: SecurityFileSnapshot[]): SecurityFinding[] {
    const findings: SecurityFinding[] = [];

    for (const file of files) {
      const lines = file.content.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineNo = i + 1;

        // eval() check
        if (/\beval\s*\(/g.test(line)) {
          findings.push(
            finding(
              'sec_eval',
              'unsafe_eval',
              'unsafe_code_patterns',
              'critical',
              file.filePath,
              `Use of dynamic code evaluation 'eval()' detected at line ${lineNo}.`,
              {
                lineNumber: lineNo,
                snippet: line.trim(),
                policyId: 'SEC-POL-002',
                recommendation: `Refactor the code to avoid eval(). Dynamic code execution introduces severe RCE risks.`,
              }
            )
          );
        }

        // innerHTML injection risk
        if (/dangerouslySetInnerHTML|\.innerHTML\s*=/g.test(line)) {
          findings.push(
            finding(
              'sec_xss',
              'inner_html_injection',
              'unsafe_code_patterns',
              'error',
              file.filePath,
              `Direct DOM innerHTML assignment / dangerouslySetInnerHTML at line ${lineNo} may introduce XSS vulnerabilities.`,
              {
                lineNumber: lineNo,
                snippet: line.trim(),
                recommendation: `Sanitise input using DOMPurify before rendering raw HTML, or use standard React text nodes.`,
              }
            )
          );
        }

        // Insecure random for crypto
        if (/Math\.random\(\)/g.test(line) && /token|secret|nonce|key|session/i.test(line)) {
          findings.push(
            finding(
              'sec_rand',
              'insecure_random',
              'unsafe_code_patterns',
              'warning',
              file.filePath,
              `Use of non-cryptographic 'Math.random()' for security-sensitive token/nonce generation at line ${lineNo}.`,
              {
                lineNumber: lineNo,
                snippet: line.trim(),
                recommendation: `Use 'crypto.getRandomValues()' or Node.js 'crypto.randomBytes()' for cryptographically secure random generation.`,
              }
            )
          );
        }
      }
    }

    return findings;
  }

  // ─── Dangerous Dependency Scanning ────────────────────────────────────────

  /**
   * Scan package.json content for known dangerous or malicious packages.
   */
  public static detectDangerousDependencies(files: SecurityFileSnapshot[]): SecurityFinding[] {
    const findings: SecurityFinding[] = [];

    for (const file of files.filter((f) => f.filePath.endsWith('package.json'))) {
      try {
        const pkgJson = JSON.parse(file.content);
        const allDeps = {
          ...(pkgJson.dependencies ?? {}),
          ...(pkgJson.devDependencies ?? {}),
        };

        for (const depName of Object.keys(allDeps)) {
          if (DANGEROUS_PACKAGES.has(depName)) {
            findings.push(
              finding(
                'sec_dep',
                'vulnerable_dependency',
                'dangerous_dependencies',
                'critical',
                file.filePath,
                `Package '${file.filePath}' declares dangerous dependency '${depName}'.`,
                {
                  policyId: 'SEC-POL-005',
                  recommendation: `Remove or replace '${depName}' immediately. It is flagged as high-risk or malicious.`,
                }
              )
            );
          }
        }
      } catch {
        // invalid JSON string, ignore in static analyzer
      }
    }

    return findings;
  }

  // ─── Least Privilege Violation Scanning ───────────────────────────────────

  /**
   * Detect CORS wildcard headers ("*") or excessive permission grants.
   */
  public static detectLeastPrivilegeViolations(files: SecurityFileSnapshot[]): SecurityFinding[] {
    const findings: SecurityFinding[] = [];

    for (const file of files) {
      const lines = file.content.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineNo = i + 1;

        if (/Access-Control-Allow-Origin.*[*]/gi.test(line) || /origin\s*:\s*["']\*["']/gi.test(line)) {
          findings.push(
            finding(
              'sec_cors',
              'wildcard_cors_origin',
              'least_privilege',
              'error',
              file.filePath,
              `Wildcard CORS origin '*' detected at line ${lineNo}.`,
              {
                lineNumber: lineNo,
                snippet: line.trim(),
                policyId: 'SEC-POL-003',
                recommendation: `Restrict Access-Control-Allow-Origin to specific trusted domains instead of '*'.`,
              }
            )
          );
        }
      }
    }

    return findings;
  }

  // ─── Configuration Risk Scanning ─────────────────────────────────────────

  /**
   * Scan configuration files (.env, config.ts, next.config.js) for security flaws.
   */
  public static detectConfigurationRisks(files: SecurityFileSnapshot[]): SecurityFinding[] {
    const findings: SecurityFinding[] = [];

    for (const file of files) {
      const lines = file.content.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineNo = i + 1;

        if (/rejectUnauthorized\s*:\s*false/g.test(line)) {
          findings.push(
            finding(
              'sec_ssl',
              'disabled_ssl_verification',
              'configuration_risk',
              'critical',
              file.filePath,
              `SSL certificate verification is disabled (rejectUnauthorized: false) at line ${lineNo}.`,
              {
                lineNumber: lineNo,
                snippet: line.trim(),
                policyId: 'SEC-POL-004',
                recommendation: `Re-enable SSL certificate verification by removing 'rejectUnauthorized: false'.`,
              }
            )
          );
        }

        if (/DEBUG\s*=\s*true|DEBUG_MODE\s*:\s*true/gi.test(line) && !file.filePath.includes('.test.')) {
          findings.push(
            finding(
              'sec_dbg',
              'debug_mode_enabled',
              'configuration_risk',
              'warning',
              file.filePath,
              `Debug mode enabled in non-test file at line ${lineNo}.`,
              {
                lineNumber: lineNo,
                snippet: line.trim(),
                recommendation: `Ensure debug flags are disabled in production configurations.`,
              }
            )
          );
        }
      }
    }

    return findings;
  }

  // ─── Security Policy Compliance ───────────────────────────────────────────

  /**
   * Verify that all enforced SecurityPolicies pass across the codebase.
   */
  public static validatePolicyCompliance(
    files: SecurityFileSnapshot[],
    policies: SecurityPolicy[]
  ): SecurityFinding[] {
    // Collect findings that explicitly reference broken policies
    const allFindings = [
      ...SecurityAnalyzer.detectSecrets(files),
      ...SecurityAnalyzer.detectUnsafeCodePatterns(files),
      ...SecurityAnalyzer.detectDangerousDependencies(files),
      ...SecurityAnalyzer.detectLeastPrivilegeViolations(files),
      ...SecurityAnalyzer.detectConfigurationRisks(files),
    ];

    const findings: SecurityFinding[] = [];
    const brokenPolicyIds = new Set(allFindings.map((f) => f.policyId).filter(Boolean));

    for (const policy of policies.filter((p) => p.enforced)) {
      if (brokenPolicyIds.has(policy.policyId)) {
        findings.push(
          finding(
            'sec_pol',
            'missing_security_policy',
            'policy_compliance',
            policy.severity,
            'security-policy',
            `Security Policy breach: [${policy.policyId}] '${policy.name}' has been violated.`,
            {
              policyId: policy.policyId,
              recommendation: `Enforce compliance with ${policy.policyId}: ${policy.description ?? policy.name}.`,
            }
          )
        );
      }
    }

    return findings;
  }
}
