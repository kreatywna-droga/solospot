import { Capability } from './types';
// REAL SOLOSPOT CAPABILITIES ONLY — from BuilderDocument / Design System / ToolInventory / Section Library
export const CAPABILITIES: Capability[] = [
  { id:'Hero', name:'Hero section', tool:'Hero', commands:['addHero','updateHeroStyle'], verify:'section visible; heading+CTA present; responsive 1024/640', existsInInventory:true },
  { id:'Typography', name:'Font/scale', tool:'Typography', commands:['applyFontPairing','applyHeadlineScale'], verify:'fontFamily applied; scale consistent; responsive readable', existsInInventory:true },
  { id:'Button', name:'Primary CTA', tool:'Button', commands:['addButton','updateButtonStyle'], verify:'button visible; contrast OK; hover state defined', existsInInventory:true },
  { id:'Color', name:'Palette', tool:'Palette', commands:['applyPalette','updateThemeColors'], verify:'swatch applied; accessibility contrast >4.5; no clash', existsInInventory:true },
  { id:'Layout', name:'Composition/layout', tool:'Layout', commands:['setGrid','updateComposition'], verify:'spacing rhythm; alignment; responsive breakpoints', existsInInventory:true },
  { id:'Section', name:'Library section', tool:'SectionLibrary', commands:['addSection','updateSectionProps'], verify:'section renders; props valid; mobile/tablet OK', existsInInventory:true },
  { id:'Background', name:'Background/texture', tool:'Background', commands:['applyBackground','updateBgPattern'], verify:'bg renders; text readable; no overlay clash', existsInInventory:true },
];
export const mapDecision = (intent: string) => {
  const caps = CAPABILITIES.filter(c => intent.toLowerCase().includes(c.id.toLowerCase()) || intent.toLowerCase().includes(c.name.toLowerCase()));
  return caps.length ? caps[0] : null; // real cap or null — never invent
};
