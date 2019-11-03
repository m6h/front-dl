const express = require('express')
const { exec } = require('child_process')
const { posix } = require('path')
const crypto = require('crypto')
const fs = require('fs')
const app = express()
const port = 3000

app.listen(port, () => console.log(`listening on http://localhost:${port}`))
app.use('/public', express.static('./public/'))
app.use('/lib', express.static('./bin/lib/'))

app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <script src="/public/all.min.js"></script>
            <link rel="stylesheet" href="/public/bulma.min.css">
            <link rel="stylesheet" href="/public/bulma-tooltip.min.css">
        </head>
        <body>
            <script src="/lib/bundle.js"></script>
        </body>
        </html>
    `)
})

function formatPath(queryPath) {
    // prepend root directory. return error if any '/../' in path. clean up path using normalize.
    // trailing slash is required to correctly match a query string beginning with '../'
    const path = '/mnt/ydl/' + queryPath
    if (path.match(/\/\.\.\//)) {
        throw new Error("Navigation to parent directories is not allowed")
    } else {
        return posix.normalize(path)
    }
}

// Get folder names for the directory browser
app.get('/api/browse', (req, res) => {
    try {
        const path = formatPath(req.query.path)

        exec(`find "${path}" -maxdepth 1 -mindepth 1 -type d -printf '%f/'`, (error, stdout, stderr) => {
            res.json(stdout)
        })
    } catch (error) {
        console.log(error)
        res.json('')
    }
})

// Fetch video thumbnail
app.get('/api/thumbnail', (req, res) => {
    // Query string: {url: ''}
    try {
        // Hash query string url with sha256 to generate file name in cache folder
        // Create hash object and input (update) the string to hash
        // Calculate output (digest) of the hash function as a standard hex string
        const fileName = crypto.createHash('sha256').update(req.query.url).digest('hex')

        const filePath = `./public/cache/${fileName}.jpg`

        // If image at calculated path can be read (it exists) then return existing image path
        fs.access(filePath, fs.constants.R_OK, (error) => {
            if (error) {
                // Image can't be read (it doesn't exist). Fetch thumbnail image
                exec(`youtube-dl --write-thumbnail --skip-download -o "${filePath}" ${req.query.url}`, (error, stdout, stderr) => {
                    // If valid url respond with path to image
                    error ? res.json('') : res.json(filePath)
                })
            } else {
                // Image already exists. Respond with path to image
                res.json(filePath)
            }
        })
    } catch (error) {
        console.log(error)
        res.json('')
    }
})

// Download
app.get('/api/ydl', (req, res) => {
    // Query string: {url: '', type: '', tags: {artist: '', title: '', genre: ''}, path: ''}
    try {
        var cmd = '', cmd2 = ''
        const path = formatPath(req.query.path)
        
        // Download the video with youtube-dl. If audio then also add metadata tags using AtomicParsley
        if(req.query.type == 'audio') {
            cmd = `youtube-dl -f "bestaudio[ext=m4a]" --embed-thumbnail -o "${path}.m4a" ${req.query.url}`
            cmd2 = `AtomicParsley "${path}.m4a" --overWrite --artist "${req.query.tags.artist}" --title "${req.query.tags.title}" --genre "${req.query.tags.genre}"`
            exec(cmd, (error, stdout, stderr) => {
                res.json(stdout) // send response once download has completed
                exec(cmd2, (error, stdout, stderr) => {}) // afterwards add metadata to audio file
            })
        } else if(req.query.type == 'video') {
            cmd = `youtube-dl -f "bestvideo[height<=?1080]+bestaudio" --merge-output-format "mkv" --write-thumbnail -o "${path}.mkv" ${req.query.url}`
            exec(cmd, (error, stdout, stderr) => {
                res.json(stdout) // send response once download has completed
            })
        } else {
            res.json('')
        }
    } catch (error) {
        console.log(error)
        res.json('')
    }
})