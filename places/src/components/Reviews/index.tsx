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

    // Get transaction details
    const transaction = await client.getTransaction({
      hash: submission.transactionId as `0x${string}`,
    });

    // Verify the transaction was sent to our contract
    const contractAddress = process.env.NEXT_PUBLIC_REVIEW_CONTRACT_ADDRESS;
    if (transaction.to?.toLowerCase() !== contractAddress?.toLowerCase()) {
      throw new Error('Transaction was not sent to the correct contract');
    }

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
      [submission.product_code, submission.stars, submission.description]
    ));

    if (!decodedEvent.args || decodedEvent.args[3] !== expectedContentHash) {
      throw new Error('Content hash mismatch');
    }

    // Verify the rating matches
    if (decodedEvent.args[2] !== submission.stars) {
      throw new Error('Rating mismatch');
    }

    // Verify the barcode matches
    if (decodedEvent.args[0] !== submission.product_code) {
      throw new Error('Product code mismatch');
    }

    // If all verifications pass, save the review
    const reviewData: ReviewSubmissionDB = {
      product_code: submission.product_code,
      name: submission.name,
      description: submission.description,
      stars: submission.stars,
      transactionId: submission.transactionId
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
