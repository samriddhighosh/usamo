import classNames from 'classnames';
import * as React from 'react';

export default function LogoSquare({
  className,
}: {
  className?: string;
}): JSX.Element {
  return (
    <svg
      className={classNames('inline-block', className)}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 120 120"
    >
      <circle
        className="fill-current text-slate-900 dark:text-slate-200"
        cx="60"
        cy="60"
        r="56"
      />
      <circle
        className="fill-current text-slate-800 dark:text-slate-900"
        cx="60"
        cy="60"
        r="50"
      />
      <text
        x="60"
        y="74"
        textAnchor="middle"
        className="fill-current text-blue-200"
        fontFamily="Georgia, serif"
        fontSize="44"
        fontWeight="700"
      >
        SUM
      </text>
    </svg>
  );
}
