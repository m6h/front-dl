const mongoose = require('mongoose')

// Create model and schema. Export model.
var Setting = mongoose.model('settings', new mongoose.Schema({
    mode: {type: String, default: 'browser'},
    format: {type: String, default: 'video'},
    outputTemplate: {type: String, default: '%(playlist_index)s - %(title)s.%(ext)s'},
    embedThumbnail: {type: String, default: 'true'},
    writeThumbnail: {type: String, default: 'true'},
    uid: {type: String, default: ''},
    gid: {type: String, default: ''},
    chmod: {type: String, default: ''}
}))
exports.Setting = Setting

// Initialize database values if not present
async function main() {

    // Should only be 1 document in collection. Recreate if more than 1
    const count = await Setting.countDocuments({})
    if (count > 1) {Setting.collection.drop()}

    // Find first document where correct keys exist
    const settings = await Setting.findOne({
        mode:           {$exists: true, $type: 'string'},
        format:         {$exists: true, $type: 'string'},
        outputTemplate: {$exists: true, $type: 'string'},
        embedThumbnail: {$exists: true, $type: 'string'},
        writeThumbnail: {$exists: true, $type: 'string'},
        uid:            {$exists: true, $type: 'string'},
        gid:            {$exists: true, $type: 'string'},
        chmod:          {$exists: true, $type: 'string'}
    })

    if (settings) {
        // Settings exist
    } else {
        // Settings do not exist or do not have correct key/values. Create with default values.
        Setting.collection.drop().catch(e => {})

        const document = new Setting()
        document.save().catch(e => console.error(e))
    }
} main()