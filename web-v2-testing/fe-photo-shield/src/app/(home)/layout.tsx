// homeLayout.tsx (Layout cha)
import Footer from '@/components/layouts/Footer';
import Header from '@/components/layouts/Header';
import type { ReactNode } from 'react';

export default function homeLayout({ children }: { children: ReactNode }) {
    return (
        // Thêm flex-col và min-h-screen
        <div className="flex flex-col min-h-screen">
            <Header />
            {/* flex-grow để main chiếm hết không gian còn lại */}
            <div className="flex-grow container mx-auto px-4 py-4 h-full">
                {children}
            </div>
            <Footer />
        </div>
    );
}