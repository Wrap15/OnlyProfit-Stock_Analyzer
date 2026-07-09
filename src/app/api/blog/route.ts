import { NextResponse } from 'next/server';
import { BLOG_POSTS } from '@/lib/blogsData';

export async function GET() {
  return NextResponse.json(BLOG_POSTS);
}

export const dynamic = 'force-dynamic';
