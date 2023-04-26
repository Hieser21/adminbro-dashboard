import fs, { existsSync } from "fs";
import { move } from "fs-extra";
import path from "path";
import { UploadedFile } from "adminjs";
import { BaseProvider } from "@adminjs/upload";
const UPLOADS_DIR = 'public/files';

export default class UploadProvider extends BaseProvider {
  constructor() {
    super(UPLOADS_DIR);
    if (!existsSync(UPLOADS_DIR)) {
      throw new Error(`directory: "${UPLOADS_DIR}" does not exists. Create it before running LocalAdapter`);
    }
  }

  // * Fixed this method because original does rename instead of move and it doesn't work with docker volume
  public async upload(file: UploadedFile, key: string): Promise<any> {
    const filePath = process.platform === "win32" ? this.path(key) : this.path(key).slice(1); // adjusting file path according to OS
    await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
    await move(file.path, filePath, { overwrite: true });
  }

  public async delete(key: string, bucket: string): Promise<any> {
    await fs.promises.unlink(process.platform === "win32" ? this.path(key, bucket) : this.path(key, bucket).slice(1)); // adjusting file path according to OS
  }

  // eslint-disable-next-line class-methods-use-this
  public path(key: string, bucket?: string): string {
    // Windows doesn't requires the '/' in path, while UNIX system does
    return process.platform === "win32"
      ? `${path.join(bucket || this.bucket, key)}`
      : `/${path.join(bucket || this.bucket, key)}`;
  }
}