'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Zap, Moon, Sun, ChevronDown, Monitor, GraduationCap, Settings2, ShoppingCart, Calculator, Users } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useAuth } from '@/firebase';
import { initiateGoogleSignIn } from '@/firebase/non-blocking-login';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface MarketingNavbarProps {
    isDark: boolean;
    onToggleTheme: () => void;
}

export function MarketingNavbar({ isDark, onToggleTheme }: MarketingNavbarProps) {
  const auth = useAuth();
  const { toast } = useToast();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      await initiateGoogleSignIn(auth);
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error', description: "Google Sign-In failed." });
    }
  };

  const industries = [
    { name: 'Retail & Hardware', href: '/solutions/retail', icon: ShoppingCart },
    { name: 'Hospitality & Bars', href: '/solutions/hospitality', icon: Monitor },
    { name: 'School Management', href: '/solutions/school', icon: GraduationCap },
    { name: 'Salons & Services', href: '/solutions/services', icon: Settings2 },
    { name: 'Accounting Tools', href: '/solutions/accounting', icon: Calculator },
    { name: 'CRM & Client List', href: '/solutions/crm', icon: Users },
  ];

  return (
    <div className="fixed top-6 w-full z-50 px-6">
        <motion.nav 
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: "circOut" }}
            className={cn(
                "max-w-7xl mx-auto h-16 sm:h-20 flex items-center justify-between px-6 rounded-2xl sm:rounded-[2rem] border transition-all duration-500",
                isDark 
                    ? "bg-black/80 border-white/10 text-white" 
                    : "bg-white/80 border-black/5 text-black",
                "backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.1)]"
            )}
        >
            <Link href="/" className="flex items-center gap-3 group">
                <div className="bg-[#1a1a1a] p-2 rounded-xl shadow-lg ring-1 ring-[#eab308]/20 group-hover:scale-110 transition-transform">
                    <Zap className="h-5 w-5 sm:h-6 sm:w-6 text-[#eab308] fill-[#eab308]" />
                </div>
                <span className="font-black text-lg tracking-tighter uppercase hidden xs:block">BusinessHub</span>
            </Link>
            
            <div className="flex items-center gap-2 lg:gap-6">
                <div className="hidden md:flex items-center gap-8 text-[11px] font-bold uppercase tracking-widest mr-4">
                    <DropdownMenu onOpenChange={setIsDropdownOpen}>
                        <DropdownMenuTrigger asChild>
                            <button className="flex items-center gap-1.5 hover:text-[#eab308] transition-colors outline-none">
                                Solutions <ChevronDown className={cn("h-3 w-3 transition-transform", isDropdownOpen && "rotate-180")} />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className={cn(
                            "w-72 p-2 rounded-2xl border-none shadow-2xl mt-4 animate-in fade-in slide-in-from-top-2",
                            isDark ? "bg-black/90 text-white ring-1 ring-white/10" : "bg-white/90 text-black ring-1 ring-black/5",
                            "backdrop-blur-xl"
                        )}>
                            <div className="grid gap-1">
                                {industries.map((item) => (
                                    <DropdownMenuItem key={item.href} asChild>
                                        <Link href={item.href} className="flex items-center gap-4 p-4 rounded-xl hover:bg-muted/50 cursor-pointer transition-all">
                                            <item.icon className="h-5 w-5 shrink-0 text-muted-foreground" />
                                            <span className="font-bold text-[11px] uppercase tracking-widest">{item.name}</span>
                                        </Link>
                                    </DropdownMenuItem>
                                ))}
                                <div className="border-t border-black/5 dark:border-white/10 my-1 pt-1">
                                    <DropdownMenuItem asChild>
                                        <Link href="/solutions" className="flex items-center justify-between p-4 rounded-xl hover:bg-muted/50 cursor-pointer transition-all group">
                                            <span className="font-black text-[11px] uppercase tracking-widest text-[#7c3aed]">View All Ecosystem</span>
                                            <Zap className="h-4 w-4 fill-[#1a1a1a] text-[#1a1a1a] group-hover:fill-[#7c3aed] group-hover:text-[#7c3aed] transition-colors" />
                                        </Link>
                                    </DropdownMenuItem>
                                </div>
                            </div>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Link href="/resources/docs" className="hover:text-[#eab308] transition-colors">Resources</Link>
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
                        Google
                    </Button>

                    <Button asChild variant="outline" className={cn(
                        "font-bold uppercase text-[9px] sm:text-[10px] tracking-widest px-4 sm:px-5 h-9 sm:h-10 border-2 transition-all rounded-xl",
                        isDark ? "border-[#22c55e]/50 text-[#22c55e] hover:bg-[#22c55e]/10" : "border-[#22c55e]/30 text-[#15803d] hover:bg-[#22c55e]/5"
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