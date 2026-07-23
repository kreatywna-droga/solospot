import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export interface DocMeta {
  title: string;
  description: string;
  category: string;
  order: number;
  slug: string;
}

export interface DocFile extends DocMeta {
  content: string;
}

const DOCS_DIR = path.join(process.cwd(), 'content', 'docs');

function ensureDocsDir() {
  if (!fs.existsSync(DOCS_DIR)) {
    fs.mkdirSync(DOCS_DIR, { recursive: true });
  }
}

export function getAllDocs(): DocMeta[] {
  ensureDocsDir();
  const files = fs.readdirSync(DOCS_DIR).filter(file => file.endsWith('.md'));

  const docs = files.map(file => {
    const slug = file.replace(/\.md$/, '');
    const fullPath = path.join(DOCS_DIR, file);
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data } = matter(fileContents);

    return {
      slug,
      title: data.title || slug,
      description: data.description || '',
      category: data.category || 'Ogólne',
      order: data.order !== undefined ? data.order : 99,
    };
  });

  return docs.sort((a, b) => a.order - b.order);
}

export function getDocBySlug(slug: string): DocFile | null {
  ensureDocsDir();
  const fullPath = path.join(DOCS_DIR, `${slug}.md`);

  if (!fs.existsSync(fullPath)) {
    return null;
  }

  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const { data, content } = matter(fileContents);

  return {
    slug,
    title: data.title || slug,
    description: data.description || '',
    category: data.category || 'Ogólne',
    order: data.order !== undefined ? data.order : 99,
    content,
  };
}

export function getDocsGroupedByCategory(): Record<string, DocMeta[]> {
  const docs = getAllDocs();
  const grouped: Record<string, DocMeta[]> = {};

  docs.forEach(doc => {
    if (!grouped[doc.category]) {
      grouped[doc.category] = [];
    }
    grouped[doc.category].push(doc);
  });

  return grouped;
}
