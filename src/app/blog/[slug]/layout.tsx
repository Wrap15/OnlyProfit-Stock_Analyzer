import { Metadata } from 'next';
import { BLOG_POSTS } from '@/lib/blogsData';

interface Props {
  params: {
    slug: string;
  };
  children: React.ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const slug = params.slug;
  const post = BLOG_POSTS.find(p => p.slug === slug);

  if (post) {
    return {
      title: `${post.title} — OnlyProfit Research`,
      description: post.description,
      openGraph: {
        title: post.title,
        description: post.description,
        type: 'article',
        url: `https://onlyprofit.com/blog/${slug}`,
        publishedTime: new Date(post.date).toISOString(),
        authors: [post.author]
      }
    };
  }

  return {
    title: `Market Research Blog - OnlyProfit`,
    description: `Read the latest articles on mutual funds, stock market analysis, SIP strategies, and investment tutorials.`
  };
}

export default function BlogLayout({ children }: Props) {
  return <>{children}</>;
}
