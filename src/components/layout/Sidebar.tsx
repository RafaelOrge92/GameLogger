"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function Sidebar({ user }: { user: any }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <aside 
      className={`${isExpanded ? 'w-64' : 'w-20'} bg-[#050505] border-r-2 border-[#ff6b00] hidden md:flex flex-col h-full transition-all duration-300 ease-in-out shrink-0 z-40 relative`}
    >
      {/* Toggle Button */}
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="absolute -right-3 top-16 w-6 h-12 bg-[#ff6b00] text-black flex items-center justify-center hover:bg-white transition-colors cursor-pointer border border-[#050505]"
        style={{ clipPath: 'polygon(0 0, 100% 15%, 100% 85%, 0 100%)' }}
      >
        <svg className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Logo Area */}
      <div className="h-16 flex items-center justify-center border-b-2 border-[#ff6b00] overflow-hidden whitespace-nowrap">
        {isExpanded ? (
          <h1 className="text-[#ff6b00] font-retro text-2xl tracking-widest">
            GAME<span className="text-white">TRACKER</span>
          </h1>
        ) : (
          <h1 className="text-[#ff6b00] font-retro text-2xl tracking-widest">GT</h1>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 py-8 px-3 space-y-4 overflow-hidden">
        <Link 
          href="/" 
          className="flex items-center gap-4 px-3 py-3 bg-[#0f0f0f] text-[#ff6b00] border-2 border-[#ff6b00] hover:bg-[#ff6b00] hover:text-black transition-colors shadow-[4px_4px_0px_#ff6b00] hover:shadow-none hover:translate-x-1 hover:translate-y-1"
          title="Mi Colección"
        >
          <svg className="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          {isExpanded && <span className="font-bold uppercase tracking-wider whitespace-nowrap">Colección</span>}
        </Link>
        <Link 
          href="/stats" 
          className="flex items-center gap-4 px-3 py-3 text-gray-400 border-2 border-transparent hover:border-[#ff6b00] hover:text-[#ff6b00] transition-colors group"
          title="Estadísticas"
        >
          <svg className="w-6 h-6 shrink-0 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          {isExpanded && <span className="font-bold uppercase tracking-wider whitespace-nowrap">Stats</span>}
        </Link>
      </nav>

      {/* Auth Bottom Area */}
      <div className="p-4 border-t-2 border-[#ff6b00] overflow-hidden flex justify-center">
        {isExpanded ? (
          user ? (
            <button 
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-transparent border-2 border-[#ff6b00] text-[#ff6b00] font-retro text-xl hover:bg-[#ff6b00] hover:text-black transition-colors shadow-[4px_4px_0px_#ff6b00] hover:shadow-none hover:translate-x-1 hover:translate-y-1 cursor-pointer"
            >
              LOG OUT
            </button>
          ) : (
            <Link 
              href="/login"
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-transparent border-2 border-[#00ff00] text-[#00ff00] font-retro text-xl hover:bg-[#00ff00] hover:text-black transition-colors shadow-[4px_4px_0px_#00ff00] hover:shadow-none hover:translate-x-1 hover:translate-y-1 cursor-pointer text-center"
            >
              LOG IN
            </Link>
          )
        ) : (
          user ? (
            <button 
              onClick={handleSignOut}
              title="Log Out" 
              className="w-10 h-10 flex items-center justify-center text-[#ff6b00] hover:bg-[#ff6b00] hover:text-black transition-colors border-2 border-transparent hover:border-black cursor-pointer"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          ) : (
            <Link 
              href="/login"
              title="Log In" 
              className="w-10 h-10 flex items-center justify-center text-[#00ff00] hover:bg-[#00ff00] hover:text-black transition-colors border-2 border-transparent hover:border-black cursor-pointer"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </Link>
          )
        )}
      </div>
    </aside>
  );
}
