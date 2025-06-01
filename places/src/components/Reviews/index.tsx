"use server";

import { saveReview } from "@/lib/db";
import { createPublicClient, decodeEventLog, http } from 'viem';
import { worldchain } from 'viem/chains';
import { keccak256, encodePacked } from 'viem';
import ProductReviewCommitmentsABI from '@/abi/ProductReviewCommitments.json';

export interface ReviewSubmissionDB {
  product_code: string;
  name: string;
  description: string;
  stars: number;
  transactionId: string;
  reviewer: string;
}

interface ReviewEvent {
  eventName: string;
  args: {
    barcode: string;
    reviewer: string;
    rating: number;
    contentHash: string;
    worldIdNullifierHash: bigint;
  };
}

export default async function SaveReviewDB(
  submission: ReviewSubmissionDB
) {
  if (!submission.description || submission.description.trim().length === 0) {
    submission.description = "No description was provided!";
  }

  if (submission.stars < 0 || submission.stars > 5) {
    if (submission.stars < 0)
      submission.stars = 0;
    if (submission.stars > 5)
      submission.stars = 5;
  }

  try {
    // Create Viem client
    const client = createPublicClient({
      chain: worldchain,
      transport: http('https://worldchain-mainnet.g.alchemy.com/public'),
    });

    // Get transaction receipt
    const receipt = await client.getTransactionReceipt({
      hash: submission.transactionId as `0x${string}`,
    });

    if (!receipt) {
      throw new Error('Transaction not found');
    }

    if (receipt.status !== 'success') {
      throw new Error('Transaction failed');
    }

    const contractAddress = process.env.NEXT_PUBLIC_REVIEW_CONTRACT_ADDRESS;

    // Get the contract instance
    const contract = {
      address: contractAddress as `0x${string}`,
      abi: ProductReviewCommitmentsABI,
    };

    // Get the ReviewCommitmentSubmitted event
    const reviewEvent = receipt.logs.find(log => 
      log.topics[0] === keccak256(encodePacked(
        ['string'],
        ['ReviewCommitmentSubmitted(string,address,uint8,bytes32,uint256)']
      ))
    );

    if (!reviewEvent) {
      throw new Error('Review commitment event not found');
    }

    // Decode the event data
    const decodedEvent = decodeEventLog({
      abi: contract.abi,
      data: reviewEvent.data,
      topics: reviewEvent.topics,
    });

    // Verify the content hash matches
    const expectedContentHash = keccak256(encodePacked(
      ['string', 'uint8', 'string'],
      [submission.product_code, submission.stars * 2, submission.description]
    ));

    console.log('Expected content hash:', expectedContentHash);
    console.log('Decoded event:', decodedEvent);
    
    const event = decodedEvent as unknown as ReviewEvent;
    
    // Verify the event name
    if (event.eventName !== 'ReviewCommitmentSubmitted') {
      throw new Error('Invalid event type');
    }

    // Verify the content hash matches
    if (event.args.contentHash !== expectedContentHash) {
      throw new Error('Content hash mismatch');
    }

    // Verify the rating matches
    if (event.args.rating !== submission.stars * 2) {
      throw new Error('Rating mismatch');
    }

    // Verify the barcode matches
    console.log('Event barcode:', event.args.barcode);
    console.log('Submission product code:', submission.product_code);
    
    // Hash the product code to match the event's barcode format
    const expectedBarcode = keccak256(encodePacked(
      ['string'],
      [submission.product_code]
    ));
    console.log('Expected barcode hash:', expectedBarcode);
    
    if (event.args.barcode !== expectedBarcode) {
      throw new Error('Product code mismatch');
    }

    // If all verifications pass, save the review
    const reviewData: ReviewSubmissionDB = {
      product_code: submission.product_code,
      name: submission.name,
      description: submission.description,
      stars: submission.stars,
      transactionId: submission.transactionId,
      reviewer: submission.reviewer
    };

    await saveReview(reviewData);
    return { 
      success: true,
      transactionId: submission.transactionId,
      blockNumber: receipt.blockNumber
    };
  } catch (err) {
    console.error(`Error in reviewSubmit: ${err}`);
    return { 
      error: err instanceof Error ? err.message : "Failed to save review",
      success: false 
    };
  }
}
