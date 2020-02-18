const mongoose = require('mongoose')

// Create model and schema. Export model.
var Setting = mongoose.model('settings', new mongoose.Schema({
    htmlDownload: {type: Boolean, default: true},
    autoClear: {type: Boolean, default: false},
    dlType: {type: String, default: 'video'}
}))
exports.Setting = Setting

// Initialize database values if not present
async function main() {
    const settings = await Setting.findOne()

    if (settings) {
        // Settings exist
    } else {
        // Settings do not exist. Create with default values.
        const document = new Setting()
        document.save().catch(e => console.error(e))
    }
} main()