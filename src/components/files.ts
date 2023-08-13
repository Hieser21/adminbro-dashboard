import uploadFeature from '@adminjs/upload';
import { componentLoader } from './index.js';
import File from '../db/File.js';
import { BaseRecord } from 'adminjs';
const AWScredentials = {
    bucket: 'public/files',
    opts: {
        baseUrl: '/asset/files'
    }
}
export const files = {
    resource: File,
    listProperties: ['id', 'path'],
    properties: {
        bucket: { isVisible: { list: false, show: true, edit: false } },
        _id: { isVisible: { list: false, show: true, edit: false } },
    },
    action: { list: { isAccessible: false } },
    features: [
        uploadFeature({
            provider: {local: AWScredentials},
            componentLoader,
            validation: { mimeTypes: ['image/png', 'image/jpg', 'image/gif', 'image/jpeg'] },
            properties: { file: 'file', key: 'public/files', mimeType: 'mime', filename: 'avatar', },
            uploadPath: (record: BaseRecord, filename: string) => `${record.params.name}/${record.params.id}` + '.' + `${filename.split('.')[1]}`,
        },
        )],
};

export default files