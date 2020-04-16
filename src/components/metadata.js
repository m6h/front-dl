import m from 'mithril'

export { getMetadata, getThumbnail, autofill }

// Return thumbnail url from metadata
const getThumbnail = (meta = {}) => {
    if (meta) {
        switch (meta.extractor) {
            case 'youtube':
            case 'youtube:playlist':
            case 'youtube:playlists':
                return meta.thumbnail
            case 'soundcloud':
            case 'soundcloud:set':
            case 'soundcloud:playlist':
                // Second last array element's url
                return meta.thumbnails[meta.thumbnails.length - 2].url
            default:
                return '/public/images/blank.png'
        }
    } else {
        // Blank if argument is null
        return '/public/images/blank.png'
    }
}

// Fetch metadata
const getMetadata = (url = '') => 
    m.request({
        method: 'GET',
        responseType: 'json',
        url: `/api/metadata?url=${url}`
    }).catch(e => console.error(e))


const autofill = (res, meta = {fileName: '', tags: {artist: '', title: '', genre: ''}}) => {
    // Attempt to autofill fields based on the youtube-dl extractor used.
    switch (res.extractor) {
        case 'youtube':
            // If Artist has a value it's probably a song from YouTube Music with proper metadata.
            if (res.artist) {
                // File name
                res.title ? meta.fileName = `${res.artist} - ${res.track}` : meta.fileName = ''
            } else {
                // File name
                res.title ? meta.fileName = res.title : meta.fileName = ''
            }
            // Artist
            res.artist ? meta.tags.artist = res.artist : meta.tags.artist = ''
            // Title (aka track)
            res.track ? meta.tags.title = res.track : meta.tags.title = ''
            // Genre
            res.genre ? meta.tags.genre = res.genre : meta.tags.genre = ''
            break
        case 'soundcloud':
            // File name
            res.uploader ? meta.fileName = `${res.uploader} - ${res.title}` : meta.fileName = ''
            // Artist
            res.uploader ? meta.tags.artist = res.uploader : meta.tags.artist = ''
            // Title
            res.title ? meta.tags.title = res.title : meta.tags.title = ''
            // Genre
            res.genre ? meta.tags.genre = res.genre : meta.tags.genre = ''
            break
    }

    return meta
}