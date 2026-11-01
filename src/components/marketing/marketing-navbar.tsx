'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Zap, Moon, Sun, Building2 } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useAuth } from '@/firebase';
import { initiateGoogleSignIn } from '@/firebase/non-blocking-login';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

interface MarketingNavbarProps {
    isDark: boolean;
    onToggleTheme: () => void;
}

/**
 * @fileOverview Floating Glassmorphic Navigation
 */
export function MarketingNavbar({ isDark, onToggleTheme }: MarketingNavbarProps) {
  const auth = useAuth();
  const { toast } = useToast();

  const handleGoogleSignIn = async () => {
    try {
      await initiateGoogleSignIn(auth);
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error', description: "Google Sign-In failed." });
    }
  };

  return (
    <div className="fixed top-6 w-full z-50 px-6">
        <motion.nav 
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: "circOut" }}
            className={cn(
                "max-w-7xl mx-auto h-16 sm:h-20 flex items-center justify-between px-6 rounded-2xl sm:rounded-[2rem] border transition-all duration-500",
                isDark 
                    ? "bg-black/60 border-white/10 text-white" 
                    : "bg-white/60 border-black/5 text-black",
                "backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.1)]"
            )}
        >
            <Link href="/" className="flex items-center gap-3 group">
                <div className="bg-[#1a1a1a] p-2 rounded-xl shadow-lg ring-1 ring-[#eab308]/20 group-hover:scale-110 transition-transform">
                    <Zap className="h-5 w-5 sm:h-6 sm:w-6 text-[#eab308]" />
                </div>
                <span className="font-black text-lg tracking-tighter uppercase hidden xs:block">BusinessHub</span>
            </Link>
            
            <div className="flex items-center gap-2 lg:gap-6">
                <div className="hidden md:flex items-center gap-8 text-[11px] font-bold uppercase tracking-widest mr-4">
                    <Link href="/#industries" className="hover:text-[#eab308] transition-colors">Industries</Link>
                    <Link href="/company/about" className="hover:text-[#eab308] transition-colors">Solutions</Link>
                    <Link href="/support/contact" className="hover:text-[#eab308] transition-colors">Contact</Link>
                </div>
                
                <div className="flex items-center gap-2">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={onToggleTheme}
                        className={cn(
                            "rounded-xl h-9 w-9 sm:h-10 sm:w-10 transition-colors",
                            isDark ? "text-[#eab308] hover:bg-white/5" : "text-black/60 hover:bg-black/5"
                        )}
                    >
                        {isDark ? <Sun className="h-4 w-4 sm:h-5 sm:w-5" /> : <Moon className="h-4 w-4 sm:h-5 sm:w-5" />}
                    </Button>

                    <div className="h-6 w-[1px] mx-1 hidden sm:block bg-current opacity-10" />

                    <Button 
                        variant="outline" 
                        onClick={handleGoogleSignIn}
                        className={cn(
                            "font-bold uppercase text-[9px] tracking-widest h-9 sm:h-10 border-2 transition-all hidden lg:flex rounded-xl",
                            isDark ? "border-white/10 hover:bg-white/5" : "border-black/5 hover:bg-black/5"
                        )}
                    >
                        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 mr-2">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.16H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.84l3.66-2.75z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.16l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        Google
                    </Button>

                    <Button asChild variant="outline" className={cn(
                        "font-bold uppercase text-[9px] sm:text-[10px] tracking-widest px-4 sm:px-5 h-9 sm:h-10 border-2 transition-all rounded-xl",
                        isDark ? "border-[#22c55e]/30 text-[#22c55e] hover:bg-[#22c55e]/10" : "border-[#22c55e]/20 text-[#15803d] hover:bg-[#22c55e]/5"
                    )}>
                        <Link href="/login">Sign In</Link>
                    </Button>
                    
                    <Button asChild className="font-bold uppercase text-[9px] sm:text-[10px] tracking-widest shadow-xl px-4 sm:px-5 h-9 sm:h-10 bg-[#22c55e] text-white hover:bg-[#16a34a] border-none active:scale-95 transition-all rounded-xl">
                        <Link href="/signup">Get Started</Link>
                    </Button>
                </div>
            </div>
        </motion.nav>
    </div>
  );
}
