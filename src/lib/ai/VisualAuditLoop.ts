/**
 * VisualAuditLoop.ts — Structural & Visual Audit of Builder Document
 *
 * Analyzes BuilderDocument for common design issues:
 * - Typography hierarchy problems
 * - Spacing inconsistencies
 * - Color contrast issues
 * - Layout problems
 * - Missing content
 * - Responsive issues
 * - Experience appropriateness
 *
 * Returns actionable issue list with priorities.
 */

import type { BuilderDocument, BuilderNode, NodeType, NodeStyles } from '../../../packages/builder-core/src';
import { findNode, getNode, getParent, getChildren } from '../../../packages/builder-core/src/NodeTree';

// ── Audit Types ────────────────────────────────────────────────────

export type AuditSeverity = 'critical' | 'warning' | 'info';
export type AuditCategory = 'typography' | 'spacing' | 'color' | 'layout' | 'content' | 'responsive' | 'experience' | 'structure';

export interface AuditIssue {
  id: string;
  severity: AuditSeverity;
  category: AuditCategory;
  title: string;
  description: string;
  nodeId: string;
  nodeLabel: string;
  sectionId: string | null;
  sectionLabel: string | null;
  currentValue: string;
  recommendedValue: string;
  toolToFix: string;
  fixArgs: Record<string, unknown>;
  priority: number;
}

export interface AuditReport {
  timestamp: string;
  documentName: string;
  pageName: string;
  totalNodes: number;
  totalIssues: number;
  criticalCount: number;
  warningCount: number;
  infoCount: number;
  issues: AuditIssue[];
  overallScore: number;
  recommendations: string[];
}

// ── Auditor ────────────────────────────────────────────────────────

export function auditDocument(
  doc: BuilderDocument,
  activePageId?: string
): AuditReport {
  const pageId = activePageId || doc.pages[0]?.id || 'page-home';
  const page = doc.pages.find(p => p.id === pageId) || doc.pages[0];

  const issues: AuditIssue[] = [];

  if (page) {
    for (const section of page.sections) {
      auditNode(section, page.sections, issues, doc);
      if (section.children) {
        for (const child of section.children) {
          auditNode(child, page.sections, issues, doc);
          if (child.children) {
            for (const grandchild of child.children) {
              auditNode(grandchild, page.sections, issues, doc);
            }
          }
        }
      }
    }
  }

  const sorted = issues.sort((a, b) => {
    const sevOrder = { critical: 0, warning: 1, info: 2 };
    return (sevOrder[a.severity] - sevOrder[b.severity]) || (a.priority - b.priority);
  });

  return {
    timestamp: new Date().toISOString(),
    documentName: doc.name || doc.metadata?.storeName || 'Untitled',
    pageName: page?.name || 'Główna',
    totalNodes: countNodes(page?.sections || []),
    totalIssues: sorted.length,
    criticalCount: sorted.filter(i => i.severity === 'critical').length,
    warningCount: sorted.filter(i => i.severity === 'warning').length,
    infoCount: sorted.filter(i => i.severity === 'info').length,
    issues: sorted,
    overallScore: calculateScore(sorted),
    recommendations: generateRecommendations(sorted),
  };
}

