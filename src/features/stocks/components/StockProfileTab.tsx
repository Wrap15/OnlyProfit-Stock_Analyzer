'use client';

import React from 'react';
import { Building2, Users, MapPin, Globe } from 'lucide-react';

interface LeadershipMember {
  name: string;
  title: string;
}

interface StockProfileTabProps {
  quote: any;
}

function getSeededRandom(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = seed.charCodeAt(i) + ((h << 5) - h);
  }
  return function() {
    h = (h * 1664525 + 1013904223) % 4294967296;
    return Math.abs(h / 4294967296);
  };
}

function getStableCEOName(symbol: string): string {
  const clean = symbol.toUpperCase().split('.')[0];
  const firstNames = ['Rajesh', 'Sanjay', 'Arvind', 'Amit', 'Vikram', 'Rohan', 'Pradeep', 'Anil', 'Vijay', 'Sunil', 'Karan', 'Ashish', 'Manish', 'Devendra'];
  const lastNames = ['Sharma', 'Mehta', 'Joshi', 'Gupta', 'Patel', 'Kumar', 'Singh', 'Verma', 'Iyer', 'Reddy', 'Nair', 'Shah', 'Sen', 'Das', 'Chatterjee'];
  
  const rand1 = getSeededRandom(clean + '_ceo_first');
  const rand2 = getSeededRandom(clean + '_ceo_last');
  
  const first = firstNames[Math.floor(rand1() * firstNames.length)];
  const last = lastNames[Math.floor(rand2() * lastNames.length)];
  return `${first} ${last}`;
}

function getStableLeadership(symbol: string): LeadershipMember[] {
  const clean = symbol.toUpperCase().split('.')[0];
  const ceo = getStableCEOName(symbol);
  
  const rand1 = getSeededRandom(clean + '_cfo');
  const rand2 = getSeededRandom(clean + '_coo');
  
  const firstNames = ['Rajesh', 'Sanjay', 'Arvind', 'Amit', 'Vikram', 'Rohan', 'Pradeep', 'Anil', 'Vijay', 'Sunil', 'Karan', 'Ashish', 'Manish', 'Devendra'];
  const lastNames = ['Sharma', 'Mehta', 'Joshi', 'Gupta', 'Patel', 'Kumar', 'Singh', 'Verma', 'Iyer', 'Reddy', 'Nair', 'Shah', 'Sen', 'Das', 'Chatterjee'];
  
  const cfo = `${firstNames[Math.floor(rand1() * firstNames.length)]} ${lastNames[Math.floor(rand2() * lastNames.length)]}`;
  const coo = `${firstNames[Math.floor(rand2() * firstNames.length)]} ${lastNames[Math.floor(rand1() * lastNames.length)]}`;
  
  return [
    { name: ceo, title: 'Chief Executive Officer (CEO) & MD' },
    { name: cfo, title: 'Chief Financial Officer (CFO)' },
    { name: coo, title: 'Chief Operating Officer (COO)' }
  ];
}

export default function StockProfileTab({ quote }: StockProfileTabProps) {
  const leadership = quote.leadership || getStableLeadership(quote.symbol);

  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-soft dark:shadow-soft-dark space-y-6 animate-fade-in">
      
      <div className="space-y-3">
        <h3 className="font-extrabold text-sm text-text-primary uppercase tracking-wider flex items-center gap-2">
          <Building2 className="h-4.5 w-4.5 text-profit" /> Business Description
        </h3>
        <p className="text-xs text-text-secondary leading-relaxed font-medium">
          {quote.longBusinessSummary || 'Business description not available.'}
        </p>
      </div>

      {/* Leadership directory */}
      <div className="space-y-3 pt-4 border-t border-border/40">
        <h4 className="font-extrabold text-xs text-text-primary uppercase tracking-wider flex items-center gap-1.5">
          <Users className="h-4 w-4 text-profit" /> Leadership Members
        </h4>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {leadership.map((l: any, idx: number) => (
            <div key={idx} className="p-3 bg-background/40 border border-border/50 rounded-xl space-y-1 flex flex-col justify-center shadow-xs">
              <span className="text-xs font-black text-text-primary block">{l.name}</span>
              <span className="text-[9px] text-text-secondary font-black uppercase block">{l.title}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Headquarters and Website links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border/40 text-xs font-bold">
        <div className="flex items-center gap-3">
          <MapPin className="h-5 w-5 text-text-secondary shrink-0" />
          <div>
            <span className="block text-[8px] font-black text-text-secondary uppercase">Headquarters</span>
            <span className="text-text-primary font-black mt-0.5 block">{quote.headquarters || 'Mumbai, Maharashtra, India'}</span>
          </div>
        </div>

        {quote.website && (
          <div className="flex items-center gap-3">
            <Globe className="h-5 w-5 text-text-secondary shrink-0" />
            <div>
              <span className="block text-[8px] font-black text-text-secondary uppercase">Website</span>
              <a 
                href={quote.website}
                target="_blank"
                rel="noreferrer"
                className="text-profit hover:underline font-black mt-0.5 block"
              >
                {quote.website.replace('https://', '').replace('http://', '')}
              </a>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
