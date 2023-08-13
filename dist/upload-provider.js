import admin from 'firebase-admin';
import { BaseProvider } from "@adminjs/upload";
import { getStorage } from "firebase-admin/storage";
const app = admin.initializeApp({
    credential: admin.credential.cert('./dashboard-d7e5d-firebase-adminsdk-s4c4m-a9d8cc39c7.json'),
    projectId: "dashboard-d7e5d",
    storageBucket: "dashboard-d7e5d.appspot.com",
});
const storage = getStorage(app);
export default class UploadProvider extends BaseProvider {
    storage;
    constructor(options) {
        super(options.bucket);
    }
    async upload(file, key) {
        return storage.bucket(this.bucket).upload(file.path, {
            gzip: true,
            destination: key
        });
    }
    async delete(key, bucket) {
        const bucketStore = storage.bucket(bucket);
        const file = bucketStore.file(key);
        return file.delete();
    }
    async path(key, bucket) {
        const bucketStore = storage.bucket(bucket);
        const file = bucketStore.file(key);
        let filePath = key.split('/').join('%2F');
        return `https://firebasestorage.googleapis.com/v0/b/${this.bucket}/o/${filePath}?alt=media`;
    }
}
