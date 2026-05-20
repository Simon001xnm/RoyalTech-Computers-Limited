
import { NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';

/**
 * M-Pesa Callback Handler
 * Receives POST requests from Safaricom Daraja API.
 * Handles both Success and Failure codes (e.g., Insufficient Balance).
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('M-Pesa Callback Received:', JSON.stringify(body, null, 2));

    const result = body.Body.stkCallback;
    const checkoutRequestId = result.CheckoutRequestID;
    const resultCode = result.ResultCode;
    const resultDesc = result.ResultDesc;

    const { firestore } = initializeFirebase();
    
    // Find the sale record associated with this request
    const salesRef = collection(firestore, 'sales_transactions');
    const q = query(salesRef, where('referenceCode', '==', checkoutRequestId));
    const snap = await getDocs(q);

    if (!snap.empty) {
        const saleDoc = snap.docs[0];
        const saleRef = doc(firestore, 'sales_transactions', saleDoc.id);

        if (resultCode === 0) {
            // SUCCESS
            await updateDoc(saleRef, {
                status: 'Paid',
                paymentConfirmedAt: new Date().toISOString(),
                mpesaReceipt: result.CallbackMetadata?.Item?.find((i: any) => i.Name === 'MpesaReceiptNumber')?.Value || 'N/A',
                updatedAt: new Date().toISOString()
            });
            console.log(`Sale ${saleDoc.id} paid successfully.`);
        } else {
            // FAILURE (e.g., Code 1: Insufficient Balance, Code 1032: Cancelled)
            await updateDoc(saleRef, {
                status: 'Failed',
                paymentError: resultDesc,
                updatedAt: new Date().toISOString()
            });
            console.warn(`Sale ${saleDoc.id} failed: ${resultDesc}`);
        }
    }

    return NextResponse.json({ ResultCode: 0, ResultDesc: "Success" });
  } catch (error) {
    console.error('Callback processing failed:', error);
    return NextResponse.json({ ResultCode: 1, ResultDesc: "Internal Server Error" }, { status: 500 });
  }
}