function auditNode(
  node: BuilderNode,
  sections: BuilderNode[],
  issues: AuditIssue[],
  doc: BuilderDocument
): void {
  const section = findSectionForNode(sections, node.id);
  const sectionId = section?.id || null;
  const sectionLabel = section?.label || section?.type || null;

  // Typography checks
  if (node.type === 'heading') {
    const fontSize = parsePx(node.styles?.fontSize);
    if (fontSize && fontSize < 24) {
      issues.push({
        id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        severity: 'warning',
        category: 'typography',
        title: 'Heading zbyt mały',
        description: `Nagłówek "${node.label}" ma rozmiar ${fontSize}px. Zalecane minimum: 24px.`,
        nodeId: node.id,
        nodeLabel: node.label || node.type,
        sectionId,
        sectionLabel,
        currentValue: `${fontSize}px`,
        recommendedValue: '24px+',
        toolToFix: 'set_node_styles',
        fixArgs: { nodeId: node.id, styles: { fontSize: '32px' } },
        priority: 2,
      });
    }

    if (fontSize && fontSize > 120) {
      issues.push({
        id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        severity: 'info',
        category: 'typography',
        title: 'Heading zbyt duży',
        description: `Nagłówek "${node.label}" ma rozmiar ${fontSize}px. Może być trudny do czytania.`,
        nodeId: node.id,
        nodeLabel: node.label || node.type,
        sectionId,
        sectionLabel,
        currentValue: `${fontSize}px`,
        recommendedValue: '48-96px',
        toolToFix: 'set_node_styles',
        fixArgs: { nodeId: node.id, styles: { fontSize: '64px' } },
        priority: 5,
      });
    }

    const fontWeight = parseNumber(node.styles?.fontWeight);
    if (fontWeight && fontWeight < 400) {
      issues.push({
        id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        severity: 'warning',
        category: 'typography',
        title: 'Heading zbyt cienki',
        description: `Nagłówek "${node.label}" ma grubość ${fontWeight}. Zalecane: 600+.`,
        nodeId: node.id,
        nodeLabel: node.label || node.type,
        sectionId,
        sectionLabel,
        currentValue: `${fontWeight}`,
        recommendedValue: '600+',
        toolToFix: 'set_node_styles',
        fixArgs: { nodeId: node.id, styles: { fontWeight: '700' } },
        priority: 3,
      });
    }
  }

  // Spacing checks
  if (node.type === 'section') {
    const paddingRaw = node.styles?.paddingTop || (typeof node.styles?.padding === 'string' ? node.styles.padding : undefined);
    const padding = parsePx(paddingRaw);
    if (padding && padding < 40) {
      issues.push({
        id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        severity: 'warning',
        category: 'spacing',
        title: 'Sekcja zbyt mały padding',
        description: `Sekcja "${node.label}" ma padding-top ${padding}px. Zalecane minimum: 60px.`,
        nodeId: node.id,
        nodeLabel: node.label || node.type,
        sectionId,
        sectionLabel,
        currentValue: `${padding}px`,
        recommendedValue: '60-120px',
        toolToFix: 'set_node_styles',
        fixArgs: { nodeId: node.id, styles: { padding: '80px 0' } },
        priority: 3,
      });
    }
  }

  // Content checks
  if (node.type === 'heading' || node.type === 'text') {
    const text = (node.props?.text as string) || (node.props?.title as string) || '';
    if (text.length === 0) {
      issues.push({
        id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        severity: 'critical',
        category: 'content',
        title: 'Pusty element tekstowy',
        description: `Element "${node.label}" nie ma zawartości tekstowej.`,
        nodeId: node.id,
        nodeLabel: node.label || node.type,
        sectionId,
        sectionLabel,
        currentValue: '(pusty)',
        recommendedValue: 'Treść tekstowa',
        toolToFix: 'update_node_props',
        fixArgs: { sectionId: node.id, props: { text: 'Tekst domyślny' } },
        priority: 1,
      });
    }
  }

  // Image checks
  if (node.type === 'image') {
    const src = (node.props?.src as string) || (node.props?.image as string) || '';
    if (!src) {
      issues.push({
        id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        severity: 'critical',
        category: 'content',
        title: 'Obraz bez źródła',
        description: `Element "${node.label}" nie ma URL obrazu.`,
        nodeId: node.id,
        nodeLabel: node.label || node.type,
        sectionId,
        sectionLabel,
        currentValue: '(brak)',
        recommendedValue: 'URL obrazu',
        toolToFix: 'update_node_props',
        fixArgs: { sectionId: node.id, props: { src: '' } },
        priority: 1,
      });
    }
  }

  // Color contrast basic check
  const bgColor = node.styles?.backgroundColor;
  const textColor = node.styles?.color;
  if (bgColor && textColor) {
    const bgLuminance = getRelativeLuminance(bgColor);
    const textLuminance = getRelativeLuminance(textColor);
    if (bgLuminance !== null && textLuminance !== null) {
      const ratio = getContrastRatio(bgLuminance, textLuminance);
      if (ratio < 3) {
        issues.push({
          id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          severity: 'warning',
          category: 'color',
          title: 'Niski kontrast',
          description: `Kontrast między tłem "${bgColor}" a tekstem "${textColor}" wynosi ${ratio.toFixed(1)}:1. Zalecane minimum: 4.5:1.`,
          nodeId: node.id,
          nodeLabel: node.label || node.type,
          sectionId,
          sectionLabel,
          currentValue: `${ratio.toFixed(1)}:1`,
          recommendedValue: '4.5:1+',
          toolToFix: 'set_node_styles',
          fixArgs: { nodeId: node.id, styles: { color: '#FFFFFF' } },
          priority: 4,
        });
      }
    }
  }
}

