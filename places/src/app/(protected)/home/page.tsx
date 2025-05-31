import { auth } from '@/auth';
import { Page } from '@/components/PageLayout';
import { Marble, TopBar } from '@worldcoin/mini-apps-ui-kit-react';
import { ProductSearch } from '@/components/ProductSearch';
import Link from 'next/link';

export default async function Home() {
  const session = await auth();

  return (
    <>
      <Page.Header className="p-0">
        <TopBar
          className='text-gray-900 gradient-bg'
          title="Reviews"
          endAdornment={
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold">
                {session?.user.username}
              </p>
              <Marble src={session?.user.profilePictureUrl} className="w-12" />
            </div>
          }
        />
      </Page.Header>
      <Page.Main className="flex flex-col items-center justify-start gap-4 mb-16">
        <ProductSearch />
        <Link href="/home/product-demo" className="text-blue-500 hover:underline"> Product Test</Link>
        <Link href="/star-demo" className="text-blue-500 hover:underline">Star Test</Link>
        <Link href="/home/scanner" className="text-blue-500 hover:underline">Scanner Test</Link>
      </Page.Main>
    </>
  );
}
