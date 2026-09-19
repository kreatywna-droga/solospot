/**
 * ExperienceCatalog.ts — Central Registry & Persistence for SoloSpot Experience Library v2.0
 *
 * Consolidates Builtin Experiences (>270 items across 7 types) and User-Saved Experiences ("My Experiences").
 * Zero React component imports — pure data architecture.
 */

import type {
  ExperienceItem,
  ExperienceType,
  ExperienceMood,
  ExperienceMotionLevel,
  UserExperiencePayload,
} from './ExperienceTypes';
import { ALL_SECTION_TEMPLATES } from '../../components/builder/library/sections';
import { WEBSITE_TEMPLATES } from '../../components/builder/templates/WebsiteTemplatesData';
import { interactiveExperiences } from './ExperienceDefinitions/interactive-experiences';
import { backgroundExperiences } from './ExperienceDefinitions/background-experiences';
import { effectExperiences } from './ExperienceDefinitions/effect-experiences';
import { motionExperiences } from './ExperienceDefinitions/motion-experiences';
import { expandedHeroExperiences } from './ExperienceDefinitions/hero-expanded-experiences';
import { cloneNodeWithNewIds, generateNodeId } from '../../../packages/builder-core/src/NodeTree';
import { createSectionNode, BuilderNode } from '../../../packages/builder-core/src/BuilderDocument';

const USER_EXP_STORAGE_KEY = 'solospot_user_experiences_v2';
const FAVORITES_STORAGE_KEY = 'solospot_experience_favorites_v2';
const RECENTS_STORAGE_KEY = 'solospot_experience_recents_v2';

const memoryStore = new Map<string, string>();

function getStorageItem(key: string): string | null {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      return localStorage.getItem(key);
    } catch {
      return memoryStore.get(key) || null;
    }
  }
  return memoryStore.get(key) || null;
}

function setStorageItem(key: string, val: string): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem(key, val);
      return;
    } catch {
      // fallback to memory
    }
  }
  memoryStore.set(key, val);
}

export function clearExperienceStorageForTesting(): void {
  memoryStore.clear();
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.removeItem(USER_EXP_STORAGE_KEY);
      localStorage.removeItem(FAVORITES_STORAGE_KEY);
      localStorage.removeItem(RECENTS_STORAGE_KEY);
    } catch {}
  }
}

// ---------------------------------------------------------------------------
// Builtin Adapters
// ---------------------------------------------------------------------------

// Adapt Section Templates into canonical ExperienceItems
const adaptedSectionExperiences: ExperienceItem[] = ALL_SECTION_TEMPLATES.map(tmpl => {
  const isHero = tmpl.category === 'hero';
  return {
    id: tmpl.id,
    name: tmpl.name,
    type: isHero ? 'hero' : 'section',
    category: tmpl.category,
    description: tmpl.description,
    badge: tmpl.badge,
    source: 'builtin',
    schemaVersion: '2.0.0',
    contentVersion: '2.0.0',
    mood: (tmpl.style?.toLowerCase() as ExperienceMood) || 'dark',
    motionLevel: 'subtle',
    industry: tmpl.industry || ['general'],
    tags: tmpl.tags || [tmpl.category],
    previewClass: tmpl.preview,
    createNode: tmpl.createNode,
  };
});

// Adapt Website Templates into canonical ExperienceItems
const adaptedWebsiteExperiences: ExperienceItem[] = WEBSITE_TEMPLATES.map(tmpl => {
  return {
    id: tmpl.id,
    name: tmpl.name,
    type: 'website',
    category: 'website',
    description: tmpl.description,
    tagline: tmpl.tagline,
    badge: tmpl.badge || 'Website',
    source: 'builtin',
    schemaVersion: '2.0.0',
    contentVersion: '2.0.0',
    mood: (tmpl.style?.toLowerCase() as ExperienceMood) || 'modern' as any,
    motionLevel: 'animated',
    industry: tmpl.industry || ['general'],
    tags: tmpl.tags || ['website', 'full-page'],
    sectionTemplateIds: tmpl.sectionTemplateIds,
    createNode: () => {
      // Constructs a container representing the full page starter
      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: `Website: ${tmpl.name}`,
        props: { websiteTemplateId: tmpl.id, name: tmpl.name },
        styles: { backgroundColor: '#090910', padding: { top: '60px', right: '24px', bottom: '60px', left: '24px' } },
        children: [],
      });
    },
  };
});

