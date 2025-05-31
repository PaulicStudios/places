import { MiniKit } from '@worldcoin/minikit-js';
import ProductReviewCommitmentsABI from '@/abi/ProductReviewCommitments.json';
import { decodeAbiParameters, parseAbiParameters } from 'viem';

export interface ReviewSubmission {
  barcode: string;
  reviewer: string;
  rating: number;
  contentHash: string;
  signature: string;
  worldIdNullifierHash: string;
  root: string;
  proof: string;
}

export async function submitReview(reviewData: ReviewSubmission) {
  try {
    if (!MiniKit.isInstalled()) {
      throw new Error('World App is not installed');
    }

    console.log('Starting transaction...');
    const contractAddress = process.env.NEXT_PUBLIC_REVIEW_CONTRACT_ADDRESS;
    if (!contractAddress) {
      throw new Error('Contract address not configured');
    }
    console.log('Contract address:', contractAddress);
    console.log('Review data:', reviewData);

    // Validate required fields
    if (!reviewData.proof || !reviewData.root || !reviewData.worldIdNullifierHash) {
      throw new Error('Missing required proof data');
    }

    // Ensure proof is properly formatted
    let proofArray;
    try {
      // First try to parse the proof as a hex string
      if (!reviewData.proof.startsWith('0x')) {
        throw new Error('Proof must be a hex string starting with 0x');
      }

      proofArray = decodeAbiParameters(
        parseAbiParameters('uint256[8]'),
        reviewData.proof as `0x${string}`
      )[0];

      console.log('Decoded proof array:', proofArray);
    } catch (error) {
      console.error('Error decoding proof:', error);
      throw new Error(`Failed to decode proof data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Convert all numeric values to BigInt
    const worldIdNullifierHash = BigInt(reviewData.worldIdNullifierHash);
    const root = BigInt(reviewData.root);

    const transactionData = {
      address: process.env.NEXT_PUBLIC_REVIEW_CONTRACT_ADDRESS as `0x${string}`,
      abi: ProductReviewCommitmentsABI,
      functionName: 'submitReviewCommitment',
      args: [
        reviewData.barcode,
        reviewData.reviewer as `0x${string}`,
        reviewData.rating,
        reviewData.contentHash,
        reviewData.signature,
        worldIdNullifierHash,
        root,
        proofArray
      ],
    };

    try {
      const { commandPayload, finalPayload } = await MiniKit.commandsAsync.sendTransaction({
        transaction: [transactionData],
      });

      console.log('Transaction command payload:', commandPayload);
      console.log('Transaction final payload:', finalPayload);

      if (finalPayload.status === 'error') {
        const errorDetails = finalPayload.details ? JSON.stringify(finalPayload.details) : 'No details provided';
        console.error('Transaction error details:', errorDetails);
        
        throw new Error(`Transaction failed: ${finalPayload.error_code} - ${errorDetails}`);
      }

      if (!finalPayload.transaction_id) {
        throw new Error('No transaction ID received');
      }

      return {
        success: true,
        transactionId: finalPayload.transaction_id
      };
    } catch (error) {
      if (error instanceof Error && error.message.includes('user_rejected')) {
        throw new Error('Transaction was rejected. Please try again and make sure to approve the transaction in the World App.');
      }
      throw error;
    }
  } catch (error) {
    console.error('Error submitting review:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to submit review: ${error.message}`);
    }
    throw error;
  }
}
