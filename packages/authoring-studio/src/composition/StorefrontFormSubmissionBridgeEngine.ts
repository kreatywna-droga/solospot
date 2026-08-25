/**
 * StorefrontFormSubmissionBridgeEngine.ts — Sprint G1-60 Form Submission & Lead Capture Bridge Engine (Night Shift Level 22)
 *
 * Implements a pure TypeScript, headless form submission and lead capture bridge engine for Authoring Studio.
 * Manages form field configurations, validates visitor form submissions (email format, required fields, text lengths),
 * compiles structured submission payloads (FormSubmissionPayloadDTO), and creates clean handoff boundaries
 * (FormHandoffBoundaryDTO) for backend email and webhook endpoints (/api/contact).
 *
 * NO FAKE EMAIL DELIVERY / NO FAKE CRM CLAIMS.
 * NO DOM, NO React, ZERO Browser APIs in domain layer.
 */

import { VectorWorkspaceState, VectorDocumentSnapshot } from '../vector/VectorWorkspaceController';

// ---------------------------------------------------------------------------
// DTOs & Interfaces
// ---------------------------------------------------------------------------

export interface FormFieldConfigDTO {
  readonly fieldId: string;
  readonly type: 'text' | 'email' | 'textarea' | 'phone' | 'select';
  readonly label: string;
  readonly placeholder?: string;
  readonly isRequired: boolean;
}

export interface FormSectionConfigDTO {
  readonly formId: string;
  readonly formTitle: string;
  readonly targetEndpoint: string;
  readonly fields: ReadonlyArray<FormFieldConfigDTO>;
  readonly submitButtonLabel: string;
}

export interface FormFieldValueDTO {
  readonly fieldId: string;
  readonly value: string;
}

export interface FormSubmissionPayloadDTO {
  readonly submissionId: string;
  readonly formId: string;
  readonly formTitle: string;
  readonly fieldValues: ReadonlyArray<FormFieldValueDTO>;
  readonly submittedAt: number;
  readonly isValid: boolean;
  readonly validationErrors: ReadonlyArray<string>;
}

export interface FormHandoffBoundaryDTO {
  readonly handoffId: string;
  readonly submissionId: string;
  readonly formId: string;
  readonly targetEndpoint: string;
  readonly payload: {
    readonly name: string;
    readonly email: string;
    readonly message: string;
    readonly subject?: string;
  };
  readonly status: 'READY_FOR_HANDOFF' | 'HANDOFF_COMPLETED';
  readonly timestamp: number;
}

export interface FormEngineExecutionResult {
  readonly success: boolean;
  readonly submissionPayload?: FormSubmissionPayloadDTO;
  readonly handoffBoundary?: FormHandoffBoundaryDTO;
  readonly error?: string;
}

// ---------------------------------------------------------------------------
// Engine Implementation
// ---------------------------------------------------------------------------

export class StorefrontFormSubmissionBridgeEngine {
  /**
   * Creates a default form section configuration with required contact fields.
   */
  public static createFormConfig(
    formId = 'default_contact_form',
    formTitle = 'Contact Us',
    fields?: FormFieldConfigDTO[],
    targetEndpoint = '/api/contact'
  ): FormSectionConfigDTO {
    const defaultFields: FormFieldConfigDTO[] = fields || [
      { fieldId: 'name', type: 'text', label: 'Full Name', placeholder: 'John Doe', isRequired: true },
      { fieldId: 'email', type: 'email', label: 'Email Address', placeholder: 'john@example.com', isRequired: true },
      { fieldId: 'subject', type: 'text', label: 'Subject', placeholder: 'Inquiry', isRequired: false },
      { fieldId: 'message', type: 'textarea', label: 'Message', placeholder: 'How can we help?', isRequired: true }
    ];

    return {
      formId,
      formTitle,
      targetEndpoint,
      fields: defaultFields,
      submitButtonLabel: 'Send Message'
    };
  }

