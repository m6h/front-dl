const { db } = require('../app')
const { exec } = require('child_process')

// Track settings
var settings = {
    version: {},
    htmlDownload: false,
    autoClear: false
}

// GET
exports.get = (req, res) => {
    res.json(settings)
}

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



// PUT
exports.update = (req, res) => {
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

    res.json('')
}

// db.on('error', console.error.bind(console, 'MongoDB connection error:'))

