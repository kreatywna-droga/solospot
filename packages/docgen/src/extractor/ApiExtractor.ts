export interface ExtractedProperty {
  name: string;
  type: string;
  optional: boolean;
}

export interface ExtractedInterface {
  name: string;
  properties: ExtractedProperty[];
}

export interface ExtractedType {
  name: string;
  definition: string;
}

export interface ExtractedEnumMember {
  name: string;
  value?: string | number;
}

export interface ExtractedEnum {
  name: string;
  members: ExtractedEnumMember[];
}

export interface ExtractedClass {
  name: string;
  methods: string[];
}

export interface ExtractedFunction {
  name: string;
  signature: string;
}

export interface ExtractedApiModule {
  moduleName: string;
  interfaces: ExtractedInterface[];
  types: ExtractedType[];
  enums: ExtractedEnum[];
  classes: ExtractedClass[];
  functions: ExtractedFunction[];
}

export class ApiExtractor {
  public static extractFromSource(sourceCode: string, moduleName: string = 'Module'): ExtractedApiModule {
    const result: ExtractedApiModule = {
      moduleName,
      interfaces: [],
      types: [],
      enums: [],
      classes: [],
      functions: [],
    };

    // Extract interfaces
    const interfaceRegex = /export\s+interface\s+([A-Za-z0-9_]+)\s*\{([^}]+)\}/g;
    let match: RegExpExecArray | null;
    while ((match = interfaceRegex.exec(sourceCode)) !== null) {
      const name = match[1];
      const body = match[2];
      const properties: ExtractedProperty[] = [];
      const propLines = body.split('\n');
      for (const line of propLines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('*')) continue;
        const propMatch = /^([A-Za-z0-9_]+)(\?)?:\s*(.+);?$/.exec(trimmed);
        if (propMatch) {
          properties.push({
            name: propMatch[1],
            optional: Boolean(propMatch[2]),
            type: propMatch[3].replace(/;$/, '').trim(),
          });
        }
      }
      result.interfaces.push({ name, properties });
    }

    // Extract type aliases
    const typeRegex = /export\s+type\s+([A-Za-z0-9_]+)\s*=\s*([^;\n]+);?/g;
    while ((match = typeRegex.exec(sourceCode)) !== null) {
      result.types.push({
        name: match[1],
        definition: match[2].trim(),
      });
    }

    // Extract enums
    const enumRegex = /export\s+enum\s+([A-Za-z0-9_]+)\s*\{([^}]+)\}/g;
    while ((match = enumRegex.exec(sourceCode)) !== null) {
      const name = match[1];
      const body = match[2];
      const members: ExtractedEnumMember[] = [];
      const memberLines = body.split(/,|\n/);
      for (const m of memberLines) {
        const trimmed = m.trim();
        if (!trimmed || trimmed.startsWith('//')) continue;
        const parts = trimmed.split('=');
        members.push({
          name: parts[0].trim(),
          value: parts[1] ? parts[1].trim() : undefined,
        });
      }
      result.enums.push({ name, members });
    }

    // Extract classes
    const classRegex = /export\s+class\s+([A-Za-z0-9_]+)/g;
    while ((match = classRegex.exec(sourceCode)) !== null) {
      result.classes.push({
        name: match[1],
        methods: [],
      });
    }

    // Extract functions
    const funcRegex = /export\s+function\s+([A-Za-z0-9_]+)\s*\(([^)]*)\)/g;
    while ((match = funcRegex.exec(sourceCode)) !== null) {
      result.functions.push({
        name: match[1],
        signature: `(${match[2]})`,
      });
    }

    return result;
  }
}
