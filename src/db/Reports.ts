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
game: {
    required: true,
    type: String,
    
}
}, { timestamps:true}
)

const Reports = mongoose.model('Reports', reportSchema)

export default Reports