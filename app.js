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
