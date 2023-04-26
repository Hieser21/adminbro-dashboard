import mongoose from 'mongoose'

const FileSchema = new mongoose.Schema({
    id: { type: String, required: true },
    comment: { type: String},
    name: { type: String, required: true },
})

const File = mongoose.model('File', FileSchema)

export default File