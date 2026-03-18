import React from 'react';

export const GlowingRing = ({
  children,
}: {
  children: JSX.Element;
}): JSX.Element => (
  <div className="group relative">
    <div className="absolute -inset-1 rounded-[130px] bg-linear-to-r from-yellow-600 to-red-700 opacity-30 blur transition duration-1000 group-hover:opacity-50 dark:-inset-1.5 dark:opacity-50 dark:group-hover:opacity-75" />
    {children}
  </div>
);
