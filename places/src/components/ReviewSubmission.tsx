'use client';

import { useState, useEffect } from 'react';
import { useWaitForTransactionReceipt } from '@worldcoin/minikit-react';
import { createPublicClient, http } from 'viem';
import { worldchain } from 'viem/chains';
import { MiniKit, VerificationLevel } from '@worldcoin/minikit-js';
import { submitReview } from '@/utils/review';
import type { ReviewSubmission } from '@/utils/review';
import { keccak256, encodePacked } from 'viem';
import { StarRating } from './StarRating';
import { Typography, Button, TextArea } from '@worldcoin/mini-apps-ui-kit-react';
import { checkTransactionStatus } from '@/app/actions/checkTransaction';

interface ReviewSubmissionProps {
  productId: string;
}

export function ReviewSubmission({ productId }: ReviewSubmissionProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transactionId, setTransactionId] = useState<string>('');
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [content, setContent] = useState('');
  const [rating, setRating] = useState(5);
  const [error, setError] = useState<string | null>(null);

  const client = createPublicClient({
    chain: worldchain,
    transport: http('https://worldchain-mainnet.g.alchemy.com/public'),
  });

  const { isLoading: isConfirming, isSuccess: isConfirmed, receipt } = useWaitForTransactionReceipt({
    client: client,
    appConfig: {
      app_id: process.env.NEXT_PUBLIC_APP_ID as string,
    },
    transactionId: transactionId,
  });

  // Add polling effect
  useEffect(() => {
    let pollInterval: NodeJS.Timeout;

    const pollTransaction = async () => {
      if (!transactionId || isPolling) return;

      setIsPolling(true);
      let attempts = 0;
      const maxAttempts = 30; // 5 minutes with 10-second intervals

      pollInterval = setInterval(async () => {
        attempts++;
        console.log(`Polling attempt ${attempts} for transaction ${transactionId}`);

        const result = await checkTransactionStatus(transactionId);
        
        if (result.success && result.hash) {
          console.log('Transaction hash received:', result.hash);
          setTransactionHash(result.hash);
          setIsPolling(false);
          clearInterval(pollInterval);
        } else if (attempts >= maxAttempts) {
          console.log('Max polling attempts reached');
          setIsPolling(false);
          clearInterval(pollInterval);
          setError('Transaction status check timed out');
        }
      }, 10000); // Poll every 10 seconds
    };

    if (transactionId) {
      pollTransaction();
    }

    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [transactionId]);

  const handleReviewSubmission = async () => {
    if (!content.trim()) {
      setError('Please enter review content');
      return;
    }

    if (!MiniKit.isInstalled()) {
      setError('World App is not installed');
      return;
    }

    const scaledRating = rating * 2; // Convert to 0-10 scale

    try {
      setIsSubmitting(true);
      setError(null);

      // Step 1: World ID Verification
      console.log('Starting verification...');
      const { finalPayload: verifyPayload } = await MiniKit.commandsAsync.verify({
        action: process.env.NEXT_PUBLIC_ACTION_ID as string,
        verification_level: VerificationLevel.Orb,
        signal: "COREGAME"
      });

      console.log('Verification response:', verifyPayload);

      if (verifyPayload.status === 'error') {
        throw new Error('Verification failed');
      }

      // Step 2: Sign the review content
      console.log('Starting message signing...');
      const { finalPayload: signPayload } = await MiniKit.commandsAsync.signMessage({
        message: content
      });

      console.log('Sign message response:', signPayload);

      if (signPayload.status !== 'success') {
        throw new Error('Failed to sign message');
      }

      // Step 3: Calculate content hash and submit review
      const contentHash = keccak256(encodePacked(
        ['string', 'uint8', 'string'],
        [productId, scaledRating, content]
      ));
      
      console.log('Preparing review data...');
      const reviewData: ReviewSubmission = {
        barcode: productId,
        reviewer: signPayload.address,
        rating: scaledRating,
        contentHash,
        signature: signPayload.signature,
        worldIdNullifierHash: verifyPayload.nullifier_hash,
        root: verifyPayload.merkle_root,
        proof: verifyPayload.proof
      };

      console.log('Submitting review...');
      const result = await submitReview(reviewData);
      console.log('Review submission result:', result);
      setTransactionId(result.transactionId);

      // SaveReviewDB({
      //   product_code: productId,
      //   name: "Anonymous",
      //   description: content,
      //   stars: rating,
      //   transactionId: result.transactionId,
      // });

      // if (!reviewResult.success) {
      //   throw new Error(reviewResult.error || 'Failed to save review');
      // }

    } catch (error) {
      console.error('Failed to submit review:', error);
      setError(error instanceof Error ? error.message : 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      {receipt && (
        <p>{receipt.transactionHash}</p>
      )}
      {isConfirmed ? (
        <div className="flex flex-col items-center justify-center space-y-4 py-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <svg 
              className="w-8 h-8 text-green-600" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M5 13l4 4L19 7" 
              />
            </svg>
          </div>
          <Typography variant="heading" className="text-center text-gray-900">
            Review Submitted Successfully!
          </Typography>
          <Typography className="text-center text-gray-600">
            Thank you for your review. Your contribution helps others make informed decisions.
          </Typography>
          {transactionHash && (
            <a
              href={`https://explorer.worldcoin.org/tx/${transactionHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              View Transaction on Explorer
            </a>
          )}
        </div>
      ) : (
        <>
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

          <div className="flex justify-center">
            <Button
              onClick={handleReviewSubmission}
              variant="primary"
              disabled={isSubmitting || isConfirming || isPolling || !content.trim()}
              className="min-w-[200px]"
            >
              {isSubmitting ? 'Submitting...' : 
               isConfirming ? 'Confirming...' : 
               isPolling ? 'Waiting for confirmation...' : 
               'Submit Review'}
            </Button>
          </div>
          
          {error && (
            <p className="mt-2 text-red-600">
              {error}
            </p>
          )}
        </>
      )}
    </div>
  );
} 
