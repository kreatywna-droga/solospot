'use client';

import * as React from 'react';
import type { WidgetProps } from '../registry/types';
import { inputBaseClass, labelClass } from './WidgetShared';

/**
 * LinkWidget — Sprint 7.1 Inspector 2.0 UI Layer
 *
 * URL/Path link editor widget.
 * Pure presentation — no validation, no business logic.
 *
 * @agent Agent 3 — Supporting Implementation Engineer
 * @status READY FOR INTEGRATION BY AGENT 1
 */

interface LinkShape {
  href?: string;
  target?: string;
  rel?: string;
  title?: string;
}

const defaultLink: LinkShape = {
  href: '',
  target: '_self',
  rel: '',
  title: '',
};

function parseLink(value: unknown): LinkShape {
  if (value && typeof value === 'object') {
    const v = value as Record<string, unknown>;
    return {
      href: typeof v.href === 'string' ? v.href : defaultLink.href,
      target: typeof v.target === 'string' ? v.target : defaultLink.target,
      rel: typeof v.rel === 'string' ? v.rel : defaultLink.rel,
      title: typeof v.title === 'string' ? v.title : defaultLink.title,
    };
  }
  return defaultLink;
}

const TARGET_OPTIONS = [
  { label: 'Same tab', value: '_self' },
  { label: 'New tab', value: '_blank' },
  { label: 'Parent', value: '_parent' },
  { label: 'Top', value: '_top' },
];

const LinkWidget: React.FC<WidgetProps<LinkShape>> = ({ value, onChange }) => {
  const link = parseLink(value);

  const update = (partial: Partial<LinkShape>) => onChange({ ...link, ...partial });

  return (
    <div className="space-y-3">
      {/* URL */}
      <div>
        <label className={labelClass}>URL</label>
        <input
          type="text"
          value={link.href || ''}
          onChange={(e) => update({ href: e.target.value })}
          placeholder="https:// or /path"
          className={inputBaseClass}
        />
      </div>

      {/* Target */}
      <div>
        <label className={labelClass}>Open in</label>
        <select
          value={link.target || '_self'}
          onChange={(e) => update({ target: e.target.value })}
          className="w-full bg-[#0a0a14] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/50 transition-all"
        >
          {TARGET_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Rel */}
      <div>
        <label className={labelClass}>Rel attribute</label>
        <input
          type="text"
          value={link.rel || ''}
          onChange={(e) => update({ rel: e.target.value })}
          placeholder="noopener noreferrer"
          className={inputBaseClass}
        />
      </div>

      {/* Title */}
      <div>
        <label className={labelClass}>Title (tooltip)</label>
        <input
          type="text"
          value={link.title || ''}
          onChange={(e) => update({ title: e.target.value })}
          placeholder="Link description"
          className={inputBaseClass}
        />
      </div>
    </div>
  );
};

export default React.memo(LinkWidget);

