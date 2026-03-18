import classNames from 'classnames';
import React from 'react';

export const Feature = ({
  icon: Icon,
  iconClasses,
  title,
  blobClasses,
  feature,
  children,
  classes
}: {
  icon: React.ElementType;
  iconClasses: string;
  title: string;
  blobClasses: string;
  feature: JSX.Element;
  children: React.ReactNode;
  classes:string;
}): JSX.Element => {
  return (
    <div className={classNames(
        "flex flex-col overflow-hidden rounded-3xl border border-gray-200 bg-white/50 p-6 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-white/5 md:p-10",
        classes // This is your extra variable or prop
      )}> 
      {/* Top Section: Icon, Title, and Description */}
      <div className="mb-8 max-w-2xl">
        <div
          className={classNames(
            'mb-6 flex h-12 w-12 items-center justify-center rounded-xl text-white shadow-lg',
            iconClasses
          )}
        >
          <Icon className="h-6 w-6" />
        </div>
        
        <h3 className="text-2xl font-bold tracking-tight text-gray-900 md:text-3xl dark:text-gray-100">
          {title}
        </h3>
        
        <p className="mt-4 text-lg leading-relaxed text-gray-600 dark:text-gray-300">
          {children}
        </p>
      </div>

      {/* Bottom Section: The "Feature" Image/Component */}
      <div className="relative mt-auto">
        {/* The Glow Effect behind the image */}
        <div
          className={classNames(
            'absolute inset-0 -top-10 transform-gpu rounded-full opacity-[20%] blur-3xl',
            blobClasses
          )}
        />
        
        {/* The actual feature content (image, code, etc.) */}
        <div className="relative z-10 w-full overflow-hidden rounded-xl border border-gray-200/50 dark:border-white/10 shadow-2xl">
          {feature}
        </div>
      </div>
    </div>
  );
};