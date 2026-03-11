import Link from 'next/link';
import { getAllArticles } from '@/lib/articles';

export default function ArticlesPage() {
  const articles = getAllArticles();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        <h1 className="text-3xl md:text-4xl font-bold text-amber-400 mb-4">Articles</h1>
        <p className="text-slate-300 text-lg mb-8">
          Safety analysis and insights from the PPG Incidents database.
        </p>

        {articles.length === 0 ? (
          <div className="text-slate-400 text-center py-12">
            No articles yet. Check back soon!
          </div>
        ) : (
          <div className="space-y-6">
            {articles.map(article => (
              <article
                key={article.slug}
                className="bg-slate-900/50 border border-slate-800 rounded-lg overflow-hidden hover:border-amber-500/30 transition-colors"
              >
                <div className="p-6 flex flex-col gap-2">
                  {article.publishedDate && (
                    <span className="text-sm text-slate-500">
                      Published: {article.publishedDate}
                    </span>
                  )}
                  <h2 className="text-xl font-semibold text-slate-100">
                    {article.title}
                  </h2>
                  {article.coverImage && (
                    <img
                      src={`/articles/${article.coverImage}`}
                      alt={article.title}
                      className="w-full max-h-64 object-contain mt-2"
                    />
                  )}
                  <p className="text-slate-300 leading-relaxed">
                    {article.description}
                  </p>
                  <Link
                    href={`/articles/${article.slug}`}
                    className="inline-flex items-center text-amber-400 hover:text-amber-300 font-medium mt-2"
                  >
                    Read full article
                    <svg
                      className="w-4 h-4 ml-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