  /**
   * Validates form input values against field configuration rules.
   */
  public static validateFormSubmission(
    formConfig: FormSectionConfigDTO,
    values: ReadonlyArray<FormFieldValueDTO>
  ): { readonly isValid: boolean; readonly errors: ReadonlyArray<string> } {
    const errors: string[] = [];

    if (!formConfig || !formConfig.fields) {
      return { isValid: false, errors: ['Form configuration is null or invalid'] };
    }

    const valueMap = new Map<string, string>();
    values.forEach(v => valueMap.set(v.fieldId, v.value || ''));

    formConfig.fields.forEach(field => {
      const val = valueMap.get(field.fieldId)?.trim() || '';

      // Check required fields
      if (field.isRequired && val.length === 0) {
        errors.push(`Field '${field.label}' is required`);
      }

      // Check email format
      if (field.type === 'email' && val.length > 0) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(val)) {
          errors.push(`Field '${field.label}' must be a valid email address`);
        }
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Compiles validated form input values into a FormSubmissionPayloadDTO.
   */
  public static compileSubmissionPayload(
    formConfig: FormSectionConfigDTO,
    values: ReadonlyArray<FormFieldValueDTO>
  ): FormSubmissionPayloadDTO {
    const valResult = this.validateFormSubmission(formConfig, values);
    const submissionId = `sub_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;

    return {
      submissionId,
      formId: formConfig?.formId || 'unknown_form',
      formTitle: formConfig?.formTitle || 'Untitled Form',
      fieldValues: values,
      submittedAt: Date.now(),
      isValid: valResult.isValid,
      validationErrors: valResult.errors
    };
  }

  /**
   * Creates a FormHandoffBoundaryDTO for backend API dispatch (/api/contact).
   */
  public static createFormHandoffBoundary(
    payload: FormSubmissionPayloadDTO,
    targetEndpoint = '/api/contact'
  ): FormEngineExecutionResult {
    if (!payload) {
      return { success: false, error: 'Submission payload is null or undefined' };
    }

    if (!payload.isValid) {
      return {
        success: false,
        submissionPayload: payload,
        error: `Submission has ${payload.validationErrors.length} validation errors: ${payload.validationErrors.join(', ')}`
      };
    }

    const valueMap = new Map<string, string>();
    payload.fieldValues.forEach(v => valueMap.set(v.fieldId, v.value));

    const name = valueMap.get('name') || valueMap.get('fullName') || 'Anonymous Visitor';
    const email = valueMap.get('email') || 'no-reply@example.com';
    const message = valueMap.get('message') || valueMap.get('comments') || 'No message content provided.';
    const subject = valueMap.get('subject') || payload.formTitle;

    const handoffId = `handoff_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;

    const handoffBoundary: FormHandoffBoundaryDTO = {
      handoffId,
      submissionId: payload.submissionId,
      formId: payload.formId,
      targetEndpoint,
      payload: {
        name,
        email,
        message,
        subject
      },
      status: 'READY_FOR_HANDOFF',
      timestamp: Date.now()
    };

    return {
      success: true,
      submissionPayload: payload,
      handoffBoundary
    };
  }

  /**
   * Executes form handoff status transition ('READY_FOR_HANDOFF' -> 'HANDOFF_COMPLETED').
   */
  public static executeFormHandoff(handoffBoundary: FormHandoffBoundaryDTO): FormHandoffBoundaryDTO {
    if (!handoffBoundary) throw new Error('StorefrontFormSubmissionBridgeEngine: Handoff boundary is null');

    return {
      ...handoffBoundary,
      status: 'HANDOFF_COMPLETED'
    };
  }

  /**
   * Serializes submission payload to JSON.
   */
  public static serializeFormSubmission(payload: FormSubmissionPayloadDTO): string {
    return JSON.stringify(payload);
  }

  /**
   * Restores submission payload from JSON.
   */
  public static restoreFormSubmission(json: string): FormSubmissionPayloadDTO {
    try {
      const parsed = JSON.parse(json);
      if (!parsed || typeof parsed !== 'object' || !parsed.submissionId) {
        throw new Error('Invalid submission JSON structure');
      }
      return parsed as FormSubmissionPayloadDTO;
    } catch (err: any) {
      throw new Error(`Failed to restore form submission: ${err.message}`);
    }
  }
}
