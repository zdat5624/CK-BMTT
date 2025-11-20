import { useEffect, useState } from "react";

// 💡 COMPONENT TỰ XÂY DỰNG: LoadingDots
export const LoadingDots: React.FC = () => {
    const [dots, setDots] = useState('');

    useEffect(() => {
        const interval = setInterval(() => {
            setDots((prev) => {
                if (prev.length === 3) { // Giới hạn 3 dấu chấm
                    return '.';
                }
                return prev + '.';
            });
        }, 500); // 500ms = 0.5 giây

        return () => clearInterval(interval);
    }, []);

    return <span>{dots}</span>;
};