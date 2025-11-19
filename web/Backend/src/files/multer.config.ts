import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';

// Folder tạm để Multer lưu file upload
const TMP_UPLOAD_DIR = './public/uploads/tmp';
if (!fs.existsSync(TMP_UPLOAD_DIR)) fs.mkdirSync(TMP_UPLOAD_DIR, { recursive: true });

// Folder chính
const FINAL_IMAGE_DIR = './public/uploads/images';
const META_DIR = './public/uploads/meta';
const ORIGINAL_DIR = './public/uploads/original';
[FINAL_IMAGE_DIR, META_DIR, ORIGINAL_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

export const tmpStorageConfig = diskStorage({
    destination: TMP_UPLOAD_DIR,
    filename: (req, file, callback) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = extname(file.originalname);
        callback(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
    },
});

export const imageFileFilter = (req, file, callback) => {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
        return callback(new Error('Only image files are allowed!'), false);
    }
    callback(null, true);
};
