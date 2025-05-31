'use client';

import { SearchField } from '@worldcoin/mini-apps-ui-kit-react';
import { ChangeEvent } from 'react';

export const ProductSearch = () => {
  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    console.log('Search changed:', value);
  };

  return (
    <SearchField
      label="Search items..."
      onChange={handleSearchChange}
    />
  );
}