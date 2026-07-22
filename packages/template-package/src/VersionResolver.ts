export interface Version {
  major: number;
  minor: number;
  patch: number;
  prerelease?: string;
}

export interface VersionRange {
  operator: '=' | '>' | '>=' | '<' | '<=' | '^' | '~';
  version: Version;
  comparator?: string;
}

export class VersionResolver {
  parse(version: string): Version {
    const match = version.match(/^(\d+)\.(\d+)\.(\d+)(?:-([a-zA-Z0-9.-]+))?$/);
    if (!match) {
      throw new Error(`Invalid version: ${version}`);
    }
    return {
      major: parseInt(match[1], 10),
      minor: parseInt(match[2], 10),
      patch: parseInt(match[3], 10),
      prerelease: match[4]
    };
  }

  compare(v1: Version, v2: Version): number {
    if (v1.major !== v2.major) return v1.major - v2.major;
    if (v1.minor !== v2.minor) return v1.minor - v2.minor;
    if (v1.patch !== v2.patch) return v1.patch - v2.patch;
    return 0;
  }

  satisfies(version: string, range: string): boolean {
    const v = this.parseVersion(version);
    
    if (range.startsWith('^')) {
      const base = this.parseVersion(range.slice(1));
      if (v.major !== base.major) return false;
      if (v.major === 0) {
        return v.minor === base.minor && v.patch >= base.patch;
      }
      return this.compare(v, base) >= 0;
    }
    
    if (range.startsWith('~')) {
      const base = this.parseVersion(range.slice(1));
      if (v.major !== base.major || v.minor !== base.minor) return false;
      return v.patch >= base.patch;
    }
    
    if (range.startsWith('>=')) {
      const base = this.parseVersion(range.slice(2).trim());
      return this.compare(v, base) >= 0;
    }
    
    if (range.startsWith('<=')) {
      const base = this.parseVersion(range.slice(2).trim());
      return this.compare(v, base) <= 0;
    }
    
    if (range.startsWith('>')) {
      const base = this.parseVersion(range.slice(1).trim());
      return this.compare(v, base) > 0;
    }
    
    if (range.startsWith('<')) {
      const base = this.parseVersion(range.slice(1).trim());
      return this.compare(v, base) < 0;
    }
    
    return this.compare(v, this.parseVersion(range)) === 0;
  }

  private parseVersion(version: string): Version {
    const parts = version.split('.').map(p => parseInt(p, 10) || 0);
    return {
      major: parts[0] || 0,
      minor: parts[1] || 0,
      patch: parts[2] || 0
    };
  }

  difference(v1: Version, v2: Version): Version {
    return {
      major: Math.abs(v1.major - v2.major),
      minor: Math.abs(v1.minor - v2.minor),
      patch: Math.abs(v1.patch - v2.patch)
    };
  }

  increment(version: string, part: 'major' | 'minor' | 'patch' = 'patch'): string {
    const v = this.parse(version);
    switch (part) {
      case 'major': return `${v.major + 1}.0.0`;
      case 'minor': return `${v.major}.${v.minor + 1}.0`;
      case 'patch': return `${v.major}.${v.minor}.${v.patch + 1}`;
    }
  }
}

export const defaultVersionResolver = new VersionResolver();