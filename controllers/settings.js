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

    switch(req.query.mode) {
        case 'browser':
            settings.mode = 'browser'
            break
        case 'directory':
            settings.mode = 'directory'
            break
    }

    switch(req.query.format) {
        case 'audio':
            settings.format = 'audio'
            break
        case 'video':
            settings.format = 'video'
            break
    }

    if (req.query.outputTemplate) {
        settings.outputTemplate = req.query.outputTemplate
    }

    await settings.save().catch(e => console.error(e))
    res.json(settings)
}

// Get ffmpeg version
exports.ffmpegVersion = (req, res) => {
    exec("ffmpeg -version | awk '/ffmpeg version/ {print$3}'", (error, stdout, stderr) => {
        if (error) {
            log('ffmpeg', error)
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
            log('AtomicParsley', error)
            res.json('Unknown')
        } else {
            res.json(stdout)
        }
    })
}