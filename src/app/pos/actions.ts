'use server';

import { MPESA_CONFIG } from '@/lib/constants';

/**
 * Generates an M-Pesa Auth Token using Consumer Key and Secret.
 */
async function getMpesaToken() {
  const auth = Buffer.from(`${MPESA_CONFIG.CONSUMER_KEY}:${MPESA_CONFIG.CONSUMER_SECRET}`).toString('base64');
  
  const response = await fetch('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
    headers: {
      Authorization: `Basic ${auth}`,
    },
  });

  const data = await response.json();
  return data.access_token;
}

/**
 * Initiates an M-Pesa STK Push (Lipa na M-Pesa Online).
 */
export async function initiateStkPush(phoneNumber: string, amount: number) {
  try {
    // 1. Format Phone Number (Remove leading 0 or +, ensure 254...)
    const formattedPhone = phoneNumber.replace(/\D/g, '').replace(/^0/, '254').replace(/^\+/, '');
    
    // 2. Get Access Token
    // Note: In production, you would check if keys are configured
    if (MPESA_CONFIG.CONSUMER_KEY === "YOUR_CONSUMER_KEY") {
        return { success: false, error: "M-Pesa API keys not configured. Please update src/lib/constants.ts" };
    }

    const token = await getMpesaToken();

    // 3. Generate Timestamp and Password
    const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
    const password = Buffer.from(`${MPESA_CONFIG.BUSINESS_SHORTCODE}${MPESA_CONFIG.PASSKEY}${timestamp}`).toString('base64');

    // 4. Send Request to Daraja
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
        AccountReference: 'RoyalTechPOS',
        TransactionDesc: 'Laptop/Accessory Purchase',
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
    return { success: false, error: "Connection to M-Pesa failed." };
  }
}
