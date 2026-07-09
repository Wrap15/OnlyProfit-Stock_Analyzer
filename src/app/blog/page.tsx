'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Search, Calendar, ArrowUpRight, Sparkles } from 'lucide-react';
import { BLOG_POSTS } from '@/lib/blogsData';

export default function BlogIndexPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', 'Stocks', 'Mutual Funds', 'IPOs', 'Personal Finance'];

  const filteredPosts = BLOG_POSTS.filter((post) => {
    const matchesSearch = 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

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
      {/* Top Navigation */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/60 px-4 sm:px-8 py-4 flex items-center justify-between">
        <Link 
          href="/" 
          className="flex items-center gap-2 text-xs font-bold text-text-secondary hover:text-text-primary transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to Terminal
        </Link>
        
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-black tracking-widest text-text-secondary uppercase">
            OnlyProfit Live
          </span>
        </div>
      </nav>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-12">
        {/* Header Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold mb-4">
            <BookOpen className="w-3.5 h-3.5" />
            OnlyProfit Financial Academy
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-text-primary mb-4 flex items-center justify-center gap-2">
            OnlyProfit Insights & Blogs
            <Sparkles className="w-8 h-8 text-yellow-500 fill-yellow-500/20" />
          </h1>
          <p className="text-base sm:text-lg text-text-secondary leading-relaxed">
            Expand your financial knowledge with real-world stock valuations, technical analyses, tax regime comparisons, and beginner-friendly guides.
          </p>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col md:flex-row gap-6 items-center justify-between mb-12 bg-card border border-border p-5 rounded-3xl">
          {/* Categories */}
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto py-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all duration-300 whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-emerald-500 border-emerald-500 text-black shadow-lg shadow-emerald-500/10'
                    : 'bg-card-hover border-border text-text-secondary hover:text-text-primary'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <input
              type="text"
              placeholder="Search insights..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-background border border-border focus:border-emerald-500/50 rounded-xl outline-none text-text-primary transition-all placeholder-text-secondary"
            />
          </div>
        </div>

        {/* Blogs Grid */}
        {filteredPosts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPosts.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="group bg-card hover:bg-card-hover border border-border hover:border-emerald-500/30 rounded-3xl p-6 flex flex-col gap-4 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-emerald-500/5 relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-emerald-500/0 to-transparent group-hover:via-emerald-500/40 transition-all duration-500" />
                
                <div className="flex items-center justify-between">
                  <span className={`px-2.5 py-0.5 text-[10px] font-bold tracking-wider rounded-md border ${getCategoryColor(post.category)}`}>
                    {post.category.toUpperCase()}
                  </span>
                  
                  <span className="flex items-center gap-1.5 text-[10px] font-bold text-text-secondary group-hover:text-text-primary transition-colors">
                    <Calendar className="w-3 h-3" />
                    {post.date}
                  </span>
                </div>

                <div>
                  <h3 className="font-black text-base text-text-primary group-hover:text-emerald-400 transition-colors mb-2 line-clamp-2 leading-snug">
                    {post.title}
                  </h3>
                  <p className="text-xs text-text-secondary line-clamp-3 leading-relaxed">
                    {post.description}
                  </p>
                </div>

                <div className="flex items-center justify-between mt-auto pt-4 border-t border-border/40">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-text-secondary">Written by</span>
                    <span className="text-[11px] font-black text-text-primary">{post.author}</span>
                  </div>
                  
                  <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform">
                    Read Post
                    <ArrowUpRight className="w-4 h-4" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-card border border-border rounded-3xl">
            <BookOpen className="w-12 h-12 text-text-secondary/30 mx-auto mb-4" />
            <h3 className="text-lg font-black text-text-primary mb-1">No articles found</h3>
            <p className="text-xs text-text-secondary">Try searching for other terms or categories.</p>
          </div>
        )}
      </div>
    </main>
  );
}
