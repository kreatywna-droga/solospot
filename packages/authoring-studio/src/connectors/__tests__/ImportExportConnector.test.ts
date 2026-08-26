/**
 * ImportExportConnector.test.ts — Sprint S8 Connector Framework Tests
 *
 * Unit tests for import/export connector contracts.
 */

import { describe, it, expect } from 'vitest';
import {
  createImportRequest,
  createImportResult,
  ImportFormat,
  ImportConnectorContract,
} from '../ImportConnector';

describe('ImportExportConnector', () => {
  it('should create an import request', () => {
    const request = createImportRequest(
      'test-connector',
      'json',
      'file:///data.json',
      { key: 'value' }
    );

    expect(request.connectorId).toBe('test-connector');
    expect(request.format).toBe('json');
    expect(request.source).toBe('file:///data.json');
    expect(request.payload).toEqual({ key: 'value' });
  });

  it('should create an import request with options', () => {
    const request = createImportRequest(
      'test-connector',
      'builder_document',
      'file:///doc.json',
      {},
      { validate: true, strict: false }
    );

    expect(request.options).toEqual({ validate: true, strict: false });
  });

  it('should create an import result', () => {
    const result = createImportResult(
      'test-connector',
      true,
      'entity-123',
      'animation',
      undefined,
      ['Warning: deprecated field used']
    );

    expect(result.connectorId).toBe('test-connector');
    expect(result.success).toBe(true);
    expect(result.importedEntityId).toBe('entity-123');
    expect(result.importedEntityType).toBe('animation');
    expect(result.importedAt).toBeDefined();
    expect(result.warnings).toContain('Warning: deprecated field used');
  });

  it('should create an import result with error', () => {
    const result = createImportResult(
      'test-connector',
      false,
      undefined,
      undefined,
      'Invalid format'
    );

    expect(result.success).toBe(false);
    expect(result.errorMessage).toBe('Invalid format');
    expect(result.importedEntityId).toBeUndefined();
  });

  it('should have valid import connector contract', () => {
    const contract: ImportConnectorContract = {
      connectorId: 'test-connector',
      supportedFormats: ['json', 'builder_document'],
      canImport: (request) => {
        return contract.supportedFormats.includes(request.format);
      },
      importData: (request) => {
        return createImportResult(
          request.connectorId,
          true,
          'imported-id',
          'animation'
        );
      },
    };

    expect(contract.connectorId).toBe('test-connector');
    expect(contract.supportedFormats).toContain('json');
    expect(contract.supportedFormats).toContain('builder_document');
  });

  it('should check if connector can import format', () => {
    const contract: ImportConnectorContract = {
      connectorId: 'test-connector',
      supportedFormats: ['json', 'csv'],
      canImport: (request) => {
        return contract.supportedFormats.includes(request.format);
      },
      importData: () => createImportResult('test-connector', true),
    };

    const validRequest = createImportRequest('test-connector', 'json', 'file:///data.json', {});
    const invalidRequest = createImportRequest('test-connector', 'video', 'file:///video.mp4', {});

    expect(contract.canImport(validRequest)).toBe(true);
    expect(contract.canImport(invalidRequest)).toBe(false);
  });

  it('should support all import formats', () => {
    const formats: ImportFormat[] = [
      'json',
      'builder_document',
      'animation_package',
      'image',
      'video',
      'audio',
      'csv',
      'custom',
    ];

    expect(formats).toHaveLength(8);
    expect(formats).toContain('json');
    expect(formats).toContain('builder_document');
    expect(formats).toContain('animation_package');
  });
});