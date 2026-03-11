'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Image from 'next/image';

interface ArticleContentProps {
  content: string;
}

export default function ArticleContent({ content }: ArticleContentProps) {
  const processedContent = content
    .replace(/^#\s+.+$/m, '')
    .replace(/\*\*Published:\s+.+\*\*/, '')
    .trim();

  return (
    <div className="prose prose-invert prose-slate max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-3xl font-bold text-amber-400 mt-8 mb-4">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-2xl font-semibold text-slate-100 mt-8 mb-4 border-b border-slate-800 pb-2">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-xl font-semibold text-slate-200 mt-6 mb-3">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="text-slate-300 leading-relaxed mb-4">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-inside text-slate-300 mb-4 space-y-1">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside text-slate-300 mb-4 space-y-1">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="text-slate-300">
              {children}
            </li>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-slate-100">
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em className="italic text-slate-200">
              {children}
            </em>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              className="text-amber-400 hover:text-amber-300 underline"
              target={href?.startsWith('http') ? '_blank' : undefined}
              rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
            >
              {children}
            </a>
          ),
          hr: () => (
            <hr className="border-slate-800 my-8" />
          ),
          img: ({ src, alt }) => {
            if (!src) return null;

            return (
              <img
                src={src.startsWith('http') ? src : `/articles/${src}`}
                alt={alt || ''}
                className="rounded-lg max-w-full h-auto max-h-[330px] object-contain mx-auto block"
              />
            );
          },
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-amber-500 pl-4 italic text-slate-400 my-4">
              {children}
            </blockquote>
          ),
          code: ({ children }) => (
            <code className="bg-slate-800 text-amber-300 px-1.5 py-0.5 rounded text-sm">
              {children}
            </code>
          ),
          pre: ({ children }) => (
            <pre className="bg-slate-800 p-4 rounded-lg overflow-x-auto my-4">
              {children}
            </pre>
          ),
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
}
