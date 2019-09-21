const express = require('express')
const exec = require('child_process').exec
const app = express()
const port = 3000

app.listen(port, () => console.log(`listening on http://localhost:${port}`))
app.use('/public', express.static('./public/'))
app.use('/lib', express.static('./bin/lib/'))

app.get('/', (req, res) => {
    res.send(`
        <html>
        <head>
            <link rel="stylesheet" href="/public/styles.css">
        </head>
        <body>
            <script src="/lib/bundle.js"></script>
        </body>
        </html>
    `)
})

app.get('/api/ydl/:outputString/:url', (req, res) => {
    var command = `echo ${req.params.outputString} ${req.params.url}`

    var cmd = exec(command, (error, stdout, stderr) => {
        // stdout ? res.send('done') : res.send(error)
        res.send(stdout)
    })

    // event listener
    cmd.stdout.on('data', (data) => {
        console.log(data)
    })
})