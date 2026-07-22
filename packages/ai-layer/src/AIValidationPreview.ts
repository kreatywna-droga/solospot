import { ValidationCenter } from '../../authoring-studio/src/ValidationCenter';
import { LivePreview } from '../../authoring-studio/src/LivePreview';
import { PreviewRuntime, PreviewRuntimeResult } from '../../theme-runtime/src/PreviewRuntime';
import { AuthoringProject } from '../../authoring-studio/src/AuthoringProject';
import { ValidationResult } from '../../template-installer/src/TemplateValidator';

export interface AIPreviewResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  previewHtml?: string;
  previewTimeMs?: number;
}

export class AIValidationPreview {
  constructor(
    private validationCenter: ValidationCenter,
    private livePreview: LivePreview
  ) {}

  async validateAndPreview(project: AuthoringProject): Promise<AIPreviewResult> {
    const validation = this.validationCenter.validate();

    const previewResult = await this.livePreview.render();

    return {
      valid: validation.success,
      errors: validation.errors.map(e => e.message),
      warnings: validation.warnings.map(w => w.message),
      previewHtml: previewResult.html,
      previewTimeMs: previewResult.renderTimeMs
    };
  }

  getValidationStatus(project: AuthoringProject): ValidationResult {
    return this.validationCenter.validate();
  }

  async preview(project: AuthoringProject): Promise<PreviewRuntimeResult> {
    return this.livePreview.render();
  }
}