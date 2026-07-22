export interface VersionDetails {
  readonly major: number;
  readonly minor: number;
  readonly patch: number;
  readonly prerelease?: string;
}

export class VersionEngine {
  static parse(version: string): VersionDetails {
    const clean = version.replace(/^v/, '');
    const dashIdx = clean.indexOf('-');
    if (dashIdx !== -1) {
      const main = clean.substring(0, dashIdx);
      const prerelease = clean.substring(dashIdx + 1);
      const [major, minor, patch] = main.split('.').map(Number);
      return { major, minor, patch, prerelease };
    } else {
      const [major, minor, patch] = clean.split('.').map(Number);
      return { major: major || 0, minor: minor || 0, patch: patch || 0 };
    }
  }

  static compare(v1: string, v2: string): number {
    const p1 = this.parse(v1);
    const p2 = this.parse(v2);

    if (p1.major !== p2.major) return p1.major - p2.major;
    if (p1.minor !== p2.minor) return p1.minor - p2.minor;
    if (p1.patch !== p2.patch) return p1.patch - p2.patch;

    // Prerelease comparison: release is greater than prerelease
    if (!p1.prerelease && p2.prerelease) return 1;
    if (p1.prerelease && !p2.prerelease) return -1;
    if (p1.prerelease && p2.prerelease) {
      return p1.prerelease.localeCompare(p2.prerelease);
    }
    return 0;
  }

  static satisfies(version: string, constraint: string): boolean {
    if (!constraint || constraint === '*' || constraint === 'latest') {
      return true;
    }

    const cleanVersion = version.replace(/^v/, '').trim();
    const cleanConstraint = constraint.trim();

    if (cleanConstraint === cleanVersion) {
      return true;
    }

    if (cleanConstraint.startsWith('^')) {
      const base = cleanConstraint.substring(1);
      const c = this.parse(base);
      const v = this.parse(cleanVersion);
      return v.major === c.major && (v.minor > c.minor || (v.minor === c.minor && v.patch >= c.patch));
    }

    if (cleanConstraint.startsWith('~')) {
      const base = cleanConstraint.substring(1);
      const c = this.parse(base);
      const v = this.parse(cleanVersion);
      return v.major === c.major && v.minor === c.minor && v.patch >= c.patch;
    }

    if (cleanConstraint.startsWith('>=')) {
      const base = cleanConstraint.substring(2);
      return this.compare(cleanVersion, base) >= 0;
    }

    if (cleanConstraint.startsWith('>')) {
      const base = cleanConstraint.substring(1);
      return this.compare(cleanVersion, base) > 0;
    }

    if (cleanConstraint.startsWith('<=')) {
      const base = cleanConstraint.substring(2);
      return this.compare(cleanVersion, base) <= 0;
    }

    if (cleanConstraint.startsWith('<')) {
      const base = cleanConstraint.substring(1);
      return this.compare(cleanVersion, base) < 0;
    }

    return false;
  }
}
