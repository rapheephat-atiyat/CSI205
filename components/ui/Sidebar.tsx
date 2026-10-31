'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
  const pathname = usePathname();

  const menuItems = [
    { name: 'Vendor Dashboard', href: '/vandor' },
    { name: 'Product Management', href: '/vandor/products' },
    { name: 'Vendor QR Scanner', href: '/vandor/scanner' },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-100 p-6 hidden md:flex md:flex-col justify-between h-screen sticky top-0">
      <div>
        <div className="flex items-center space-x-2 mb-8">
          <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center text-white font-bold">
            e
          </div>
          <span className="text-xl font-bold text-gray-800">token</span>
        </div>

        <nav className="space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-xl transition ${
                  isActive
                    ? 'bg-red-50 text-red-500'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                }`}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="border-t pt-4">
        <div className="flex items-center space-x-3 text-sm text-gray-600">
          <div className="w-8 h-8 rounded-full bg-gray-200"></div>
          <div>
            <p className="font-semibold text-gray-800 text-xs">Vendor Account</p>
            <p className="text-xs text-gray-400">vendor@shop.com</p>
          </div>
        </div>
      </div>
    </aside>
  );
}