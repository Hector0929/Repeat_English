"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // 導航連結資料
  const navLinks = [
    { name: 'Lessons', href: '/' },
    { name: 'Practice', href: '#', comingSoon: true },
    { name: 'Resources', href: '#', comingSoon: true },
  ];

  return (
    <nav className="fixed top-0 w-full bg-white shadow-sm z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <span className="font-bold text-xl text-[#1B4965]">Repeat English</span>
            </Link>
          </div>
          
          {/* 桌面版導航 */}
          <div className="hidden sm:ml-6 sm:flex sm:items-center sm:space-x-8">
            {navLinks.map((link) => (
              <div key={link.name} className="relative group">
                <Link
                  href={link.href}
                  className="text-[#1A1A2E] hover:text-[#5FA8D3] px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  {link.name}
                </Link>
                {link.comingSoon && (
                  <span className="absolute -top-2 -right-6 bg-[#CAE9FF] text-[#1B4965] text-[10px] px-1.5 py-0.5 rounded-full font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                    Soon
                  </span>
                )}
              </div>
            ))}
            
            {/* 使用者頭像 */}
            <div className="ml-4 flex items-center">
              <div className="w-8 h-8 rounded-full bg-[#1B4965] text-white flex items-center justify-center text-sm font-bold">
                U
              </div>
            </div>
          </div>
          
          {/* 手機版選單按鈕 */}
          <div className="flex items-center sm:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none"
            >
              <span className="sr-only">打開主選單</span>
              {isMobileMenuOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 手機版下拉選單 */}
      {isMobileMenuOpen && (
        <div className="sm:hidden bg-white border-t border-gray-100">
          <div className="pt-2 pb-3 space-y-1">
            {navLinks.map((link) => (
              <div key={link.name} className="flex items-center justify-between px-4 py-2">
                <Link
                  href={link.href}
                  className="block text-base font-medium text-[#1A1A2E] hover:text-[#5FA8D3] hover:bg-gray-50"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.name}
                </Link>
                {link.comingSoon && (
                  <span className="bg-[#CAE9FF] text-[#1B4965] text-xs px-2 py-1 rounded-full font-bold">
                    Coming Soon
                  </span>
                )}
              </div>
            ))}
            <div className="px-4 py-2 flex items-center border-t border-gray-100 mt-2 pt-4">
              <div className="w-8 h-8 rounded-full bg-[#1B4965] text-white flex items-center justify-center text-sm font-bold mr-3">
                U
              </div>
              <span className="text-sm font-medium text-[#1A1A2E]">User</span>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
