import m from 'mithril'

export { getMetadata, getThumbnail }

// Fetch thumbnail
const getThumbnail = (url = '') =>
    new Promise(async (resolve, reject) => {
        var thumbnail = ''

        const res = await m.request({
            method: 'GET',
            responseType: 'json',
            url: `/api/thumbnail?url=${url}`
        }).catch(e => console.error(e))

        if (res) {
            thumbnail = res
        } else {
            thumbnail = '/public/blank.png'
        }

        res ? resolve(thumbnail) : reject()
    }).catch(e => console.error(e))

// Fetch metadata
const getMetadata = (url = '', meta = {fileName: '', tags: {artist: '', title: '', genre: ''}}) => 
    new Promise(async (resolve, reject) => {

        const res = await m.request({
            method: 'GET',
            responseType: 'json',
            url: `/api/metadata?url=${url}`
        }).catch(e => console.error(e))

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

        res ? resolve() : reject()
    }).catch(e => console.error(e))