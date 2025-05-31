'use client';

import { TabItem, Tabs } from '@worldcoin/mini-apps-ui-kit-react';
import { Home, ScanBarcode } from 'iconoir-react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export const Navigation = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [value, setValue] = useState('home');

  useEffect(() => {
    console.log('Current pathname:', pathname); // Debug log
    if (pathname === '/home' || pathname === '/') {
      setValue('home');
    } else if (pathname === '/scanner' || pathname === '/home/scanner') {
      setValue('scanner');
    } else if (pathname.includes('reviews')) {
      setValue('reviews');
    }
  }, [pathname]);

  const handleTabChange = (newValue: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Tab changed to:', newValue); // Debug log
    }
    setValue(newValue);
    
    switch (newValue) {
      case 'home':
        router.push('/home');
        break;
      case 'scanner':
        router.push('/home/scanner'); // Use the protected route
        break;
      case 'reviews':
        console.log('Reviews page not implemented yet');
        break;
    }
  };

  return (
    <Tabs value={value} onValueChange={handleTabChange} className='mt-2'>
      <TabItem value="home" icon={<Home />} label="Home" />
      <TabItem value="scanner" icon={<ScanBarcode />} label="Scanner" />
      {/* <TabItem value="reviews" icon={<List />} label="Your Reviews" /> */}
    </Tabs>
  );
};
