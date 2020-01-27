const express = require('express')
const app = express()
const port = 3000
const server = app.listen(port, () => console.log(`listening on http://localhost:${port}`))
const io = require('socket.io').listen(server)


// Export Socket.io
exports.io = io

// Static resources
app.use('/public', express.static('./public/'))
app.use('/bin', express.static('./bin/'))



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

app.get('/api/browse', ydlController.browse)
app.get('/api/thumbnail', ydlController.thumbnail)
app.get('/api/download', ydlController.download)
app.get('/api/version/ydl', ydlController.version)
app.get('/api/update/ydl', ydlController.update)

