import { TrainingCase, Lesson } from './types';
import { TRAINING_CASES } from './training-cases';
// Verification-gated loop: lesson written ONLY when verificationProof exists + verified=true
export function createLesson(caseId: string, rootCause: string, repair: string, verificationProof: string): Lesson | null {
  const c = TRAINING_CASES.find(x => x.context.includes(caseId) || caseId.includes(x.sourceReport));
  if (!c || !c.verified || !verificationProof || verificationProof.length < 10) return null; // reject unverified
  return { caseId, rootCause, repair, verifiedResult: verificationProof, knowledgeId: `K-${caseId.slice(0,4)}`, writtenOnlyWhenVerified: true };
}
export const retrieval = (q: string) => TRAINING_CASES.filter(x => x.intent.toLowerCase().includes(q.toLowerCase()) || x.designProblem.toLowerCase().includes(q.toLowerCase()));
// Safety assertions: reject non-existent capabilities/tools (no invented capabilities)
export const assertCapExists = (id: string) => id === 'Hero' || id === 'Typography' || id === 'Button'; // real SoloSpot; others rejected in full production
