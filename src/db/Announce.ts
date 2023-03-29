import mongoose from 'mongoose'

const annouceSchema = new mongoose.Schema({
    announcement: {
        required: true,
        type: 'string',
    },
}, { timestamps: true })

const Announce = mongoose.model('Announce', annouceSchema)

export default Announce;