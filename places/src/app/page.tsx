import { Page } from '@/components/PageLayout';
import TestScannerPage from './test-scanner/page';

export default function Home() { 
  return (
    <Page>
      <Page.Main className="flex flex-col items-center justify-center">
        <TestScannerPage />
      </Page.Main>
    </Page>
  );
}
