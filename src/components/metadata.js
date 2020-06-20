import m from 'mithril'

export { getMetadata, getThumbnail, autofill }

// Return thumbnail url from metadata
function getThumbnail(meta = {}) {
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
function getMetadata(url = '') {
    return m.request({
        method: 'GET',
        responseType: 'json',
        url: '/api/metadata',
        params: {url: url}
    }).catch(e => console.error(e))
}

function autofill(res, meta = {fileName: '', tags: {artist: '', title: '', genre: ''}}) {
    // Attempt to autofill fields based on the youtube-dl extractor used.
    switch (res.extractor) {
        case 'youtube':
            // If Artist has a value it's probably a song from YouTube Music with proper metadata.
            if (res.artist) {
                // File name
                res.title ? meta.fileName = `${res.artist} - ${res.track}` : null
            } else {
                // File name
                res.title ? meta.fileName = res.title : null
            }
            // Artist
            res.artist ? meta.tags.artist = res.artist : null
            // Title (aka "track" for youtube)
            res.track ? meta.tags.title = res.track : null
            // Genre
            res.genre ? meta.tags.genre = res.genre : null
            // Album
            // res.album ? meta.tags.album = res.album : null
            break
        case 'soundcloud':
            // File name
            res.uploader ? meta.fileName = `${res.uploader} - ${res.title}` : null
            // Artist
            res.uploader ? meta.tags.artist = res.uploader : null
            // Title
            res.title ? meta.tags.title = res.title : null
            // Genre
            res.genre ? meta.tags.genre = res.genre : null
            break
    }

    return meta
}