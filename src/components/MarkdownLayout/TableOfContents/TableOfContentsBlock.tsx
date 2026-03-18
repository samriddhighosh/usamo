import * as React from 'react';
import { TOCHeading } from '../../../models/module';
import genLinksFromTOCHeadings from './genLinksFromTOCHeadings';

const TableOfContentsBlock = ({
  tableOfContents,
}: {
  tableOfContents: TOCHeading[];
}) => {
  const links = genLinksFromTOCHeadings(
    tableOfContents,
    _ =>
      'block mb-2 transition text-gray-600 dark:text-dark-med-emphasis hover:underline hover:text-blue-600 dark:hover:text-dark-high-emphasis'
  );
  return (
    <div>
      {tableOfContents.length > 1 && (
        <>
          <h2 className="dark:text-dark-high-emphasis mt-8 mb-3 font-bold tracking-wider text-gray-500 uppercase">
            Table of Contents
          </h2>
          {links}
        </>
      )}
      <hr className="my-6 dark:border-gray-700" />

    </div>
  );
};

export default TableOfContentsBlock;
