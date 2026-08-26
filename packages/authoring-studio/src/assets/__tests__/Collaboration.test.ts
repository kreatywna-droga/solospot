import { describe, it, expect } from 'vitest';
import {
  createCollaborationMetadata,
  addChangeNote,
} from '../AnimationCollaboration';

describe('AnimationCollaboration (PM41 & PM42, ETAP 7 & DECISION-079)', () => {
  it('manages collaboration metadata without affecting Runtime (DECISION-079)', () => {
    let meta = createCollaborationMetadata('asset-fade-in', {
      userId: 'user-101',
      name: 'Alice Creator',
      role: 'author',
    });

    expect(meta.primaryAuthor.name).toBe('Alice Creator');
    expect(meta.contributors).toHaveLength(1);

    meta = addChangeNote(meta, 'user-101', 'Updated fade curve to ease-out');
    expect(meta.changeNotes).toHaveLength(1);
    expect(meta.changeNotes[0].message).toBe('Updated fade curve to ease-out');
  });
});
