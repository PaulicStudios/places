import { auth } from '@/auth';
import { Page } from '@/components/PageLayout';
import { TopBar } from '@worldcoin/mini-apps-ui-kit-react';
import { ProductSearch } from '@/components/ProductSearch';
import { BarcodeScanner } from '@/components/BarcodeScanner';

export default async function Home() {
  const session = await auth();

  return (
    <>
      <Page.Header className="p-0">
        <TopBar
          title="Reviews"
        />
      </Page.Header>
      <Page.Main className="flex flex-col justify-center items-center p-4">
        <div className="w-full max-w-md mb-6">
          <ProductSearch className="w-full" />
        </div>
        <div className="w-full max-w-md">
          <BarcodeScanner className="w-full" />
        </div>
      </Page.Main>
    </>
  );
}
