import * as React from 'react';
import { useMemo } from 'react';
import { useActiveHash } from '../../../hooks/useActiveHash';
import { TOCHeading } from '../../../models/module';
import genLinksFromTOCHeadings from './genLinksFromTOCHeadings';

const TableOfContentsSidebar = ({
  tableOfContents,
}: {
  tableOfContents: TOCHeading[];
}) => {
  const hashes = useMemo(
    () => tableOfContents.map(heading => heading.slug),
    [tableOfContents]
  );
  const activeHash = useActiveHash(hashes, '10px 0px 0px 0px');

  const getLinkStyles = heading =>
    'block mb-1 text-sm transition ' +
    (activeHash === heading.slug
      ? 'underline text-blue-600 dark:text-dark-high-emphasis'
      : 'text-gray-600 hover:underline hover:text-blue-600 dark:text-dark-med-emphasis');
  const links = genLinksFromTOCHeadings(tableOfContents, getLinkStyles);

  return (
    <div className="sticky" style={{ top: '2.5rem' }}>
      <h2 className="dark:text-dark-med-emphasis mb-4 text-sm font-bold tracking-wider text-gray-500 uppercase">
        Table of Contents
      </h2>
      {links}

    </div>
  );
};

export default TableOfContentsSidebar;
