import { NextResponse } from 'next/server';
import { BLOG_POSTS } from '@/lib/blogsData';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(BLOG_POSTS);
}
