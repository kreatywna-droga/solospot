import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export interface BlogPost {
  slug: string;
  title: string;
  desc: string;
  date: string;
  category: string;
  image: string;
  content: string;
}

const contentDir = path.join(process.cwd(), 'src', 'content', 'blog');

export function getBlogPosts(): BlogPost[] {
  if (!fs.existsSync(contentDir)) {
    return [];
  }
  
  const files = fs.readdirSync(contentDir);
  const posts = files
    .filter(file => file.endsWith('.md'))
    .map(file => {
      const filePath = path.join(contentDir, file);
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const { data, content } = matter(fileContent);
      
      return {
        slug: file.replace('.md', ''),
        title: data.title,
        desc: data.desc,
        date: data.date,
        category: data.category,
        image: data.image,
        content: content,
      };
    });
    
  return posts;
}

export function getBlogPostBySlug(slug: string): BlogPost | undefined {
  const posts = getBlogPosts();
  return posts.find(post => post.slug === slug);
}
