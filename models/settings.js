const mongoose = require('mongoose')

// Create model and schema. Export model.
var Setting = mongoose.model('settings', new mongoose.Schema({
    dlMode: {type: String, default: 'browser'},
    dlType: {type: String, default: 'video'}
}))
exports.Setting = Setting

// Initialize database values if not present
async function main() {

    // Should only be 1 document in collection. Recreate if more than 1
    const count = await Setting.countDocuments({})
    
    if (count > 1) {
        Setting.collection.drop()
    }

    // Find first document where correct keys exist
    const settings = await Setting.findOne({
        dlMode: {$exists: true},
        dlType: {$exists: true}
    })

    if (settings) {
        // Settings exist
    } else {
        // Settings do not exist. Create with default values.
        const document = new Setting()
        document.save().catch(e => console.error(e))
    }
} main()