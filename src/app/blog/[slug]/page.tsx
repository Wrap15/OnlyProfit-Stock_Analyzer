'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Calendar, Clock, ArrowUpRight, BookOpen, Share2 } from 'lucide-react';
import { BLOG_POSTS } from '@/lib/blogsData';

export default function BlogDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  const post = BLOG_POSTS.find((p) => p.slug === slug);

  if (!post) {
    return (
      <main className="min-h-screen bg-background text-text-primary flex flex-col items-center justify-center p-6">
        <div className="text-center max-w-md bg-card border border-border p-8 rounded-3xl">
          <BookOpen className="w-12 h-12 text-red-500/60 mx-auto mb-4" />
          <h1 className="text-xl font-black mb-2">Insight Not Found</h1>
          <p className="text-xs text-text-secondary mb-6">
            The blog post you are looking for may have been archived or renamed.
          </p>
          <Link 
            href="/blog" 
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-black bg-emerald-500 rounded-xl hover:bg-emerald-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Academy
          </Link>
        </div>
      </main>
    );
  }

  // Get related posts (exclude current)
  const relatedPosts = BLOG_POSTS.filter((p) => p.id !== post.id).slice(0, 3);

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'mutual funds':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'ipos':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'personal finance':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      default:
        return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
    }
  };

  return (
    <main className="min-h-screen bg-background text-text-primary selection:bg-emerald-500/20">
      {/* Top Navbar */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/60 px-4 sm:px-8 py-4 flex items-center justify-between">
        <Link 
          href="/blog" 
          className="flex items-center gap-2 text-xs font-bold text-text-secondary hover:text-text-primary transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to Insights
        </Link>
        
        <div className="flex items-center gap-4">
          <button className="p-2 rounded-lg bg-card-hover border border-border text-text-secondary hover:text-text-primary transition-colors">
            <Share2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </nav>

      {/* Hero Header */}
      <div className="border-b border-border/40 py-16 bg-card-hover/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-3 mb-4">
            <span className={`px-2.5 py-0.5 text-[10px] font-bold tracking-wider rounded-md border ${getCategoryColor(post.category)}`}>
              {post.category.toUpperCase()}
            </span>
            <span className="text-xs text-text-secondary">•</span>
            <span className="flex items-center gap-1 text-xs text-text-secondary font-semibold">
              <Clock className="w-3.5 h-3.5" />
              {post.readTime}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-text-primary leading-tight mb-6">
            {post.title}
          </h1>

          {/* Author info */}
          <div className="flex items-center gap-4 pt-4 border-t border-border/60">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-black text-sm">
              {post.author.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <div className="text-xs font-black text-text-primary">{post.author}</div>
              <div className="text-[10px] font-bold text-text-secondary">{post.authorRole}</div>
            </div>
            <div className="ml-auto flex items-center gap-1.5 text-xs text-text-secondary font-bold">
              <Calendar className="w-4 h-4" />
              {post.date}
            </div>
          </div>
        </div>
      </div>

      {/* Blog Content */}
      <article className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="bg-card border border-border p-6 sm:p-10 rounded-3xl shadow-sm flex flex-col gap-6 text-sm sm:text-base text-text-primary leading-relaxed">
          {post.content.map((paragraph, index) => (
            <p key={index} className="text-text-primary">
              {paragraph}
            </p>
          ))}
        </div>
      </article>

      {/* Related Blogs and Insights Section */}
      <section className="border-t border-border/60 py-16 bg-card-hover/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-text-primary">
                Related Blogs & Insights
              </h2>
              <p className="text-xs text-text-secondary mt-1">
                More financial resources handpicked by the OnlyProfit team.
              </p>
            </div>
            <Link 
              href="/blog" 
              className="text-xs font-bold text-emerald-400 hover:underline flex items-center gap-1 group"
            >
              See All Posts
              <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedPosts.map((related) => (
              <Link
                key={related.id}
                href={`/blog/${related.slug}`}
                className="group bg-card hover:bg-card-hover border border-border hover:border-emerald-500/30 rounded-2xl p-5 flex flex-col gap-3 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500/0 to-transparent group-hover:via-emerald-500/30 transition-all duration-500" />
                
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 text-[9px] font-bold tracking-wider rounded-md border ${getCategoryColor(related.category)}`}>
                    {related.category.toUpperCase()}
                  </span>
                  
                  <span className="text-[10px] font-bold text-text-secondary">
                    {related.date}
                  </span>
                </div>

                <h3 className="font-extrabold text-xs sm:text-sm text-text-primary group-hover:text-emerald-400 transition-colors line-clamp-2 leading-snug">
                  {related.title}
                </h3>

                <p className="text-[11px] text-text-secondary line-clamp-2 leading-relaxed">
                  {related.description}
                </p>

                <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 mt-auto pt-2">
                  Read Article
                  <ArrowUpRight className="w-3 h-3" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
