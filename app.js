const express = require('express');
const app = express();
const port = 3000;
app.listen(port, () => console.log(`listening on http://localhost:${port}`));

app.set('view engine', 'ejs')
// app.set('views', './src') // Change default location from ./views to ./src
app.use('/public', express.static('./public/'));
app.use('/lib', express.static('./bin/lib/'))

app.get('/', (req, res) => {
    res.render('index.ejs');
});
