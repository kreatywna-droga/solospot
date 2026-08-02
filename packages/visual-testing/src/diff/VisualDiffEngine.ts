import { VisualSnapshot } from '../snapshot/VisualSnapshotEngine';

export type ChangeSeverity = 'none' | 'minor' | 'major' | 'critical';

export interface VisualDiffDetail {
  property: string;
  baseValue?: string;
  currentValue?: string;
  severity: ChangeSeverity;
}

export interface VisualDiffResult {
  snapshotName: string;
  domMatched: boolean;
  totalPropertiesCount: number;
  changedPropertiesCount: number;
  diffPercentage: number;
  overallSeverity: ChangeSeverity;
  details: VisualDiffDetail[];
}

export class VisualDiffEngine {
  public static compare(base: VisualSnapshot, current: VisualSnapshot): VisualDiffResult {
    const domMatched = base.domStructureHash === current.domStructureHash;
    const baseCss = base.cssPropertiesMap || {};
    const currentCss = current.cssPropertiesMap || {};

    const allKeys = new Set([...Object.keys(baseCss), ...Object.keys(currentCss)]);
    const details: VisualDiffDetail[] = [];

    if (!domMatched) {
      details.push({
        property: '__dom_structure_hash__',
        baseValue: base.domStructureHash,
        currentValue: current.domStructureHash,
        severity: 'critical',
      });
    }

    for (const key of allKeys) {
      const valBase = baseCss[key];
      const valCurr = currentCss[key];
      if (valBase !== valCurr) {
        let severity: ChangeSeverity = 'minor';
        if (key.includes('width') || key.includes('height') || key.includes('display')) {
          severity = 'major';
        } else if (key.includes('border') || key.includes('radius') || key.includes('color')) {
          severity = 'minor';
        }
        details.push({
          property: key,
          baseValue: valBase,
          currentValue: valCurr,
          severity,
        });
      }
    }

    const totalPropertiesCount = allKeys.size || 1;
    const changedPropertiesCount = details.filter(d => d.property !== '__dom_structure_hash__').length;
    let diffPercentage = Math.round((changedPropertiesCount / totalPropertiesCount) * 100);

    if (!domMatched) {
      diffPercentage = Math.max(diffPercentage, 50);
    }

    let overallSeverity: ChangeSeverity = 'none';
    if (!domMatched || details.some(d => d.severity === 'critical')) {
      overallSeverity = 'critical';
    } else if (diffPercentage > 30 || details.some(d => d.severity === 'major')) {
      overallSeverity = 'major';
    } else if (diffPercentage > 0) {
      overallSeverity = 'minor';
    }

    return {
      snapshotName: base.name,
      domMatched,
      totalPropertiesCount,
      changedPropertiesCount,
      diffPercentage,
      overallSeverity,
      details,
    };
  }
}
