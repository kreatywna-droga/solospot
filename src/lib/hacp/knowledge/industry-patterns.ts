import { Capability } from './types';
// Milestone 4 — Industry-specific pattern decisions using REAL capabilities only
export const INDUSTRY_DECISION_MAP: Record<string, { intent: string; decision: string; caps: string[]; verify: string }> = {
  'premium-auto': { intent: 'premium automotive hero with performance tone', decision: 'Hero oversized + dark palette + typography scale + media direction + primary CTA', caps: ['Hero','Typography','Color','Layout','Button'], verify: 'hero visible; palette contrast; responsive 1024/640; CTA present' },
  'fashion-minimal': { intent: 'fashion minimal grid with typography focus', decision: 'Light palette + clean Layout + Section library + typography hierarchy + restrained CTA', caps: ['Layout','Typography','Section','Color','Button'], verify: 'grid clean; typography consistent; spacing rhythm; 0 clutter' },
};
export const industryToCaps = (key: string) => INDUSTRY_DECISION_MAP[key] || null; // real entry or null — never invent
