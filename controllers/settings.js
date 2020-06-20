const { exec } = require('child_process')
const { Setting } = require('../models/settings')

// Get settings
exports.get = async (req, res) => {
    const settings = await Setting.findOne()
    res.json(settings)
}

// Update settings
exports.update = async (req, res) => {
    const q = req.query

    // Ensure that query string contains a valid value
    if (q.mode || q.format || q.outputTemplate || q.writeThumbnail || (q.uid || q.uid == '') || (q.gid || q.gid == '') || (q.chmod || q.chmod == '')) {
        const settings = await Setting.findOne()
    
        if (q.mode == 'browser' || q.mode == 'directory') {settings.mode = q.mode}
        if (q.format == 'audio' || q.format == 'video') {settings.format = q.format}
        if (q.outputTemplate) {settings.outputTemplate = q.outputTemplate}
        if (q.writeThumbnail) {settings.writeThumbnail = q.writeThumbnail}
        if (q.uid || q.uid == '') {settings.uid = q.uid}
        if (q.gid || q.gid == '') {settings.gid = q.gid}
        if (q.chmod || q.chmod == '') {settings.chmod = q.chmod}
    
        await settings.save().catch(e => console.error(e))
        res.json(settings)
    } else {
        res.status(400).send('Bad Request')
    }
}

// Get ffmpeg version
exports.ffmpegVersion = (req, res) => {
    exec("ffmpeg -version | awk '/ffmpeg version/ {print$3}'", (error, stdout, stderr) => {
        if (error) {
            log({app: 'ffmpeg', event: 'stderr', msg: error})
            res.json('Unknown')
        } else {
            res.json(stdout)
        }
    })
}

// Get AtomicParsley version
exports.atomicparsleyVersion = (req, res) => {
    exec("AtomicParsley --version | awk '{print$3}'", (error, stdout, stderr) => {
        if (error) {
            log({app: 'AtomicParsley', event: 'stderr', msg: error})
            res.json('Unknown')
        } else {
            res.json(stdout)
        }
    })
}