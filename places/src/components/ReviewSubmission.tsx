'use client';

import { useState } from 'react';
import { useWaitForTransactionReceipt } from '@worldcoin/minikit-react';
import { createPublicClient, http } from 'viem';
import { worldchain } from 'viem/chains';
import { MiniKit, VerificationLevel, ISuccessResult } from '@worldcoin/minikit-js';
import { submitReview } from '@/utils/review';
import type { ReviewSubmission } from '@/utils/review';
import { keccak256, encodePacked } from 'viem';
import { StarRating } from './StarRating';
import { Typography, Button, TextArea } from '@worldcoin/mini-apps-ui-kit-react';

interface ReviewSubmissionProps {
  productId: string;
}

export function ReviewSubmission({ productId }: ReviewSubmissionProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transactionId, setTransactionId] = useState<string>('');
  const [verificationData, setVerificationData] = useState<ISuccessResult | null>(null);
  const [content, setContent] = useState('');
  const [rating, setRating] = useState(5);
  const [error, setError] = useState<string | null>(null);

  const client = createPublicClient({
    chain: worldchain,
    transport: http('https://worldchain-mainnet.g.alchemy.com/public'),
  });

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    client: client,
    appConfig: {
      app_id: process.env.NEXT_PUBLIC_APP_ID as string,
    },
    transactionId: transactionId,
  });

  const handleVerify = async () => {
    if (!MiniKit.isInstalled()) {
      setError('World App is not installed');
      return;
    }

    try {
      console.log('Starting verification...');
      const { finalPayload } = await MiniKit.commandsAsync.verify({
        action: process.env.NEXT_PUBLIC_ACTION_ID as string,
        verification_level: VerificationLevel.Orb,
        signal: "COREGAME"
      });

      console.log('Verification response:', finalPayload);

      if (finalPayload.status === 'error') {
        throw new Error('Verification failed');
      }

      setVerificationData(finalPayload as ISuccessResult);
      // const response = await fetch('/api/verify-proof', {
      //   method: 'POST',
      //   body: JSON.stringify({
      //     payload: finalPayload,
      //     action: process.env.NEXT_PUBLIC_ACTION_ID as string,
      //     signal: "COREGAME"
      //   }),
      // });

      // const data = await response.json();
      // console.log('Verify response:', data);

      setError(null);
    } catch (error) {
      console.error('Verification error:', error);
      setError(error instanceof Error ? error.message : 'Verification failed');
    }
  };

  const handleSubmitReview = async () => {
    if (!verificationData) {
      setError('Please verify with World ID first');
      return;
    }

    if (!content.trim()) {
      setError('Please enter review content');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      console.log('Starting message signing...');
      // Sign the review content
      const { finalPayload: signPayload } = await MiniKit.commandsAsync.signMessage({
        message: content
      });

      console.log('Sign message response:', signPayload);

      if (signPayload.status !== 'success') {
        throw new Error('Failed to sign message');
      }

      // Calculate content hash
      const contentHash = keccak256(encodePacked(
        ['string', 'uint8'],
        [content, rating]
      ));
      
      console.log('Preparing review data...');
      const reviewData: ReviewSubmission = {
        barcode: productId, // Use the actual product ID
        reviewer: signPayload.address,
        rating,
        contentHash,
        signature: signPayload.signature,
        worldIdNullifierHash: verificationData.nullifier_hash,
        root: verificationData.merkle_root,
        proof: verificationData.proof
      };

      console.log('Submitting review...');
      const result = await submitReview(reviewData);
      console.log('Review submission result:', result);
      
      setTransactionId(result.transactionId);
    } catch (error) {
      console.error('Failed to submit review:', error);
      setError(error instanceof Error ? error.message : 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="space-y-2">
        <StarRating
          value={rating}
          onChange={(value) => setRating(value)}
          allowHalf={true}
          sliderMode={true}
          interactive={true}
          className="flex space-x-1"
        />
      </div>

      <div className="space-y-2">
        <Typography className="font-medium text-gray-600">Text</Typography>
        <TextArea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
        />
      </div>

      <Button
        onClick={handleVerify}
        variant="primary"
      >
        Verify with World ID
      </Button>

      {verificationData && (
        <Button
          onClick={handleSubmitReview}
          disabled={isSubmitting || isConfirming || !content.trim()}
        >
          {isSubmitting ? 'Submitting...' : 
           isConfirming ? 'Confirming...' : 
           isConfirmed ? 'Review Submitted!' : 
           'Submit Review'}
        </Button>
      )}
      
      {error && (
        <p className="mt-2 text-red-600">
          {error}
        </p>
      )}
      
      {isConfirmed && (
        <p className="mt-2 text-green-600">
          Review successfully submitted and confirmed!
        </p>
      )}
    </div>
  );
} 