const express = require('express')
const { exec } = require('child_process')
const { posix } = require('path')
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
        </head>
        <body>
            <script src="/lib/bundle.js"></script>
        </body>
        </html>
    `)
})

function formatPath(queryPath) {
    // prepend root directory. return error if any '/../' in path. clean up path using normalize
    const path = '/node/' + queryPath
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
    // var find = spawn('find', [`./node_modules/${req.query.path}`, '-maxdepth', '1', '-mindepth', '1', '-type', 'd', '-printf', '%f/'])
    // console.log(find.spawnargs)
    // find.stdout.once('data', data => {
    //     console.log(data.toString())
    //     res.json(data.toString())
    // })
    // if folder is empty will return exit code 0
    // find.on('exit', data => {
    //     console.log('')
    //     res.json('')
    // })
})

// Download
app.get('/api/ydl', (req, res) => {
    // Query string: {url: '', type: '', path: ''}
    try {
        var cmd = ''
        const path = formatPath(req.query.path)
        
        if(req.query.type == 'audio') {
            cmd = `youtube-dl -f "bestaudio[ext=m4a]" --embed-thumbnail -o "${path}.%(ext)s" ${req.query.url}`
        } else if(req.query.type == 'video') {
            cmd = `youtube-dl -f "bestvideo[height<=?1080]+bestaudio" --merge-output-format "mkv" --write-thumbnail -o "${path}.%(ext)s" ${req.query.url}`
        }

        exec(cmd, (error, stdout, stderr) => {
            res.json(stdout)
        })
    } catch (error) {
        console.log(error)
        res.json('')
    }
})