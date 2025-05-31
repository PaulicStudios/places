import { MiniKit } from '@worldcoin/minikit-js';
import ProductReviewCommitmentsABI from '@/abi/ProductReviewCommitments.json';

declare global {
  interface Window {
    ethereum: any;
  }
}

export interface ReviewSubmission {
  barcode: string;
  reviewer: string;
  rating: number;
  contentHash: string;
  signature: string;
  worldIdNullifierHash: string;
  root: string;
  proof: string[];
  appId: string;
  actionId: string;
}

export async function submitReview(reviewData: ReviewSubmission) {
  try {
    if (!MiniKit.isInstalled()) {
      throw new Error('World App is not installed');
    }

    console.log('Starting transaction...');
    console.log('Contract address:', process.env.NEXT_PUBLIC_REVIEW_CONTRACT_ADDRESS);
    console.log('Review data:', reviewData);

    const { commandPayload, finalPayload } = await MiniKit.commandsAsync.sendTransaction({
      transaction: [
        {
          address: process.env.NEXT_PUBLIC_REVIEW_CONTRACT_ADDRESS as `0x${string}`,
          abi: ProductReviewCommitmentsABI,
          functionName: 'submitReviewCommitment',
          args: [
            reviewData.barcode,
            reviewData.reviewer,
            reviewData.rating,
            reviewData.contentHash,
            reviewData.signature,
            reviewData.worldIdNullifierHash,
            reviewData.root,
            reviewData.proof,
            reviewData.appId,
            reviewData.actionId
          ],
        },
      ],
    });

    console.log('Transaction command payload:', commandPayload);
    console.log('Transaction final payload:', finalPayload);

    if (finalPayload.status === 'error') {
      console.error('Transaction error:', finalPayload.error_code);
      throw new Error(`Transaction failed: ${finalPayload.error_code}`);
    }

    if (!finalPayload.transaction_id) {
      throw new Error('No transaction ID received');
    }

    return {
      success: true,
      transactionId: finalPayload.transaction_id
    };
  } catch (error) {
    console.error('Error submitting review:', error);
    throw error;
  }
}
