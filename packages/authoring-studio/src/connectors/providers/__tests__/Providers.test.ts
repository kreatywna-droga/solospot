import { describe, it, expect } from 'vitest';
import { LocalFileConnector } from '../LocalFileConnector';
import { GoogleDriveConnector } from '../GoogleDriveConnector';
import { GitConnector } from '../GitConnector';
import { DropboxConnector } from '../DropboxConnector';
import { OneDriveConnector } from '../OneDriveConnector';
import { createBuilderDocument } from '../../../../../builder-core/src/BuilderDocument';

describe('Real Connector Providers (Sprint S9)', () => {
  it('operates LocalFileConnector', () => {
    const conn = new LocalFileConnector({ connectorId: 'local-1' });
    const doc = createBuilderDocument({
      id: 'd1',
      tenantId: 't1',
      metadata: {
        storeName: 'Test Store',
        storeSlug: 'test-store',
        locale: 'en-US',
        currency: 'USD',
      },
    });

    const openRes = conn.openProject('/path/to/project.json');
    expect(openRes.success).toBe(true);

    const saveRes = conn.saveProject(doc, '/path/to/project.json');
    expect(saveRes.success).toBe(true);
  });

  it('operates GoogleDriveConnector', () => {
    const conn = new GoogleDriveConnector({
      connectorId: 'gdrive-1',
      provider: 'google_drive',
      supportsMultipartUpload: true,
    });

    const dlRes = conn.download({ connectorId: 'gdrive-1', operation: 'read', path: 'file.json' });
    expect(dlRes.success).toBe(true);
  });

  it('operates GitConnector', () => {
    const conn = new GitConnector('git-1');
    const commitRes = conn.commit({ message: 'feat: add animation', author: 'user@example.com', files: ['doc.json'] });
    expect(commitRes.success).toBe(true);
    expect(commitRes.commitHash).toBeDefined();

    const pushRes = conn.push();
    expect(pushRes.success).toBe(true);

    const meta = conn.getBranchMetadata();
    expect(meta.name).toBe('main');
  });

  it('operates Dropbox and OneDrive connectors', () => {
    const dbx = new DropboxConnector({ connectorId: 'dbx-1', provider: 'dropbox', supportsMultipartUpload: false });
    const one = new OneDriveConnector({ connectorId: 'one-1', provider: 'dropbox', supportsMultipartUpload: false });

    expect(dbx.connectorId).toBe('dbx-1');
    expect(one.connectorId).toBe('one-1');
  });
});
