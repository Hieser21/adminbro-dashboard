import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
user: {
    type: 'string',
    required: true,
    unique: false,
},
type: {
    type: 'string',
    enum: ['bug', 'rulebreak'],
    required: true,
},
description: {
    type: 'string',
    required: true,
}
})

const Reports = mongoose.model('Reports', reportSchema)

export default Reports