import * as React from 'react';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';

// A simple hook for the "Bouncy" number animation
function CountUp({ end, duration = 2000, suffix = "" }: { end: number, duration?: number, suffix?: string }) {
  const [count, setCount] = useState(0);
  const startTime = useRef<number | null>(null);

  useEffect(() => {
    if (end <= 0) return;
    
    const animate = (timestamp: number) => {
      if (!startTime.current) startTime.current = timestamp;
      const progress = Math.min((timestamp - startTime.current) / duration, 1);
      
      // Easing function: easeOutExpo for that snappy SaaS feel
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      
      setCount(Math.floor(easeProgress * end));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [end, duration]);

  return <span>{count}{suffix}</span>;
}

export default function TrustedBy() {
  const [stats, setStats] = useState({ users: 0, views: 0, stars: 0, loaded: false });

  useEffect(() => {
    const loadStats = async () => {
      try {
        const { data } = await supabase.rpc('get_public_site_stats');
        const githubResp = await fetch('https://api.github.com/repos/cpinitiative/usamo-guide');
        const githubData = await githubResp.json();

        if (data) {
          setStats({
            users: Number(data.num_users ?? 0),
            views: Number(data.pageviews ?? 0),
            stars: githubData.stargazers_count ?? 0,
            loaded: true
          });
        }
      } catch (e) {
        console.error("Failed to load stats", e);
      }
    };

    void loadStats();
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-4">
      <dl className="grid grid-cols-1 gap-y-8 sm:grid-cols-3 sm:gap-x-12">
        {/* Users Stat */}
        <div className="flex flex-col items-center">
          <dd className="order-1 text-5xl md:text-6xl font-black tracking-tighter text-[#964934]">
            {stats.loaded ? (
              <CountUp end={Math.floor(stats.users / 1000)} suffix="k+" />
            ) : (
              <span className="opacity-0">0k+</span>
            )}
          </dd>
          <dt className="order-2 mt-2 text-sm font-bold uppercase tracking-widest text-[#7c2d12]/60">
            Registered Users
          </dt>
        </div>

        {/* Pageviews Stat */}
        <div className="flex flex-col items-center">
          <dd className="order-1 text-5xl md:text-6xl font-black tracking-tighter text-[#964934]">
            {stats.loaded ? (
              <CountUp end={parseFloat((stats.views / 1000000).toFixed(1))} suffix="M" />
            ) : (
              <span className="opacity-0">0M</span>
            )}
          </dd>
          <dt className="order-2 mt-2 text-sm font-bold uppercase tracking-widest text-[#7c2d12]/60">
            Global Pageviews
          </dt>
        </div>

        {/* Stars Stat */}
        <div className="flex flex-col items-center">
          <dd className="order-1 text-5xl md:text-6xl font-black tracking-tighter text-[#964934]">
            {stats.loaded ? (
              <CountUp end={stats.stars} />
            ) : (
              <span className="opacity-0">0</span>
            )}
          </dd>
          <dt className="order-2 mt-2 text-sm font-bold uppercase tracking-widest text-[#7c2d12]/60">
            GitHub Stars
          </dt>
        </div>
      </dl>
    </div>
  );
}