const express = require('express')
const exec = require('child_process').exec
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

app.get('/api/browse', (req, res) => {
    exec(`find ./node_modules/${req.query.path} -maxdepth 1 -mindepth 1 -type d -printf '%f/'`, (error, stdout, stderr) => {
        console.log(stdout)
        res.json(stdout)
    })
    // exec(`ls -F ./node_modules/${req.query.path} | grep "/$"`, (error, stdout, stderr) => {
    //     res.send(stdout)
    // })
})

app.get('/api/ydl/:outputString/:url', (req, res) => {
    var command = `echo ${req.params.outputString} ${req.params.url}`

    var cmd = exec(command, (error, stdout, stderr) => {
        // stdout ? res.send('done') : res.send(error)
        res.json(stdout)
    })

    // event listener
    cmd.stdout.on('data', (data) => {
        console.log(data)
    })
})