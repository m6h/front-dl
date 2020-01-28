const { db } = require('../app')

// Track settings
var settings = {
    htmlDownload: false,
    autoClear: false
}

// GET
exports.get = (req, res) => {
    res.json(settings)
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

