import React from 'react';
import { BlindModeProvider } from '../context/BlindModeContext';
import { useAnalyticsEffect } from '../hooks/useAnalyticsEffect';
import { useUpdateStreakEffect } from '../hooks/useUpdateStreakEffect';
import { ThemeProvider } from './ThemeProvider';

interface LayoutProps {
  children?: React.ReactNode;
  /**
   * If specified, in addition to updating number of pageviews,
   * we will also update lastViewedModule
   */
  setLastViewedModule?: string;
}

const Layout = ({ children, setLastViewedModule }: LayoutProps): JSX.Element => {
  useAnalyticsEffect();
  useUpdateStreakEffect({ setLastViewedModule });

  return (
    <ThemeProvider 
      attribute="class" 
      defaultTheme="dark" 
      enableSystem={false}
      forcedTheme="dark" // Forces dark mode regardless of user preference
    >
      <BlindModeProvider>
        {/* We add 'dark' to the className as a fallback and bg-black to see the change */}
        <div className="dark min-h-screen bg-slate-950 text-white font-sans" style={{ colorScheme: 'dark' }}>
          {children}
        </div>
      </BlindModeProvider>
    </ThemeProvider>
  );
};

export default Layout;