'use client';

import { Page } from '@/components/PageLayout';
import { ReviewSubmission } from '@/components/ReviewSubmission';
import { TopBar } from '@worldcoin/mini-apps-ui-kit-react';
import Link from 'next/link';

export default function NewReviewPage() {
  return (
     <Page>
          <Page.Header className="p-0">
            <TopBar
              className="text-gray-900 gradient-bg"
              title="Product Details"
              startAdornment={
                <Link href="/home" className="text-gray-900 hover:text-gray-600 transition-colors">
                  ← Back
                </Link>
              }
            />
          </Page.Header>
          
          <Page.Main className="space-y-6 pb-20">
            <ReviewSubmission />
        </Page.Main>
        
    </Page>
  );
}
