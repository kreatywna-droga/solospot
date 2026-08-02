import { ExtractedApiModule } from '../extractor/ApiExtractor';

export class MarkdownGenerator {
  public static generateModuleMarkdown(module: ExtractedApiModule): string {
    const lines: string[] = [];

    lines.push(`# API Documentation — ${module.moduleName}`);
    lines.push('');
    lines.push(`> Generated automatically by @web-factor/docgen on ${new Date().toISOString()}`);
    lines.push('');

    // Interfaces
    if (module.interfaces.length > 0) {
      lines.push('## Interfaces');
      lines.push('');
      for (const iface of module.interfaces) {
        lines.push(`### \`${iface.name}\``);
        lines.push('');
        if (iface.properties.length > 0) {
          lines.push('| Property | Type | Optional |');
          lines.push('|----------|------|----------|');
          for (const prop of iface.properties) {
            lines.push(`| \`${prop.name}\` | \`${prop.type}\` | ${prop.optional ? 'Yes' : 'No'} |`);
          }
        } else {
          lines.push('*No properties declared.*');
        }
        lines.push('');
      }
    }

    // Types
    if (module.types.length > 0) {
      lines.push('## Type Aliases');
      lines.push('');
      for (const t of module.types) {
        lines.push(`- **\`${t.name}\`**: \`${t.definition}\``);
      }
      lines.push('');
    }

    // Enums
    if (module.enums.length > 0) {
      lines.push('## Enums');
      lines.push('');
      for (const e of module.enums) {
        lines.push(`### \`${e.name}\``);
        for (const m of e.members) {
          lines.push(`- \`${m.name}\`${m.value ? ` = ${m.value}` : ''}`);
        }
        lines.push('');
      }
    }

    // Classes
    if (module.classes.length > 0) {
      lines.push('## Classes');
      lines.push('');
      for (const c of module.classes) {
        lines.push(`- **\`${c.name}\`**`);
      }
      lines.push('');
    }

    // Functions
    if (module.functions.length > 0) {
      lines.push('## Functions');
      lines.push('');
      for (const f of module.functions) {
        lines.push(`- **\`${f.name}${f.signature}\`**`);
      }
      lines.push('');
    }

    return lines.join('\n');
  }
}
