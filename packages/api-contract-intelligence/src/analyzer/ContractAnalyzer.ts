import { APIContract, ContractInterface } from '../model/ContractModel';

export type BreakingChangeType =
  | 'property_removed'
  | 'property_type_changed'
  | 'method_removed'
  | 'parameter_added_required'
  | 'signature_changed';

export interface BreakingChange {
  contractId: string;
  interfaceName: string;
  type: BreakingChangeType;
  description: string;
  severity: 'error' | 'critical';
}

export class ContractAnalyzer {
  public static detectBreakingChanges(baseContract: APIContract, candidateContract: APIContract): BreakingChange[] {
    const changes: BreakingChange[] = [];

    const baseInterfaces = new Map<string, ContractInterface>();
    for (const iface of baseContract.interfaces) {
      baseInterfaces.set(iface.name, iface);
    }

    const candidateInterfaces = new Map<string, ContractInterface>();
    for (const iface of candidateContract.interfaces) {
      candidateInterfaces.set(iface.name, iface);
    }

    for (const [name, baseIface] of baseInterfaces.entries()) {
      const candidateIface = candidateInterfaces.get(name);
      if (!candidateIface) {
        changes.push({
          contractId: baseContract.id,
          interfaceName: name,
          type: 'property_removed',
          description: `Interface '${name}' was removed in the candidate contract.`,
          severity: 'critical',
        });
        continue;
      }

      // Check removed properties
      const candPropMap = new Map(candidateIface.properties.map(p => [p.name, p]));
      for (const baseProp of baseIface.properties) {
        const candProp = candPropMap.get(baseProp.name);
        if (!candProp) {
          changes.push({
            contractId: baseContract.id,
            interfaceName: name,
            type: 'property_removed',
            description: `Property '${baseProp.name}' was removed from interface '${name}'.`,
            severity: 'error',
          });
        } else if (baseProp.type !== candProp.type) {
          changes.push({
            contractId: baseContract.id,
            interfaceName: name,
            type: 'property_type_changed',
            description: `Property '${baseProp.name}' type changed from '${baseProp.type}' to '${candProp.type}'.`,
            severity: 'critical',
          });
        }
      }

      // Check removed methods
      const candMethodMap = new Map(candidateIface.methods.map(m => [m.name, m]));
      for (const baseMethod of baseIface.methods) {
        const candMethod = candMethodMap.get(baseMethod.name);
        if (!candMethod) {
          changes.push({
            contractId: baseContract.id,
            interfaceName: name,
            type: 'method_removed',
            description: `Method '${baseMethod.name}' was removed from interface '${name}'.`,
            severity: 'critical',
          });
        }
      }
    }

    return changes;
  }
}
