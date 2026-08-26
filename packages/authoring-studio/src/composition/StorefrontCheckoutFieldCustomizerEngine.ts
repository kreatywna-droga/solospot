/**
 * StorefrontCheckoutFieldCustomizerEngine.ts — Sprint G1-135 Custom Checkout Form Fields Engine (Night Shift Level 97)
 *
 * Provides pure TypeScript, headless custom checkout field schema definitions,
 * field validation rules (TEXT, NUMBER, SELECT, CHECKBOX, DATE), regex pattern checking,
 * and custom checkout payload evaluation.
 *
 * External form persistence services remain explicit integration boundaries.
 * NO DOM, NO React, ZERO Browser APIs in domain layer.
 */

export type CustomFieldType = 'TEXT' | 'NUMBER' | 'SELECT' | 'CHECKBOX' | 'DATE';

export interface CustomFieldDefinitionDTO {
  readonly fieldId: string;
  readonly fieldName: string;
  readonly label: string;
  readonly fieldType: CustomFieldType;
  readonly isRequired: boolean;
  readonly options?: ReadonlyArray<string>; // For SELECT fields
  readonly validationRegex?: string;
  readonly errorMessage?: string;
}

export interface CustomFieldValidationResultDTO {
  readonly isValid: boolean;
  readonly validatedPayload: Record<string, any>;
  readonly fieldErrors: Record<string, string>; // fieldId -> error message
}

export interface CheckoutFieldCustomizerEngineStateDTO {
  readonly tenantId: string;
  readonly customFields: Record<string, CustomFieldDefinitionDTO>; // fieldId -> dto
}

export class StorefrontCheckoutFieldCustomizerEngine {
  private readonly tenantId: string;
  private customFields: Map<string, CustomFieldDefinitionDTO> = new Map();

  constructor(tenantId = 'default_tenant') {
    this.tenantId = tenantId;
  }

  /**
   * Registers or updates a custom checkout field definition.
   */
  public registerCustomField(params: {
    fieldId: string;
    fieldName: string;
    label: string;
    fieldType: CustomFieldType;
    isRequired?: boolean;
    options?: ReadonlyArray<string>;
    validationRegex?: string;
    errorMessage?: string;
  }): CustomFieldDefinitionDTO {
    const { fieldId, fieldName, label, fieldType } = params;

    if (!fieldId || !fieldName || !label || !fieldType) {
      throw new Error('fieldId, fieldName, label, and fieldType are required');
    }

    const dto: CustomFieldDefinitionDTO = {
      fieldId: fieldId.trim(),
      fieldName: fieldName.trim(),
      label: label.trim(),
      fieldType,
      isRequired: params.isRequired ?? false,
      options: params.options ? [...params.options] : undefined,
      validationRegex: params.validationRegex ? params.validationRegex.trim() : undefined,
      errorMessage: params.errorMessage ? params.errorMessage.trim() : undefined
    };

    this.customFields.set(dto.fieldId, dto);
    return dto;
  }

  /**
   * Validates custom field entries submitted during checkout.
   */
  public validateCheckoutPayload(rawPayload: Record<string, any>): CustomFieldValidationResultDTO {
    const fieldErrors: Record<string, string> = {};
    const validatedPayload: Record<string, any> = {};

    this.customFields.forEach(def => {
      const val = rawPayload[def.fieldId] ?? rawPayload[def.fieldName];

      if (def.isRequired && (val === undefined || val === null || val === '')) {
        fieldErrors[def.fieldId] = def.errorMessage || `Field ${def.label} is required`;
        return;
      }

      if (val !== undefined && val !== null && val !== '') {
        if (def.fieldType === 'NUMBER' && typeof val !== 'number' && isNaN(Number(val))) {
          fieldErrors[def.fieldId] = `Field ${def.label} must be a valid number`;
          return;
        }

        if (def.fieldType === 'SELECT' && def.options && !def.options.includes(String(val))) {
          fieldErrors[def.fieldId] = `Invalid option selected for field ${def.label}`;
          return;
        }

        if (def.validationRegex) {
          const reg = new RegExp(def.validationRegex);
          if (!reg.test(String(val))) {
            fieldErrors[def.fieldId] = def.errorMessage || `Field ${def.label} format is invalid`;
            return;
          }
        }

        validatedPayload[def.fieldId] = val;
      }
    });

    const isValid = Object.keys(fieldErrors).length === 0;

    return {
      isValid,
      validatedPayload,
      fieldErrors
    };
  }

  public getCustomField(fieldId: string): CustomFieldDefinitionDTO | undefined {
    return this.customFields.get(fieldId.trim());
  }

  public getTenantId(): string {
    return this.tenantId;
  }

  public exportState(): CheckoutFieldCustomizerEngineStateDTO {
    const record: Record<string, CustomFieldDefinitionDTO> = {};
    this.customFields.forEach((val, key) => {
      record[key] = val;
    });

    return {
      tenantId: this.tenantId,
      customFields: record
    };
  }

  public importState(state: CheckoutFieldCustomizerEngineStateDTO): void {
    if (!state || state.tenantId !== this.tenantId) {
      throw new Error('State tenantId mismatch during import');
    }
    this.customFields.clear();
    Object.entries(state.customFields || {}).forEach(([k, v]) => {
      this.customFields.set(k, v);
    });
  }
}
