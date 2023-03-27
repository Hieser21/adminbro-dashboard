import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
user: {
    type: 'string',
    required: true,
    unique: false,
},
type: {
    type: 'string',
    enum: ['bug', 'exception'],
    required: true,
},
description: {
    type: 'string',
    required: true,
},
}, { timestamps:true}
)

const Reports = mongoose.model('Reports', reportSchema)

export default Reports