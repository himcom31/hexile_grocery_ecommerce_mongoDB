// src/components/AdminLayout.jsx
import React from 'react';

const AdminLay = ({ children }) => {
  return (
    <div className="flex h-screen bg-[#F8F9FA]">
      {/* Fixed Sidebar */}
      

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navbar (Search bar, Admin Profile, Notifications) */}
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-8">
          <h2 className="text-lg font-bold text-[#243746]">Dashboard Overview</h2>
          <div className="flex items-center gap-4">
             <span className="text-sm font-medium">Himanshu Chaudhary</span>
             <div className="w-10 h-10 bg-[#00B14F] rounded-full flex items-center justify-center text-white font-bold">H</div>
          </div>
        </header>

        {/* Dynamic Pages (Orders, Products, etc.) */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLay;