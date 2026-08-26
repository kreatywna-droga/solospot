/**
 * PropertyRegistry Interface — Sprint 7.1 Inspector 2.0 Foundation
 *
 * Contract for managing property field definitions and widget components.
 *
 * @agent Agent 1 — Inspector Core Engineer
 * @status STABLE
 */

import type { PropertyFieldDefinition, WidgetComponent, WidgetType } from './types';

export interface PropertyRegistry {
    // Field Registration
    registerField(field: PropertyFieldDefinition): void;
    getField(id: string): PropertyFieldDefinition | undefined;
    getAllFields(): PropertyFieldDefinition[];
    getFieldsByCategory(category: string): PropertyFieldDefinition[];
    hasField(id: string): boolean;
    unregisterField(id: string): boolean;

    // Widget Registration
    registerWidget(type: WidgetType, widget: WidgetComponent): void;
    getWidget(type: WidgetType): WidgetComponent | undefined;
    hasWidget(type: WidgetType): boolean;
    unregisterWidget(type: WidgetType): boolean;

    clear(): void;
}

export { createPropertyFieldRegistry } from './createPropertyFieldRegistry';
