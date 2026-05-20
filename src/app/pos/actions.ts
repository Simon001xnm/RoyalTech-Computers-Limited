'use server';

import { MPESA_CONFIG } from '@/lib/constants';

/**
 * STEP 7: GENERATE ACCESS TOKEN
 * This runs purely on the server to keep Consumer Key/Secret hidden.
 */
async function getMpesaToken() {
  try {
    const auth = Buffer.from(`${MPESA_CONFIG.CONSUMER_KEY}:${MPESA_CONFIG.CONSUMER_SECRET}`).toString('base64');
    
    const response = await fetch('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
      headers: {
        Authorization: `Basic ${auth}`,
      },
      cache: 'no-store'
    });

    if (!response.ok) {
        throw new Error(`M-Pesa Auth Failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error("Token generation failed:", error);
    throw error;
  }
}

/**
 * STEP 8 & 9: INITIATE STK PUSH
 * Combines password generation and the process request.
 */
export async function initiateStkPush(phoneNumber: string, amount: number) {
  try {
    // Format number to 254XXXXXXXXX (Standard requirement for Safaricom)
    const formattedPhone = phoneNumber.replace(/\D/g, '').replace(/^0/, '254').replace(/^\+/, '');
    
    if (MPESA_CONFIG.CONSUMER_KEY === "YOUR_CONSUMER_KEY") {
        return { success: false, error: "M-Pesa API keys not configured in constants.ts" };
    }

    const token = await getMpesaToken();
    
    // STEP 8: CREATE STK PUSH PASSWORD
    const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
    const password = Buffer.from(`${MPESA_CONFIG.BUSINESS_SHORTCODE}${MPESA_CONFIG.PASSKEY}${timestamp}`).toString('base64');

    // STEP 9: SEND REQUEST TO DARAJA API
    const response = await fetch('https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        BusinessShortCode: MPESA_CONFIG.BUSINESS_SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: Math.round(amount),
        PartyA: formattedPhone,
        PartyB: MPESA_CONFIG.BUSINESS_SHORTCODE,
        PhoneNumber: formattedPhone,
        CallBackURL: MPESA_CONFIG.CALLBACK_URL,
        AccountReference: 'BusinessHubPOS',
        TransactionDesc: 'Workspace Sale',
      }),
    });

    const data = await response.json();

    if (data.ResponseCode === '0') {
      return { 
        success: true, 
        checkoutRequestId: data.CheckoutRequestID,
        customerMessage: data.CustomerMessage 
      };
    } else {
      return { success: false, error: data.errorMessage || 'Failed to initiate STK Push' };
    }
  } catch (error: any) {
    console.error("M-Pesa Push Error:", error);
    return { success: false, error: "Connection to M-Pesa failed. Ensure your server is online." };
  }
}
