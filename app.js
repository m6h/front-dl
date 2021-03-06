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
app.use(express.json({limit: '1GB'})) // Parse JSON body payloads
__basedir = __dirname
log = (args = {app: '', event: '', msg: ''}) => {
    console.log(`${new Date().toISOString()} - ${args.app} - ${args.event} - ${args.msg.toString().replace(/\n/gm, ' ')}`)
}

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


// API

// Import controllers
const downloadController = require('./controllers/download')
const settingsController = require('./controllers/settings')
const suggestController = require('./controllers/suggest')


// youtube-dl
app.post('/api/download', downloadController.download)
// Query string: {
//     url: '', format: '', tags: {artist: '', title: '', genre: '', album: '', track: ''},
//     path: '', fileName: '', socketId: '',
//     embedThumbnail: 'true' or 'false',
//     writeThumbnail: 'true' or 'false',
//     uid: '', gid: '', chmod: ''
// }

app.post('/api/downloadPlaylist', downloadController.downloadPlaylist)
    // Query string: {
    //     url: '', format: '', path: '', 
    //     playlistName: '', outputTemplate: '', socketId: '',
    //     embedThumbnail: 'true' or 'false',
    //     writeThumbnail: 'true' or 'false',
    //     uid: '', gid: '', chmod: ''
    // }

app.get('/api/download/cache/:fileName', downloadController.downloadFromCache)
app.get('/api/browse', downloadController.browse) // {path: ''}
app.get('/api/metadata', downloadController.metadata) // {url: ''}
app.get('/api/update/ydl', downloadController.update)
app.route('/api/cookies')
    .get(downloadController.getCookies)
    .put(downloadController.putCookies) // {cookies: ''}

// Suggestions
app.get('/api/suggest/genre', suggestController.getGenre)
app.route('/api/suggest/genre/:name')
    .put(suggestController.updateGenre)
    .delete(suggestController.deleteGenre)

// Versions
app.get('/api/version/ydl', downloadController.version)
app.get('/api/version/ffmpeg', settingsController.ffmpegVersion)
app.get('/api/version/atomicparsley', settingsController.atomicparsleyVersion)

// Settings
app.get('/api/env', (req, res) => res.json(process.env))
app.route('/api/settings')
    .get(settingsController.get)
    .put(settingsController.update)