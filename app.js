const express = require('express')
const app = express()
const port = process.env.PORT || 3000
const dbUrl = process.env.DB_URL || 'mongodb://localhost/front-dl'
const server = app.listen(port, () => console.log(`Starting Node.js\nPort: ${port}\nDatabase: ${dbUrl}`))
const io = require('socket.io').listen(server)
const mongoose = require('mongoose')

// Satisfy Mongoose deprecation warnings
mongoose.set('useNewUrlParser', true)
mongoose.set('useUnifiedTopology', true)

// MongoDB connection using Mongoose. Log any initial connection errors.
mongoose.connect(`${dbUrl}`).catch(e => console.error(e))

// Listen for connection errors after initial connection
mongoose.connection.on('error', e => console.error(e))

// Export Socket.io
exports.io = io

// Static resources
app.use('/public', express.static('./public/'))
app.use('/bin', express.static('./bin/'))
__basedir = __dirname
log = (app, msg) => console.log(`${new Date().toISOString()} - ${app} - ${msg.toString().replace(/\n/gm, '')}`)

// Handle SIGTERM
process.on('SIGTERM', () => {
    console.log('Stopping server...')
    mongoose.connection.close(() => {
        console.log('Database connection closed')
        process.exit(0)
    })
})


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
            <link rel="stylesheet" href="/public/styles.css">
        </head>
        <body>
            <script src="/bin/bundle.js"></script>
        </body>
        </html>
    `)
})


// api

// Import controllers
const ydlController = require('./controllers/youtube-dl')
const settingsController = require('./controllers/settings')
const suggestController = require('./controllers/suggest')


// youtube-dl
app.get('/api/browse', ydlController.browse) // {path: ''}
app.get('/api/download', ydlController.download) // {url: '', format: '', tags: {artist: '', title: '', genre: ''}, path: '', fileName: '', socketId: ''}
app.get('/api/downloadPlaylist', ydlController.downloadPlaylist) // {url: '', format: '', path: '', playlistName: '', outputTemplate: '', socketId: ''}
app.get('/api/download/cache/:fileName', ydlController.downloadFromCache)
app.get('/api/metadata', ydlController.metadata) // {url: ''}
app.get('/api/update/ydl', ydlController.update)
app.route('/api/cookies')
    .get(ydlController.getCookies)
    .put(ydlController.putCookies) // {cookies: ''}

// Suggestions
app.get('/api/suggest/genre', suggestController.getGenre)
app.route('/api/suggest/genre/:name')
    .put(suggestController.updateGenre)
    .delete(suggestController.deleteGenre)

// Versions
app.get('/api/version/ydl', ydlController.version)
app.get('/api/version/ffmpeg', settingsController.ffmpegVersion)
app.get('/api/version/atomicparsley', settingsController.atomicparsleyVersion)

// Settings
app.get('/api/env', (req, res) => res.json(process.env))
app.route('/api/settings')
    .get(settingsController.get)
    .put(settingsController.update)