// src/app/profile/layout.tsx (ĐÃ SỬA LỖI)
import React, { ReactNode } from 'react';
import ProfileSidebar from '@/components/layouts/ProfileSidebar';
import AuthGuard from '@/components/AuthGuard';

export default function ProfileLayout({ children }: { children: ReactNode }) {
    return (
        <div >
            <div className="flex flex-col lg:flex-row gap-8 min-h-[70vh]" >

                {/* Sidebar: Giữ nguyên w-64 */}
                <div className="w-full lg:w-64 min-h-full">
                    {/* 💡 SỬA ĐỔI 3: Buộc Sidebar container chiếm hết chiều cao của khối cha */}
                    <div className="h-full">
                        <ProfileSidebar />
                    </div>
                </div>

                {/* Main Content Area */}
                <main className="w-full lg:flex-1 p-6 bg-white rounded-sm border-none min-h-full" >
                    {children}
                </main>
            </div>
        </div>

    );
}