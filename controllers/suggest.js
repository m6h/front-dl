const { Genre } = require('../models/suggest')

// Get all genres
exports.getGenre = async (req, res) => {
    // Sort array in descending(-1) order based on weight property. [{name: 'first', weight: 5}, {name: 'second', weight: 4}]
    const genres = await Genre.find().sort({weight: -1})
    res.json(genres)
}

// Add or update genres. New genres are added, existing genres have their weight incremented by 1.
exports.updateGenre = async (req, res) => {
    const genre = await Genre.findOne({name: req.params.name})

    if (genre) {
        // Already exists. Increment weight.
        genre.weight++
        await genre.save().catch(e => console.error(e))
        res.json(genre)
    } else {
        // Genre was not found. Add the new genre.
        const document = new Genre({name: req.params.name})

        await document.save().catch(e => console.error(e))
        res.json(document)
    }
}

// Delete a genre
exports.deleteGenre = async (req, res) => {
    const document = await Genre.deleteOne({name: req.params.name})
    res.json(document)
}