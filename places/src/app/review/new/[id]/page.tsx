'use client';

import { useParams } from 'next/navigation';
import { Page } from '@/components/PageLayout';
import { ReviewSubmission } from '@/components/ReviewSubmission';
import { TopBar } from '@worldcoin/mini-apps-ui-kit-react';
import Link from 'next/link';

export default function NewReviewPage() {
  const params = useParams();
  const productId = params.id as string;

  return (
     <Page>
          <Page.Header className="p-0">
            <TopBar
              className="text-gray-900 gradient-bg"
              title="Write Review"
              startAdornment={
                <Link href="/home" className="text-gray-900 hover:text-gray-600 transition-colors">
                  ← Back
                </Link>
              }
            />
          </Page.Header>
          
          <Page.Main className="space-y-6 pb-20">
            <ReviewSubmission productId={productId} />
        </Page.Main>
        
    </Page>
  );
}
