const mongoose = require('mongoose')

exports.Genre = mongoose.model('genres', new mongoose.Schema({
    name: {type: String, required: true},
    weight: {type: Number, default: 1}
}))