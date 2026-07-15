import { Metadata } from 'next';
import { MUTUAL_FUNDS } from '@/lib/mutualfunds';
import { REAL_MF_DATA } from '@/lib/mutualfundsData';

interface Props {
  params: {
    code: string;
  };
  children: React.ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const code = params.code;
  const fund = MUTUAL_FUNDS.find(f => f.code === code);
  
  if (fund) {
    const realData = REAL_MF_DATA[code];
    const category = fund.categoryLabel;
    const rating = realData ? `${realData.rating} Star` : 'Top Rated';
    
    const title = `${fund.name} Direct Plan NAV & Returns`;
    const description = `Analyze ${fund.name} NAV trajectory, historical 1Y/3Y returns, asset allocation weights, and ${rating} category ratings.`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: 'website',
        url: `https://onlyprofit.com/mutualfund/${code}`
      }
    };
  }

  return {
    title: `Mutual Fund Details - OnlyProfit`,
    description: `Track live mutual fund NAV price movements, returns comparison table, and expense ratio metrics.`
  };
}

export default function MutualFundLayout({ children }: Props) {
  return <>{children}</>;
}
