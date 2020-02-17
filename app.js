const express = require('express')
const app = express()
const port = 3000
const server = app.listen(port, () => console.log(`listening on http://localhost:${port}`))
const io = require('socket.io').listen(server)
const mongoose = require('mongoose')

// Satisfy Mongoose deprecation warnings
mongoose.set('useNewUrlParser', true)
mongoose.set('useUnifiedTopology', true)

// MongoDB connection using Mongoose. Log any initial connection errors.
mongoose.connect('mongodb://mongodb/front-dl').catch(e => console.error(e))

// Listen for connection errors after initial connection
mongoose.connection.on('error', e => console.error(e))

// Export Socket.io
exports.io = io

// Static resources
app.use('/public', express.static('./public/'))
app.use('/bin', express.static('./bin/'))
__basedir = __dirname


// Routes //

// Mithril.js front-end
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>front-dl</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <script src="/public/all.min.js"></script>
            <link rel="stylesheet" href="/public/bulma.min.css">
            <link rel="stylesheet" href="/public/bulma-tooltip.min.css">
            <link rel="stylesheet" href="/public/bulma-switch.min.css">
        </head>
        <body>
            <script src="/bin/bundle.js"></script>
        </body>
        </html>
    `)
})


// api

// Import youtube-dl controller
const ydlController = require('./controllers/youtube-dl')
const settingsController = require('./controllers/settings')

app.get('/api/browse', ydlController.browse)

app.route('/api/thumbnail')
    .get(ydlController.getThumbnail)
    .delete(ydlController.clearThumbnailCache)
    
app.get('/api/download', ydlController.download)
app.get('/api/download/cache', ydlController.downloadFromCache)
app.get('/api/update/ydl', ydlController.update)

// Versions
app.get('/api/version/ydl', ydlController.version)
app.get('/api/version/ffmpeg', settingsController.ffmpegVersion)
app.get('/api/version/atomicparsley', settingsController.atomicparsleyVersion)

app.route('/api/settings')
    .get(settingsController.get)
    .put(settingsController.update)