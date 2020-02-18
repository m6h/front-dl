const { exec } = require('child_process')
const { Setting } = require('../models/settings')

// Get settings
exports.get = async (req, res) => {
    const settings = await Setting.findOne()
    res.json(settings)
}

// Update settings
exports.update = async (req, res) => {
    const settings = await Setting.findOne()

    switch(req.query.htmlDownload) {
        case 'true':
            settings.htmlDownload = true
            break
        case 'false':
            settings.htmlDownload = false
            break
    }
    
    switch(req.query.autoClear) {
        case 'true':
            settings.autoClear = true
            break
        case 'false':
            settings.autoClear = false
            break
    }

    switch(req.query.dlType) {
        case 'audio':
            settings.dlType = 'audio'
            break
        case 'video':
            settings.dlType = 'video'
            break
    }

    await settings.save().catch(e => console.error(e))
    res.json(settings)
}

// Get ffmpeg version
exports.ffmpegVersion = (req, res) => {
    exec("ffmpeg -version | awk '/ffmpeg version/ {print$3}'", (error, stdout, stderr) => {
        if (error) {
            console.error(error)
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
            console.error(error)
            res.json('Unknown')
        } else {
            res.json(stdout)
        }
    })
}