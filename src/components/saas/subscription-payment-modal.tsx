
'use client';

import { useState } from 'react';
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogDescription 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShieldAlert, Zap, Loader2, Smartphone, CreditCard, CheckCircle2, Lock } from 'lucide-react';
import { PRICING } from '@/lib/constants';
import { initiateStkPush } from '@/app/pos/actions';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface SubscriptionPaymentModalProps {
  open: boolean;
  onClose: () => void;
  shopName: string;
}

/**
 * @fileOverview Mandatory Subscription Payment Gateway
 * Displays the KES 25,000 + 15,000 requirement.
 */
export function SubscriptionPaymentModal({ open, onClose, shopName }: SubscriptionPaymentModalProps) {
  const [method, setMethod] = useState<'mpesa' | 'paypal'>('mpesa');
  const [phone, setPhone] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const totalPayable = PRICING.ONE_TIME_SETUP + PRICING.ANNUAL_SUBSCRIPTION;

  const handleMpesaPay = async () => {
    if (!phone || phone.length < 10) {
        toast({ variant: 'destructive', title: "Valid Phone Required" });
        return;
    }
    setIsProcessing(true);
    try {
        const res = await initiateStkPush(phone, totalPayable);
        if (res.success) {
            toast({ title: "Payment Initiated", description: "Please check your phone to enter M-Pesa PIN." });
        } else {
            toast({ variant: 'destructive', title: "M-Pesa Failed", description: res.error });
        }
    } finally {
        setIsProcessing(false);
    }
  };

  const handlePaypalPay = () => {
    window.open(PRICING.PAYPAL_LINK, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) return; /* Prevent closing if trial expired */ }}>
      <DialogContent className="sm:max-w-xl p-0 overflow-hidden border-none shadow-2xl rounded-[2rem] no-print">
        <div className="bg-destructive/10 p-8 text-center border-b border-destructive/20 relative overflow-hidden">
             <div className="absolute top-0 right-0 opacity-5 -mr-10 -mt-10">
                 <ShieldAlert className="h-40 w-40 text-destructive" />
             </div>
             <div className="bg-white p-4 rounded-full w-fit mx-auto mb-6 shadow-xl ring-4 ring-destructive/10">
                <Lock className="h-10 w-10 text-destructive" />
             </div>
             <DialogTitle className="text-3xl font-black uppercase tracking-tighter text-destructive">Trial Period Expired</DialogTitle>
             <DialogDescription className="font-bold text-[11px] uppercase tracking-[0.2em] mt-2 text-destructive/60">
                 Workspace Identity: {shopName}
             </DialogDescription>
        </div>

        <div className="p-8 space-y-8">
            <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-muted/30 rounded-2xl border">
                    <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase text-muted-foreground">Engineering & Setup</p>
                        <p className="font-bold text-sm uppercase">One-Time Deployment Fee</p>
                    </div>
                    <p className="font-black text-lg">KES {PRICING.ONE_TIME_SETUP.toLocaleString()}</p>
                </div>
                <div className="flex justify-between items-center p-4 bg-muted/30 rounded-2xl border">
                    <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase text-muted-foreground">Annual License</p>
                        <p className="font-bold text-sm uppercase">Cloud Service & Updates</p>
                    </div>
                    <p className="font-black text-lg">KES {PRICING.ANNUAL_SUBSCRIPTION.toLocaleString()}</p>
                </div>
                <div className="pt-4 border-t-2 border-dashed flex justify-between items-end">
                    <span className="text-xs font-black uppercase opacity-40">Total Settlement:</span>
                    <span className="text-4xl font-black tracking-tighter text-primary">KES {totalPayable.toLocaleString()}</span>
                </div>
            </div>

            <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Settlement Gateway</Label>
                <div className="grid grid-cols-2 gap-4">
                    <Button 
                        variant="outline" 
                        onClick={() => setMethod('mpesa')}
                        className={cn(
                            "h-16 rounded-2xl border-2 flex flex-col gap-1",
                            method === 'mpesa' ? "border-green-600 bg-green-50" : ""
                        )}
                    >
                        <Smartphone className="h-5 w-5" />
                        <span className="text-[10px] font-black uppercase">M-Pesa STK</span>
                    </Button>
                    <Button 
                        variant="outline" 
                        onClick={() => setMethod('paypal')}
                        className={cn(
                            "h-16 rounded-2xl border-2 flex flex-col gap-1",
                            method === 'paypal' ? "border-blue-600 bg-blue-50" : ""
                        )}
                    >
                        <CreditCard className="h-5 w-5" />
                        <span className="text-[10px] font-black uppercase">PayPal / Card</span>
                    </Button>
                </div>

                <div className="pt-4 animate-in fade-in slide-in-from-top-4">
                    {method === 'mpesa' ? (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase">M-Pesa Phone Number</Label>
                                <Input 
                                    value={phone} 
                                    onChange={e => setPhone(e.target.value)} 
                                    placeholder="07XXXXXXXX" 
                                    className="h-14 text-2xl font-black bg-muted/20 border-none rounded-2xl text-center"
                                />
                            </div>
                            <Button onClick={handleMpesaPay} disabled={isProcessing} className="w-full h-16 text-lg font-black uppercase tracking-widest bg-green-600 hover:bg-green-700 text-white rounded-2xl shadow-xl">
                                {isProcessing ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : <Smartphone className="mr-2 h-6 w-6" />}
                                Pay via STK Push
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100 flex items-center gap-4">
                                <CheckCircle2 className="h-8 w-8 text-blue-600" />
                                <p className="text-xs font-bold text-blue-900">Secure international checkout. Pay via PayPal balance or Debit/Credit card.</p>
                            </div>
                            <Button onClick={handlePaypalPay} className="w-full h-16 text-lg font-black uppercase tracking-widest bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-xl">
                                <CreditCard className="mr-2 h-6 w-6" />
                                Proceed to PayPal
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>

        <div className="p-6 bg-muted/30 border-t text-center">
            <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest leading-relaxed">
                Platform Security Protocol &bull; Encrypted Settlement Node &bull; Secured by Simon Styles Corp
            </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
