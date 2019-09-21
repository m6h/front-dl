const express = require('express')
const exec = require('child_process').exec
const app = express()
const port = 3000

app.listen(port, () => console.log(`listening on http://localhost:${port}`))
app.set('view engine', 'ejs')
app.use('/public', express.static('./public/'))
app.use('/lib', express.static('./bin/lib/'))

app.get('/', (req, res) => {
    res.render('./index.ejs')
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