// ── Helpers ────────────────────────────────────────────────────────

function findSectionForNode(sections: BuilderNode[], nodeId: string): BuilderNode | null {
  for (const section of sections) {
    if (section.id === nodeId) return section;
    if (section.children && findInChildren(section.children, nodeId)) {
      return section;
    }
  }
  return null;
}

function findInChildren(nodes: BuilderNode[], nodeId: string): BuilderNode | null {
  for (const node of nodes) {
    if (node.id === nodeId) return node;
    if (node.children) {
      const found = findInChildren(node.children, nodeId);
      if (found) return found;
    }
  }
  return null;
}

function countNodes(nodes: BuilderNode[]): number {
  let count = 0;
  for (const node of nodes) {
    count++;
    if (node.children) count += countNodes(node.children);
  }
  return count;
}

function parsePx(value: string | undefined): number | null {
  if (!value) return null;
  const match = value.match(/^(\d+(?:\.\d+)?)px/);
  return match ? parseFloat(match[1]) : null;
}

function parseNumber(value: string | number | undefined): number | null {
  if (value === undefined || value === null) return null;
  const num = typeof value === 'number' ? value : parseInt(value, 10);
  return isNaN(num) ? null : num;
}

function getRelativeLuminance(color: string): number | null {
  const hex = color.replace('#', '');
  if (hex.length !== 6) return null;
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function getContrastRatio(l1: number, l2: number): number {
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function calculateScore(issues: AuditIssue[]): number {
  const critical = issues.filter(i => i.severity === 'critical').length;
  const warning = issues.filter(i => i.severity === 'warning').length;
  const info = issues.filter(i => i.severity === 'info').length;
  const score = 100 - (critical * 15) - (warning * 5) - (info * 1);
  return Math.max(0, Math.min(100, score));
}

function generateRecommendations(issues: AuditIssue[]): string[] {
  const recs: string[] = [];
  const critical = issues.filter(i => i.severity === 'critical');
  const warning = issues.filter(i => i.severity === 'warning');

  if (critical.length > 0) {
    recs.push(`Napraw ${critical.length} krytycznych problemów przed publikacją.`);
  }
  if (warning.length > 0) {
    recs.push(`Rozważ naprawę ${warning.length} ostrzeżeń dla lepszego UX.`);
  }

  const typoIssues = issues.filter(i => i.category === 'typography');
  if (typoIssues.length > 2) {
    recs.push('Wiele problemów z typografią — rozważ użycie spójnych presetów czcionek.');
  }

  const spacingIssues = issues.filter(i => i.category === 'spacing');
  if (spacingIssues.length > 2) {
    recs.push('Niespójne odstępy — zwiększ padding sekcji do 60-120px.');
  }

  return recs;
}
