/**
 * createPropertyFieldRegistry — Sprint 7.1 Inspector 2.0 Foundation
 *
 * Factory function creating a concrete implementation of PropertyRegistry.
 *
 * @agent Agent 1 — Inspector Core Engineer
 * @status STABLE
 */

import type { PropertyRegistry } from './PropertyRegistry';
import type { PropertyFieldDefinition, WidgetComponent, WidgetType } from './types';

export function createPropertyFieldRegistry(): PropertyRegistry {
    const fields = new Map<string, PropertyFieldDefinition>();
    const widgets = new Map<WidgetType, WidgetComponent>();

    return {
        registerField(field: PropertyFieldDefinition): void {
            if (!field || !field.id) {
                throw new Error('[PropertyRegistry] Cannot register field without a valid id');
            }
            fields.set(field.id, field);
        },

        getField(id: string): PropertyFieldDefinition | undefined {
            return fields.get(id);
        },

        getAllFields(): PropertyFieldDefinition[] {
            return Array.from(fields.values());
        },

        getFieldsByCategory(category: string): PropertyFieldDefinition[] {
            return Array.from(fields.values()).filter((f) => f.category === category);
        },

        hasField(id: string): boolean {
            return fields.has(id);
        },

        unregisterField(id: string): boolean {
            return fields.delete(id);
        },

        registerWidget(type: WidgetType, widget: WidgetComponent): void {
            if (!type || !widget) {
                throw new Error('[PropertyRegistry] Cannot register widget without type and component');
            }
            widgets.set(type, widget);
        },

        getWidget(type: WidgetType): WidgetComponent | undefined {
            return widgets.get(type);
        },

        hasWidget(type: WidgetType): boolean {
            return widgets.has(type);
        },

        unregisterWidget(type: WidgetType): boolean {
            return widgets.delete(type);
        },

        clear(): void {
            fields.clear();
            widgets.clear();
        },
    };
}
