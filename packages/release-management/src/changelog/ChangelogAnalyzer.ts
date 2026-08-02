export interface ChangelogEntry {
  version: string;
  date?: string;
  added: string[];
  changed: string[];
  fixed: string[];
  breaking: string[];
}

export class ChangelogAnalyzer {
  public static parseChangelog(markdownContent: string): ChangelogEntry[] {
    const entries: ChangelogEntry[] = [];
    const versionHeaderRegex = /##\s*\[?([0-9]+\.[0-9]+\.[0-9]+[^\]\s]*)\]?(?:\s*-\s*([0-9]{4}-[0-9]{2}-[0-9]{2}))?/g;

    const sections = markdownContent.split(/##\s+/);

    for (const sec of sections) {
      if (!sec.trim()) continue;
      const lines = sec.split('\n');
      const firstLine = lines[0];

      const headerMatch = /\[?([0-9]+\.[0-9]+\.[0-9]+[^\]\s]*)\]?(?:\s*-\s*([0-9]{4}-[0-9]{2}-[0-9]{2}))?/.exec(firstLine);
      if (!headerMatch) continue;

      const version = headerMatch[1];
      const date = headerMatch[2];

      const added: string[] = [];
      const changed: string[] = [];
      const fixed: string[] = [];
      const breaking: string[] = [];

      let currentCategory = '';
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith('### Added')) currentCategory = 'added';
        else if (line.startsWith('### Changed')) currentCategory = 'changed';
        else if (line.startsWith('### Fixed')) currentCategory = 'fixed';
        else if (line.startsWith('### Breaking')) currentCategory = 'breaking';
        else if (line.startsWith('- ') || line.startsWith('* ')) {
          const item = line.substring(2).trim();
          if (currentCategory === 'added') added.push(item);
          else if (currentCategory === 'changed') changed.push(item);
          else if (currentCategory === 'fixed') fixed.push(item);
          else if (currentCategory === 'breaking') breaking.push(item);
        }
      }

      entries.push({
        version,
        date,
        added,
        changed,
        fixed,
        breaking,
      });
    }

    return entries;
  }
}
