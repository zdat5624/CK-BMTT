import { diskStorage } from 'multer';
import { extname } from 'path';

export const storageConfig = diskStorage({
    // 1. Định nghĩa nơi lưu file
    // Lưu ý: Bạn phải tạo sẵn thư mục này ở gốc dự án (ngang hàng với src)
    destination: './public/uploads/images',

    // 2. Logic đổi tên file (để tránh trùng tên)
    filename: (req, file, callback) => {
        // Tạo chuỗi ngẫu nhiên: Thời gian hiện tại + số random
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);

        // Lấy đuôi file gốc (ví dụ: .jpg, .png)
        const ext = extname(file.originalname);

        // Tên file mới: file-1234567890-555.jpg
        callback(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
    },
});

// 3. Bộ lọc chỉ cho phép file ảnh
export const imageFileFilter = (req, file, callback) => {
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
        // Nếu không phải ảnh -> Báo lỗi
        return callback(new Error('Only image files are allowed!'), false);
    }
    // Cho phép
    callback(null, true);
};