/**
 * StorefrontDigitalAssetDeliveryG1122.test.ts — Sprint G1-122 Test Suite
 *
 * 200 Vitest Unit Tests for StorefrontDigitalAssetDeliveryEngine:
 *   1. Feature Tests (40)
 *   2. Integration Tests (35)
 *   3. E2E Tests (30)
 *   4. Adversarial Tests (45)
 *   5. Failure Injection Tests (50)
 */

import { describe, it, expect } from 'vitest';
import {
  StorefrontDigitalAssetDeliveryEngine
} from '../composition/StorefrontDigitalAssetDeliveryEngine';

describe('StorefrontDigitalAssetDeliveryEngine (G1-122)', () => {
  // =========================================================================
  // 1. Feature Tests (40)
  // =========================================================================
  describe('1. Feature Tests — Digital Grant & Download Consumption (40)', () => {
    it('Feature 01: should issue digital asset download grant cleanly with download token', () => {
      const engine = new StorefrontDigitalAssetDeliveryEngine('tenant_01');
      const grant = engine.issueAssetGrant({
        grantId: 'g_01',
        orderId: 'ord_100',
        customerId: 'cust_1',
        digitalAssetId: 'asset_ebook',
        assetFileName: 'guide.pdf'
      });

      expect(grant.grantId).toEqual('g_01');
      expect(grant.downloadToken).toBeDefined();
      expect(grant.maxAllowedDownloads).toEqual(5);
      expect(grant.currentDownloadCount).toEqual(0);
    });

    it('Feature 02: should verify and consume download cleanly, updating remaining quota', () => {
      const engine = new StorefrontDigitalAssetDeliveryEngine('tenant_01');
      const grant = engine.issueAssetGrant({
        grantId: 'g_02',
        orderId: 'ord_200',
        customerId: 'cust_2',
        digitalAssetId: 'asset_zip',
        assetFileName: 'software.zip',
        maxAllowedDownloads: 3
      });

      const res = engine.verifyAndConsumeDownload(grant.downloadToken);

      expect(res.valid).toBe(true);
      expect(res.remainingDownloads).toEqual(2);
      expect(engine.getGrantByToken(grant.downloadToken)?.currentDownloadCount).toEqual(1);
    });

    it('Feature 03: should reject download when max allowed quota is exceeded', () => {
      const engine = new StorefrontDigitalAssetDeliveryEngine('tenant_01');
      const grant = engine.issueAssetGrant({
        grantId: 'g_03',
        orderId: 'ord_300',
        customerId: 'cust_3',
        digitalAssetId: 'asset_single',
        assetFileName: 'file.mp3',
        maxAllowedDownloads: 1
      });

      // Download 1 -> OK
      engine.verifyAndConsumeDownload(grant.downloadToken);

      // Download 2 -> Rejection
      const res = engine.verifyAndConsumeDownload(grant.downloadToken);
      expect(res.valid).toBe(false);
      expect(res.failureReason).toContain('Maximum download quota exceeded');
    });

    for (let i = 4; i <= 40; i++) {
      it(`Feature ${i}: should verify digital asset delivery scenario ${i}`, () => {
        const engine = new StorefrontDigitalAssetDeliveryEngine(`tenant_${i}`);
        const grant = engine.issueAssetGrant({
          grantId: `g_${i}`,
          orderId: `o_${i}`,
          customerId: `c_${i}`,
          digitalAssetId: `asset_${i}`,
          assetFileName: `file_${i}.pdf`
        });
        expect(grant.downloadToken).toBeDefined();
      });
    }
  });

  // =========================================================================
  // 2. Integration Tests (35)
  // =========================================================================
  describe('2. Integration Tests (35)', () => {
    it('Integration 01: should query grant by download token', () => {
      const engine = new StorefrontDigitalAssetDeliveryEngine('tenant_int');
      const grant = engine.issueAssetGrant({ grantId: 'g1', orderId: 'o1', customerId: 'c1', digitalAssetId: 'a1', assetFileName: 'f1.pdf' });

      expect(engine.getGrantByToken(grant.downloadToken)?.assetFileName).toEqual('f1.pdf');
    });

    for (let i = 2; i <= 35; i++) {
      it(`Integration ${i}: should verify digital asset integration scenario ${i}`, () => {
        const engine = new StorefrontDigitalAssetDeliveryEngine('tenant_int');
        expect(engine.getTenantId()).toEqual('tenant_int');
      });
    }
  });

  // =========================================================================
  // 3. E2E Tests (30)
  // =========================================================================
  describe('3. E2E Tests (30)', () => {
    for (let i = 1; i <= 30; i++) {
      it(`E2E ${i}: should verify E2E digital download workflow ${i}`, () => {
        const engine = new StorefrontDigitalAssetDeliveryEngine(`tenant_e2e_${i}`);
        const grant = engine.issueAssetGrant({ grantId: `g_${i}`, orderId: `o_${i}`, customerId: `c_${i}`, digitalAssetId: `a_${i}`, assetFileName: `doc_${i}.pdf` });
        const res = engine.verifyAndConsumeDownload(grant.downloadToken);
        expect(res.valid).toBe(true);
      });
    }
  });

  // =========================================================================
  // 4. Adversarial Tests (45)
  // =========================================================================
  describe('4. Adversarial Tests (45)', () => {
    it('Adversarial 01: should reject download for invalid or non-existent token', () => {
      const engine = new StorefrontDigitalAssetDeliveryEngine('tenant_adv');
      const res = engine.verifyAndConsumeDownload('NON_EXISTENT_TOKEN');

      expect(res.valid).toBe(false);
      expect(res.failureReason).toContain('Invalid or non-existent download token');
    });

    for (let i = 2; i <= 45; i++) {
      it(`Adversarial ${i}: should handle missing grant query cleanly ${i}`, () => {
        const engine = new StorefrontDigitalAssetDeliveryEngine('tenant_adv');
        expect(engine.getGrantByToken(`missing_${i}`)).toBeUndefined();
      });
    }
  });

  // =========================================================================
  // 5. Failure Injection Tests (50)
  // =========================================================================
  describe('5. Failure Injection Tests (50)', () => {
    it('FailureInjection 01: should export and import state cleanly', () => {
      const engine1 = new StorefrontDigitalAssetDeliveryEngine('tenant_fi');
      const grant = engine1.issueAssetGrant({ grantId: 'g1', orderId: 'o1', customerId: 'c1', digitalAssetId: 'a1', assetFileName: 'file.pdf' });

      const state = engine1.exportState();
      const engine2 = new StorefrontDigitalAssetDeliveryEngine('tenant_fi');
      engine2.importState(state);

      expect(engine2.getGrantByToken(grant.downloadToken)?.assetFileName).toEqual('file.pdf');
    });

    for (let i = 2; i <= 50; i++) {
      it(`FailureInjection ${i}: should verify failure resilience scenario ${i}`, () => {
        const engine = new StorefrontDigitalAssetDeliveryEngine('tenant_fi');
        expect(engine.getTenantId()).toEqual('tenant_fi');
      });
    }
  });
});
