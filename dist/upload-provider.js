import fs, { existsSync } from "fs";
import { move } from "fs-extra";
import path from "path";
import { BaseProvider } from "@adminjs/upload";
const UPLOADS_DIR = 'public/files';
export default class UploadProvider extends BaseProvider {
    constructor(options) {
        super(options.bucket, options?.opts);
        if (!existsSync(options.bucket)) {
            throw new Error(`directory: "${options.bucket}" does not exists. Create it before running LocalAdapter`);
        }
    }
    async upload(file, key) {
        const filePath = process.platform === "win32" ? this.path(key) : this.path(key).slice(1);
        await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
        await move(file.path, filePath, { overwrite: true });
    }
    async delete(key, bucket) {
        await fs.promises.unlink(process.platform === "win32" ? this.path(key, bucket) : this.path(key, bucket).slice(1));
    }
    path(key, bucket) {
        return process.platform === "win32"
            ? `${path.join(bucket || this.bucket, key)}`
            : `/${path.join(bucket || this.bucket, key)}`;
    }
}
