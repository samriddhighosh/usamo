import React from 'react'

const ContestWidget = () => (
  <div className="bg-zinc-900/50 rounded-2xl p-6 border border-white/10 shadow-2xl animate-in zoom-in-95">
    <div className="text-center">
      <span className="text-5xl font-mono font-black text-white tracking-widest">02:54:12</span>
      <p className="text-xs text-orange-500 font-bold uppercase mt-2 tracking-widest">Time Remaining</p>
    </div>
    <div className="mt-8 grid grid-cols-5 gap-2">
      {[...Array(15)].map((_, i) => (
        <div key={i} className={`h-1 rounded-full ${i < 7 ? 'bg-orange-500' : 'bg-white/10'}`} />
      ))}
    </div>
  </div>
);

export default ContestWidget