import { RuntimeModule, ModuleFactory as ModuleFactoryInterface } from '../../runtime-core/src/RuntimeEngine';

export interface ModuleFactory extends ModuleFactoryInterface {}

export interface RuntimeModuleConstructor {
  new (...args: unknown[]): RuntimeModule;
}

export function createModuleFactory(
  moduleConstructors: Map<string, RuntimeModuleConstructor>
): ModuleFactory {
  return {
    createModule(packageId: string, version: string): RuntimeModule {
      const Constructor = moduleConstructors.get(packageId);
      if (!Constructor) {
        throw new Error(`No module constructor registered for package: ${packageId}`);
      }
      return new Constructor();
    },
  };
}