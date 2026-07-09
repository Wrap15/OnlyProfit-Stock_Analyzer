'use client';

import React, { useEffect, useState } from 'react';
import { BookOpen, ArrowUpRight, Calendar, Sparkles } from 'lucide-react';
import Link from 'next/link';

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  date: string;
}

export default function GrowwBlogSection() {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBlogs() {
      try {
        const res = await fetch('/api/blog');
        if (res.ok) {
          const data = await res.json();
          // Show only top 4 for the homepage widget
          setBlogs(data.slice(0, 4));
        }
      } catch (err) {
        console.error('Failed to load OnlyProfit blogs:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchBlogs();
  }, []);

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
    <section className="py-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-400">
              <BookOpen className="w-3.5 h-3.5" />
            </span>
            <span className="text-xs font-semibold tracking-wider text-emerald-400 uppercase">
              Financial Literacy
            </span>
          </div>
          <h2 className="text-2xl font-black text-text-primary flex items-center gap-2">
            OnlyProfit Insights & Blogs
            <Sparkles className="w-5 h-5 text-yellow-500 fill-yellow-500/20" />
          </h2>
          <p className="text-sm text-text-secondary mt-1">
            Stay updated with the latest stock market research, mutual fund analyses, and IPO guides.
          </p>
        </div>
        
        <Link 
          href="/blog" 
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold text-text-primary bg-card hover:bg-card-hover border border-border rounded-xl transition-all duration-300 group whitespace-nowrap self-start sm:self-auto"
        >
          Visit OnlyProfit Blog
          <ArrowUpRight className="w-3.5 h-3.5 text-text-secondary group-hover:text-text-primary transition-colors group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div 
              key={i} 
              className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-4 animate-pulse"
            >
              <div className="w-20 h-5 bg-border rounded-lg" />
              <div className="w-full h-12 bg-border rounded-lg" />
              <div className="w-full h-8 bg-border rounded-lg" />
              <div className="w-24 h-4 bg-border rounded-lg mt-auto" />
            </div>
          ))}
        </div>
      ) : blogs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {blogs.map((blog) => (
            <Link
              key={blog.id}
              href={`/blog/${blog.slug}`}
              className="group bg-card hover:bg-card-hover border border-border hover:border-emerald-500/30 rounded-2xl p-5 flex flex-col gap-3 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-500/5 relative overflow-hidden"
            >
              {/* Subtle top light effect */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500/0 to-transparent group-hover:via-emerald-500/40 transition-all duration-500" />
              
              <div className="flex items-center justify-between">
                <span className={`px-2.5 py-0.5 text-[10px] font-bold tracking-wider rounded-md border ${getCategoryColor(blog.category)}`}>
                  {blog.category.toUpperCase()}
                </span>
                
                <span className="flex items-center gap-1.5 text-[10px] font-bold text-text-secondary group-hover:text-text-primary transition-colors">
                  <Calendar className="w-3 h-3" />
                  {blog.date}
                </span>
              </div>

              <h3 className="font-extrabold text-sm text-text-primary group-hover:text-emerald-400 transition-colors line-clamp-2 leading-snug">
                {blog.title}
              </h3>

              <p className="text-xs text-text-secondary line-clamp-3 leading-relaxed">
                {blog.description}
              </p>

              <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 mt-auto pt-2 group/btn">
                Read Article
                <ArrowUpRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-sm text-text-secondary font-black bg-card border border-border rounded-2xl">
          No articles found.
        </div>
      )}
    </section>
  );
}
