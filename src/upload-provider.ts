import admin from 'firebase-admin'
import { UploadedFile } from "adminjs";
import { BaseProvider } from "@adminjs/upload";
import { getStorage, Storage } from "firebase-admin/storage";
const app = admin.initializeApp({
  credential: admin.credential.cert('src/dashboard-d7e5d-firebase-adminsdk-s4c4m-a9d8cc39c7.json'),
  projectId: "dashboard-d7e5d",
  storageBucket: "dashboard-d7e5d.appspot.com",
})

const storage = getStorage(app)
export default class UploadProvider extends BaseProvider {
  private storage: Storage
  constructor(options) {
    super(options.bucket);
  }

  // * Fixed this method because original does rename instead of move and it doesn't work with docker volume
  public async upload(file: UploadedFile, key: string): Promise<any> {
    return storage.bucket(this.bucket).upload(file.path, {
      gzip: true,
      destination: key
    })
  }

  public async delete(key: string, bucket: string): Promise<any> {
   const bucketStore = storage.bucket(bucket)
   const file = bucketStore.file(key)
   return file.delete()
  }

  // eslint-disable-next-line class-methods-use-this
  public async path(key: string, bucket?: string):  Promise<any> {
    const bucketStore = storage.bucket(bucket)
    const file =bucketStore.file(key)
    let filePath = key.split('/').join('%2F')
    return `https://firebasestorage.googleapis.com/v0/b/${this.bucket}/o/${filePath}?alt=media`
  }
}