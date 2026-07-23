'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  content: string;
}

export function TableOfContents({ content }: TableOfContentsProps) {
  const [headings, setHeadings] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    const regex = /^(##|###) (.*$)/gim;
    const items: TocItem[] = [];
    let match;
    
    while ((match = regex.exec(content)) !== null) {
      const level = match[1].length;
      const text = match[2].trim();
      const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-');
      items.push({ id, text, level });
    }
    
    setHeadings(items);

    if (items.length > 0) {
      setActiveId(items[0].id);
    }
  }, [content]);

  if (headings.length === 0) return null;

  return (
    <div className="hidden xl:block w-full max-w-[240px] shrink-0 h-full py-8 pl-8 border-l border-violet-500/10">
      <h4 className="text-sm font-semibold text-slate-200 mb-4">Na tej stronie</h4>
      <ul className="flex flex-col gap-2">
        {headings.map((heading) => (
          <li
            key={heading.id}
            style={{ paddingLeft: `${(heading.level - 2) * 12}px` }}
          >
            <a
              href={`#${heading.id}`}
              onClick={() => setActiveId(heading.id)}
              className={`text-sm block transition-colors duration-200 hover:text-violet-400 ${
                activeId === heading.id ? "text-violet-400 font-medium" : "text-slate-400"
              }`}
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
