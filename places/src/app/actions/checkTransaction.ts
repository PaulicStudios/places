'use server'

export async function checkTransactionStatus(transactionId: string) {
  try {
    const response = await fetch(
      `https://developer.worldcoin.org/api/v2/minikit/transaction/${transactionId}?app_id=${process.env.NEXT_PUBLIC_APP_ID}&type=transaction`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${process.env.DEV_PORTAL_API_KEY}`,
        },
      }
    );
    
    const data = await response.json();
    console.log('Transaction status data:', data);
    return {
      success: true,
      status: data.transactionStatus,
      hash: data.transactionHash,
      error: null
    };
  } catch (error) {
    console.error('Error checking transaction:', error);
    return {
      success: false,
      status: null,
      hash: null,
      error: error instanceof Error ? error.message : 'Failed to check transaction'
    };
  }
}
