'use server';

import { MPESA_CONFIG } from '@/lib/constants';

/**
 * @fileOverview M-Pesa Server Actions
 * Handles the secure bridge to Daraja API.
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
        const errorText = await response.text();
        throw new Error(`M-Pesa Auth Failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.access_token;
  } catch (error: any) {
    console.error("Token generation failed:", error);
    throw new Error(error.message || "Failed to authenticate with Safaricom.");
  }
}

export async function initiateStkPush(phoneNumber: string, amount: number) {
  try {
    // 1. Format number to 254XXXXXXXXX
    const formattedPhone = phoneNumber.replace(/\D/g, '').replace(/^0/, '254').replace(/^\+/, '');
    
    if (MPESA_CONFIG.CONSUMER_KEY === "YOUR_CONSUMER_KEY") {
        return { success: false, error: "Configuration Error: M-Pesa API keys are missing in constants.ts." };
    }

    // 2. Get Access Token
    const token = await getMpesaToken();
    
    // 3. Generate Password
    const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
    const password = Buffer.from(`${MPESA_CONFIG.BUSINESS_SHORTCODE}${MPESA_CONFIG.PASSKEY}${timestamp}`).toString('base64');

    // 4. Send STK Push Request
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
        AccountReference: 'ERP_SUITE',
        TransactionDesc: 'POS Payment',
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
      return { success: false, error: data.errorMessage || data.ResponseDescription || 'Safaricom rejected the request.' };
    }
  } catch (error: any) {
    console.error("STK Push Exception:", error);
    return { success: false, error: error.message || "Connection to M-Pesa gateway failed." };
  }
}
