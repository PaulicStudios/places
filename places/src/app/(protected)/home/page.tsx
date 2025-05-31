import { auth } from '@/auth';
import { Page } from '@/components/PageLayout';
import { Marble, TopBar, Typography } from '@worldcoin/mini-apps-ui-kit-react';
import { ProductSearch } from '@/components/ProductSearch';

export default async function Home() {
  const session = await auth();

  return (
    <>
      <Page.Header className="p-0 pb-2">
        <TopBar
          className='text-gray-900 gradient-bg'
          title="Reviews"
          endAdornment={
            <div className="flex items-center gap-2">
              <Typography className="font-semibold">
                {session?.user.username}
              </Typography>
              <Marble src={session?.user.profilePictureUrl} className="w-12" />
            </div>
          }
        />
      </Page.Header>
      <Page.Main className="flex flex-col items-center justify-start gap-4 mb-16">
        <ProductSearch />
      </Page.Main>
    </>
  );
}
