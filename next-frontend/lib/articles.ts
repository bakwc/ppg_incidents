import fs from 'fs';
import path from 'path';

export interface Article {
  slug: string;
  title: string;
  description: string;
  publishedDate: string;
  content: string;
  coverImage: string;
}

const articlesDir = path.join(process.cwd(), 'articles');

export function getAllArticles(): Article[] {
  if (!fs.existsSync(articlesDir)) {
    return [];
  }

  const files = fs.readdirSync(articlesDir);
  const mdFiles = files.filter(file => file.endsWith('.md'));

  const articles = mdFiles.map(file => {
    const slug = file.replace('.md', '');
    const filePath = path.join(articlesDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');

    const titleMatch = content.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1] : slug;

    const dateMatch = content.match(/\*\*Published:\s+(.+)\*\*/);
    const publishedDate = dateMatch ? dateMatch[1] : '';

    const imageMatch = content.match(/^!\[.*?\]\((.+?)\)/m);
    const coverImage = imageMatch ? imageMatch[1] : '';

    const excerptMatch = content.match(/^(.+?)<!--\s*more\s*-->/s);
    let description = '';
    if (excerptMatch) {
      description = excerptMatch[1]
        .replace(/^#.+$/m, '')
        .replace(/\*\*Published:.+\*\*/, '')
        .replace(/^!\[.*?\]\(.*?\)$/m, '')
        .trim()
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/[#*_`]/g, '');
    } else {
      const firstParagraph = content
        .replace(/^#.+$/m, '')
        .replace(/\*\*Published:.+\*\*/, '')
        .replace(/^!\[.*?\]\(.*?\)$/m, '')
        .trim()
        .split('\n\n')[0]
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/[#*_`]/g, '');
      description = firstParagraph.length > 200
        ? firstParagraph.slice(0, 200) + '...'
        : firstParagraph;
    }

    return {
      slug,
      title,
      description,
      publishedDate,
      content,
      coverImage,
    };
  });

  return articles.sort((a, b) => {
    if (!a.publishedDate) return 1;
    if (!b.publishedDate) return -1;
    return new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime();
  });
}

export function getArticleBySlug(slug: string): Article | null {
  try {
    const filePath = path.join(articlesDir, `${slug}.md`);
    const content = fs.readFileSync(filePath, 'utf-8');

    const titleMatch = content.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1] : slug;

    const dateMatch = content.match(/\*\*Published:\s+(.+)\*\*/);
    const publishedDate = dateMatch ? dateMatch[1] : '';

    const imageMatch = content.match(/^!\[.*?\]\((.+?)\)/m);
    const coverImage = imageMatch ? imageMatch[1] : '';

    return {
      slug,
      title,
      description: '',
      publishedDate,
      content,
      coverImage,
    };
  } catch {
    return null;
  }
}

export function getAllArticleSlugs(): string[] {
  if (!fs.existsSync(articlesDir)) {
    return [];
  }

  const files = fs.readdirSync(articlesDir);
  return files
    .filter(file => file.endsWith('.md'))
    .map(file => file.replace('.md', ''));
}
