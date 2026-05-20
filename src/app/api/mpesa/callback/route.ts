import { NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';

/**
 * STEP 11: HANDLE CALLBACK
 * This endpoint is public and receives the POST from Safaricom.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('M-Pesa Callback Received:', JSON.stringify(body, null, 2));

    const result = body.Body.stkCallback;
    const checkoutRequestId = result.CheckoutRequestID;
    const resultCode = result.ResultCode;

    // STEP 12: UPDATE DATABASE
    if (resultCode === 0) {
      // Payment Successful
      const { firestore } = initializeFirebase();
      
      // Find the sale record associated with this request
      // (Note: In production, you should save checkoutRequestId when initiating)
      const salesRef = collection(firestore, 'sales_transactions');
      const q = query(salesRef, where('referenceCode', '==', checkoutRequestId));
      const snap = await getDocs(q);

      if (!snap.empty) {
          const saleDoc = snap.docs[0];
          await updateDoc(doc(firestore, 'sales_transactions', saleDoc.id), {
              status: 'Paid',
              paymentConfirmedAt: new Date().toISOString(),
              mpesaReceipt: result.CallbackMetadata.Item.find((i: any) => i.Name === 'MpesaReceiptNumber')?.Value
          });
          console.log('Sale payment status updated successfully.');
      }
    }

    return NextResponse.json({ ResultCode: 0, ResultDesc: "Success" });
  } catch (error) {
    console.error('Callback processing failed:', error);
    return NextResponse.json({ ResultCode: 1, ResultDesc: "Failed" }, { status: 500 });
  }
}
