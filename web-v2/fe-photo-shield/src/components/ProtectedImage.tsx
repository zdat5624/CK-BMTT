// src/components/ProtectedImage.tsx
import React, { CSSProperties } from 'react';
import { Image, ImageProps } from 'antd';

interface ProtectedImageProps extends ImageProps {
    wrapperClassName?: string; // Class dành cho khung bao ngoài (div)
    overlayText?: string;
}

const ProtectedImage: React.FC<ProtectedImageProps> = ({
    className,      // Class này sẽ vào Image (để chỉnh shadow, object-fit...)
    wrapperClassName, // Class này sẽ vào div bao ngoài (để chỉnh vị trí, kích thước)
    overlayText,
    style,
    ...props
}) => {
    const protectedStyle: CSSProperties & { WebkitUserDrag?: string } = {
        ...style,
        userSelect: 'none',
        WebkitUserDrag: 'none',
        pointerEvents: 'auto',
    };

    return (
        <div
            // Gán wrapperClassName vào đây
            className={`relative select-none ${wrapperClassName || ''}`}
            onContextMenu={(e) => {
                e.preventDefault();
                return false;
            }}
        >
            <div className="absolute inset-0 z-10 bg-transparent w-full h-full" />

            {overlayText && (
                <div className="absolute inset-0 z-20 flex items-center justify-center opacity-30 pointer-events-none">
                    <span className="text-white font-bold text-xl rotate-45 transform bg-black/50 px-2 py-1 rounded">
                        {overlayText}
                    </span>
                </div>
            )}

            <Image
                {...props}
                // Gán className vào đây để Ảnh nhận được Shadow
                className={className}
                draggable={false}
                preview={{ mask: 'Phóng to' }}
                style={protectedStyle as CSSProperties}
            />
        </div>
    );
};

export default ProtectedImage;