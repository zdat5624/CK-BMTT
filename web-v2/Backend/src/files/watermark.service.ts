import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import FormData from 'form-data';

interface ImageCandidate {
    image_name: string;
    original_name: string;
    metadata_path: string | null;
    id: number;
}

@Injectable()
export class WatermarkService {
    constructor(private prisma: PrismaService) { }

    private readonly BASE_PY_SERVER = 'http://127.0.0.1:8000';

    async embedWatermark(inputPath: string, outputPath: string, outputMetaPath: string) {
        const form = new FormData();
        form.append('cover', fs.createReadStream(inputPath));
        form.append('watermark', fs.createReadStream(path.join(process.cwd(), 'public/assets/logo-watermark.png')));
        form.append('output_img_path', outputPath.replace(/\\/g, '/'));
        form.append('output_meta_path', outputMetaPath.replace(/\\/g, '/'));

        try {
            const res = await axios.post(`${this.BASE_PY_SERVER}/embed`, form, { headers: form.getHeaders() });
            if (!res.data.success) throw new InternalServerErrorException('Python embed failed');
            return true;
        } catch (err) {
            throw new InternalServerErrorException('Failed to embed watermark: ' + err);
        }
    }

    async runPythonCheck(uploadedPath: string, coverPath: string, metaPath: string, wmPath: string) {
        const form = new FormData();
        form.append('uploaded', fs.createReadStream(uploadedPath));
        form.append('cover', fs.createReadStream(coverPath));
        form.append('meta', fs.createReadStream(metaPath));
        form.append('watermark', fs.createReadStream(wmPath));

        try {
            const res = await axios.post(`${this.BASE_PY_SERVER}/check`, form, { headers: form.getHeaders() });
            return res.data;
        } catch (err) {
            throw new InternalServerErrorException('Failed to check watermark: ' + err);
        }
    }

    async verifyImageIntegrity(filePath: string) {
        const allCandidates: ImageCandidate[] = await this.prisma.image.findMany({
            where: { metadata_path: { not: null } }, // chỉ lấy ảnh đã nhúng
            select: { id: true, image_name: true, original_name: true, metadata_path: true, },
        });

        for (const c of allCandidates) {
            const cover = path.join(process.cwd(), 'public', c.original_name);
            const meta = path.join(process.cwd(), 'public', c.metadata_path!);
            const wm = path.join(process.cwd(), 'public/assets/logo-watermark.png');

            try {
                // console.log("filePath: ", filePath)
                // console.log("cover: ", cover)
                const result = await this.runPythonCheck(filePath, cover, meta, wm);
                if (result.detected) {
                    return {
                        isSafe: false,
                        message: `Ảnh trùng bản quyền (${c.image_name})`,
                        score: result.score,
                        copyrighted_image_name: c.image_name,
                        copyrighted_image_id: c.id,
                    };
                }
            } catch {
                continue;
            }
        }
        return { isSafe: true };
    }
}
