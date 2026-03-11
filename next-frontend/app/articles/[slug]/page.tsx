import { notFound } from 'next/navigation';
import { getArticleBySlug, getAllArticleSlugs } from '@/lib/articles';
import ArticleContent from '@/components/ArticleContent';

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = getAllArticleSlugs();
  return slugs.map(slug => ({ slug }));
}

export async function generateMetadata({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);

  if (!article) {
    return {
      title: 'Article Not Found',
    };
  }

  return {
    title: `${article.title} | PPG Incidents`,
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        <article>
          <header className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-amber-400 mb-4">
              {article.title}
            </h1>
            {article.publishedDate && (
              <p className="text-slate-500">
                Published: {article.publishedDate}
              </p>
            )}
          </header>

          <ArticleContent content={article.content} />
        </article>
      </div>
    </div>
  );
}
