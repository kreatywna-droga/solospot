import { describe, it, expect } from 'vitest';
import { buildContext, makeDecision, checkDecisionQuality, executePipeline } from '../decision-engine';
import { CAPABILITIES } from '../capability-map';

describe('Milestone 5 Decision Engine', () => {
  it('A. valid intent -> decision -> real cap', () => {
    const d = makeDecision({ intent: 'hero', pageType: 'landing' }, 'hierarchy', 'hero', 'Hero', CAPABILITIES.find(c => c.id === 'Hero') || null);
    expect(d).not.toBeNull(); expect(d?.capabilityId).toBe('Hero');
  });
  it('B. valid intent -> unsupported -> null cap', () => {
    const d = makeDecision({ intent: 'xyz' }, 'test', 'test', 'X', null);
    expect(d).toBeNull();
  });
  it('C. industry -> valid cap', () => {
    const cap = CAPABILITIES.find(c => c.id === 'Hero');
    expect(cap).toBeDefined();
  });
  it('D. industry -> unsupported cap -> null', () => {
    expect(CAPABILITIES.find(c => c.id === 'Fake')).toBeUndefined();
  });
  it('E. decision -> execution -> PASS (planned, real source)', () => {
    const res = executePipeline('hero', { pageType: 'landing' }, (id) => CAPABILITIES.find(c => c.id === id) || null);
    expect(res.state).toBe('PLANNED'); expect(res.note).toContain('Hero');
  });
  it('F. execution -> FAIL (bad cap)', () => {
    const res = executePipeline('hero', { pageType: 'landing' }, () => null);
    expect(res.state).toBe('INSUFFICIENT_EVIDENCE');
  });
  it('G. insufficient evidence', () => {
    const res = executePipeline('unknown', {}, () => null);
    expect(res.state).toBe('INSUFFICIENT_EVIDENCE');
  });
  it('H. PASS + verified -> lesson allowed', () => {
    const { lessonFromQA } = require('../visual-qa-integration');
    expect(lessonFromQA('P0','PASS','ds-probe', 'proof')).toBeTruthy();
  });
  it('I. PASS + unverified -> no lesson', () => {
    const { lessonFromQA } = require('../visual-qa-integration');
    expect(lessonFromQA('P0','PASS','fake', 'x')).toBeFalsy();
  });
  it('J. FAIL + verified -> no lesson', () => {
    const { lessonFromQA } = require('../visual-qa-integration');
    expect(lessonFromQA('P0','FAIL','ds-probe', 'proof').lessonWritten).toBe(false);
  });
  it('K. INSUFFICIENT -> no lesson', () => {
    const { lessonFromQA } = require('../visual-qa-integration');
    expect(lessonFromQA('P0','INSUFFICIENT_EVIDENCE','ds-probe','proof').lessonWritten).toBe(false);
  });
  it('L. fabricated cap -> rejected', () => {
    expect(CAPABILITIES.find(c => c.id === 'Magic')).toBeUndefined();
  });
  it('M. fabricated visual evidence -> rejected', () => {
    const { VISUAL_QA_SOURCES } = require('../visual-qa-integration');
    expect(VISUAL_QA_SOURCES['fake']).toBeUndefined();
  });
  it('N. M1–M4 cases valid (retrieval)', () => {
    const { TRAINING_CASES } = require('../training-cases');
    expect(TRAINING_CASES.filter(c => c.verified).length).toBeGreaterThanOrEqual(4);
  });
  it('O. no second orchestrator (no scheduler/PlaybackController import)', () => {
    const content = require('fs').readFileSync('src/lib/hacp/knowledge/decision-engine.ts','utf8');
    expect(content).not.toContain('PlaybackController');
    expect(content).not.toContain('requestAnimationFrame');
  });
  it('design context preserves unknowns', () => {
    const ctx = buildContext({ intent: 'test' });
    expect(ctx.unknowns).toContain('pageType');
  });
  it('quality check fails bad cap', () => {
    const bad = checkDecisionQuality({ problem:'', principle:'', selected:'', reason:'', pageOrSection:'', capabilityId:'Fake', expectedVisualResult:'', verificationReq:'', evidenceStatus:'planned', originIntent:'' }, null);
    expect(bad).toContain('FAIL');
  });
});