// Master Builtin Catalog
export const BUILTIN_EXPERIENCES: ExperienceItem[] = [
  ...adaptedWebsiteExperiences,
  ...expandedHeroExperiences,
  ...adaptedSectionExperiences,
  ...interactiveExperiences,
  ...backgroundExperiences,
  ...effectExperiences,
  ...motionExperiences,
];

// ---------------------------------------------------------------------------
// User Experiences (My Experiences) Persistence API
// ---------------------------------------------------------------------------

export function getUserExperiences(): ExperienceItem[] {
  try {
    const raw = getStorageItem(USER_EXP_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as (ExperienceItem & { savedNode?: BuilderNode; node?: BuilderNode })[];
    return parsed.map(item => {
      const nodeFactory = () => cloneNodeWithNewIds(item.savedNode || item.node!);
      const motion = item.motionLevel || item.motion || 'subtle';
      const title = item.title || item.name;
      return {
        ...item,
        name: title,
        title,
        source: 'user' as const,
        author: item.author || 'Użytkownik',
        schemaVersion: item.schemaVersion || '2.0.0',
        contentVersion: item.contentVersion || '2.0.0',
        motionLevel: motion,
        motion,
        createNode: nodeFactory,
        nodes: [nodeFactory()],
      };
    });
  } catch (err) {
    console.warn('Failed to load user experiences from storage:', err);
    return [];
  }
}

export function saveUserExperience(payload: UserExperiencePayload): ExperienceItem {
  const existing = getUserExperiences();
  const id = `usr-exp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const rootNode = payload.node || (payload.nodes && payload.nodes[0]);
  if (!rootNode) {
    throw new Error('saveUserExperience requires a root node');
  }
  const clonedNode = cloneNodeWithNewIds(rootNode);
  const title = (payload.name || payload.title || 'My Custom Experience').trim();
  const mood = payload.mood || 'dark';
  const motionLevel = payload.motionLevel || payload.motion || 'subtle';

  const newExperience: ExperienceItem = {
    id,
    name: title,
    title,
    type: payload.type || 'section',
    category: payload.category || 'my-experiences',
    description: payload.description || 'User-saved custom experience',
    badge: 'Custom',
    source: 'user',
    author: 'Użytkownik',
    schemaVersion: '2.0.0',
    contentVersion: '2.0.0',
    mood,
    motionLevel,
    motion: motionLevel,
    industry: payload.industry
      ? (Array.isArray(payload.industry) ? payload.industry : [payload.industry])
      : ['general'],
    tags: payload.tags || ['custom', 'my-experience'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createNode: () => cloneNodeWithNewIds(clonedNode),
    nodes: [cloneNodeWithNewIds(clonedNode)],
  };

  // Serializable storage payload
  const storagePayload = {
    ...newExperience,
    savedNode: clonedNode,
  };

  const updated = [storagePayload, ...existing.map(e => ({ ...e, savedNode: e.createNode() }))];
  setStorageItem(USER_EXP_STORAGE_KEY, JSON.stringify(updated));

  return newExperience;
}

export function deleteUserExperience(id: string): boolean {
  const existing = getUserExperiences();
  const filtered = existing.filter(e => e.id !== id);
  const storagePayload = filtered.map(e => ({ ...e, savedNode: e.createNode() }));
  setStorageItem(USER_EXP_STORAGE_KEY, JSON.stringify(storagePayload));
  return true;
}

export function duplicateUserExperience(id: string): ExperienceItem | null {
  const existing = getUserExperiences();
  const target = existing.find(e => e.id === id);
  if (!target) return null;

  return saveUserExperience({
    name: `${target.name} (Kopia)`,
    title: `${target.name} (Kopia)`,
    description: target.description,
    type: target.type,
    category: target.category,
    mood: target.mood,
    motionLevel: target.motionLevel,
    tags: target.tags,
    node: target.createNode(),
  });
}

// ---------------------------------------------------------------------------
// Favorites & Recently Used Persistence
// ---------------------------------------------------------------------------

export function getFavorites(): string[] {
  try {
    const raw = getStorageItem(FAVORITES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function toggleFavorite(id: string): boolean {
  const favs = new Set(getFavorites());
  let isFav = false;
  if (favs.has(id)) {
    favs.delete(id);
    isFav = false;
  } else {
    favs.add(id);
    isFav = true;
  }
  setStorageItem(FAVORITES_STORAGE_KEY, JSON.stringify(Array.from(favs)));
  return isFav;
}

export function isFavorite(id: string): boolean {
  return getFavorites().includes(id);
}

export function getRecentlyUsed(): string[] {
  try {
    const raw = getStorageItem(RECENTS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function recordRecentlyUsed(id: string): void {
  const recents = getRecentlyUsed().filter(item => item !== id);
  recents.unshift(id);
  const bounded = recents.slice(0, 15);
  setStorageItem(RECENTS_STORAGE_KEY, JSON.stringify(bounded));
}

// ---------------------------------------------------------------------------
// Unified Catalog Query API
// ---------------------------------------------------------------------------

export interface ExperienceFilterOptions {
  type?: ExperienceType | 'all';
  category?: string;
  mood?: ExperienceMood | 'all';
  motionLevel?: ExperienceMotionLevel | 'all';
  motion?: ExperienceMotionLevel | 'all';
  industry?: string;
  searchQuery?: string;
  query?: string;
  favoritesOnly?: boolean;
  recentlyUsedOnly?: boolean;
  source?: 'all' | 'builtin' | 'user';
}

export function getAllExperiences(): ExperienceItem[] {
  const user = getUserExperiences();
  return [
    ...user,
    ...BUILTIN_EXPERIENCES.map(item => {
      const motion = item.motionLevel || item.motion || 'subtle';
      const title = item.title || item.name;
      return {
        ...item,
        name: title,
        title,
        author: item.author || 'SoloSpot Official',
        motionLevel: motion,
        motion,
        nodes: item.nodes || [item.createNode()],
      };
    }),
  ];
}

export function getExperienceById(id: string): ExperienceItem | undefined {
  return getAllExperiences().find(item => item.id === id);
}

export function getExperiencesByCategory(category: string): ExperienceItem[] {
  return getAllExperiences().filter(item => item.category === category || item.type === category);
}

export function searchExperiences(options: ExperienceFilterOptions = {}): ExperienceItem[] {
  const all = getAllExperiences();
  const favs = new Set(getFavorites());
  const recents = new Set(getRecentlyUsed());

  const q = (options.query || options.searchQuery || '').toLowerCase().trim();
  const targetMotion = options.motion || options.motionLevel;

  return all.filter(item => {
    // Favorites only filter
    if (options.favoritesOnly && !favs.has(item.id)) return false;

    // Recently used only filter
    if (options.recentlyUsedOnly && !recents.has(item.id)) return false;

    // Source filter
    if (options.source && options.source !== 'all' && item.source !== options.source) return false;

    // Type filter
    if (options.type && options.type !== 'all' && item.type !== options.type) return false;

    // Category filter
    if (options.category && options.category !== 'all') {
      if (options.category === 'my-experiences') {
        if (item.source !== 'user') return false;
      } else if (options.category === 'favorites') {
        if (!favs.has(item.id)) return false;
      } else if (item.category !== options.category && item.type !== options.category) {
        return false;
      }
    }

    // Mood filter
    if (options.mood && options.mood !== 'all' && item.mood !== options.mood) return false;

    // Motion Level filter
    if (targetMotion && targetMotion !== 'all' && item.motionLevel !== targetMotion && item.motion !== targetMotion) {
      return false;
    }

    // Industry filter
    if (options.industry && options.industry !== 'All') {
      const targetInd = options.industry.toLowerCase();
      const hasInd = item.industry?.some(i => i.toLowerCase().includes(targetInd));
      if (!hasInd) return false;
    }

    // Search Query (title, description, category, tags, tagline, badge)
    if (q) {
      const matchName = item.name.toLowerCase().includes(q);
      const matchTitle = item.title?.toLowerCase().includes(q) || false;
      const matchDesc = item.description.toLowerCase().includes(q);
      const matchTagline = item.tagline?.toLowerCase().includes(q) || false;
      const matchBadge = item.badge?.toLowerCase().includes(q) || false;
      const matchCategory = item.category.toLowerCase().includes(q);
      const matchTags = item.tags.some(t => t.toLowerCase().includes(q));
      if (!matchName && !matchTitle && !matchDesc && !matchTagline && !matchBadge && !matchCategory && !matchTags) {
        return false;
      }
    }

    return true;
  });
}

// Aliases for parity
export const toggleFavoriteExperience = toggleFavorite;
export const isFavoriteExperience = isFavorite;
export const getFavoriteExperienceIds = getFavorites;
export const trackRecentExperience = recordRecentlyUsed;
export const getRecentExperienceIds = getRecentlyUsed;
export const filterExperiences = searchExperiences;
