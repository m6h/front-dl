import m from 'mithril'
import { app } from '../main'
import * as qs from 'qs'
import io from 'socket.io-client'
import { getSuggestions } from '../views/download'

const state = {
    progress: 0, // Current percentage of download progress
    loading: false
}
var stdout = []

// Initialize socket
const socket = io()

// Listen on socket. Sockets automatically join a room identified by their id. This room is where the server emits the stdout stream.
socket.on('connect', () => {
    // Output stdout to text area
    socket.on('console_stdout', data => {
        // Regex to match only the download % from stdout. Download % is not present in all output lines.
        const match = data.match(/([0-9]{1,3}.[0-9])\%/)
        // Use capture group 1 to get value without the % symbol.
        match ? state.progress = match[1] : null

        // Append console stdout to array. Get new length of the array
        const length = stdout.push(data)

        // Maintain specific array length (lines in the output)
        if (length > 6) {
            stdout.shift()
        }

        m.redraw() // Manually trigger Mithril redraw so textarea gets updated live
    })

    // Download progress (on complete)
    socket.on('download_complete', fileName => {
        // document.getElementById('download').classList.remove('is-loading')
        state.loading = false

        // Fetch file if downloading to browser. fileName contains the file extension.
        if (app.prefs.mode == 'browser') {
            window.location.href = `/api/download/cache/${fileName}`
        }
    })
})

function command(vnode) {
    if (stdout[0]) {
        return stdout
    } else if(vnode.attrs.type == 'single' && app.prefs.format == 'audio') {
        return [`youtube-dl -f "bestaudio[ext=m4a]/bestaudio[ext=mp3]" --embed-thumbnail -o "${[...vnode.attrs.path, vnode.attrs.fileName].join('/')}.m4a" ${vnode.attrs.url}`]
    } else if(vnode.attrs.type == 'playlist' && app.prefs.format == 'audio') {
        return [`youtube-dl -f "bestaudio[ext=m4a]/bestaudio[ext=mp3]" --embed-thumbnail -o "${[...vnode.attrs.path, app.prefs.outputTemplate].join('/')}" ${vnode.attrs.url}`]
    } else if(vnode.attrs.type == 'single' && app.prefs.format == 'video') {
        return [`youtube-dl -f "bestvideo[height<=?1080]+bestaudio" --merge-output-format "mkv" --write-thumbnail -o "${[...vnode.attrs.path, vnode.attrs.fileName].join('/')}.mkv" ${vnode.attrs.url}`]
    } else if(vnode.attrs.type == 'playlist' && app.prefs.format == 'video') {
        return [`youtube-dl -f "bestvideo[height<=?1080]+bestaudio" --merge-output-format "mkv" --write-thumbnail -o "${[...vnode.attrs.path, app.prefs.outputTemplate].join('/')}" ${vnode.attrs.url}`]
    }
}

// send xhr to begin download
function download(vnode) {
    switch (vnode.attrs.type) {
        case 'single':
            state.loading = true

            var sendDL = {
                url: vnode.attrs.url,
                fileName: vnode.attrs.fileName,
                tags: vnode.attrs.tags,
                format: app.prefs.format,
                socketId: socket.id
            }
        
            // Change path depending on app's download mode setting. A normal path = download to directory. 'false' = download to browser.
            if (app.prefs.mode == 'browser') {
                sendDL.path = 'false'
            } else {
                sendDL.path = vnode.attrs.path.join('/')
            }
        
            if (app.prefs.format == 'audio' && vnode.attrs.tags.genre) {
                // Add genre to genre suggestions
                m.request({
                    method: 'PUT',
                    responseType: 'json',
                    url: '/api/suggest/genre/:name',
                    params: {name: vnode.attrs.tags.genre}
                }).then(response => {
                    getSuggestions()
                }).catch(e => console.error(e))
            }
        
            // Send download request
            m.request({
                method: 'GET',
                responseType: 'json',
                url: '/api/download',
                params: sendDL
            }).then(response => {}).catch(e => console.error(e)) // response is handled via socket.io
            break
        case 'playlist':
            state.loading = true

            var sendDL = {
                url: vnode.attrs.url,
                playlistName: vnode.attrs.playlistName,
                format: app.prefs.format,
                outputTemplate: app.prefs.outputTemplate,
                path: vnode.attrs.path.join('/'),
                socketId: socket.id
            }
        
            // Send download request
            m.request({
                method: 'GET',
                responseType: 'json',
                url: '/api/downloadPlaylist',
                params: sendDL
            }).then(response => {}).catch(e => console.error(e)) // response is handled via socket.io
            break
    }
}

function ready(vnode) {
    var a = vnode.attrs

    // Enable download button if field contents for current tab are valid 
    switch (a.type) {
        case 'single':
            if(a.url && a.fileName && ((app.prefs.format == 'audio' && a.tags.artist && a.tags.title) || app.prefs.format == 'video')) {
                // If single audio download then also check tag values
                return true
            } else {
                return false
            }
            break
        case 'playlist':
            if (a.url && a.playlistName && app.prefs.format && app.prefs.outputTemplate) {
                return true
            } else {
                return false
            }
            break
    }
}

export default {
    view: vnode => m('div', [
        m('div', {class: 'field'}, [
            m('label', {class: 'label'}, m('i', {class: 'fas fa-terminal'})),
            m('div', {class: 'control'}, [
                m('progress', {
                    class: 'progress is-info',
                    style: `margin-bottom: 0;
                            height: 0.5em;
                            position: absolute;
                            border-radius: 0;
                            border-top-left-radius: 6px;
                            border-top-right-radius: 6px;`,
                    value: state.progress,
                    max: 100
                }),
                m('div', {class: 'box', style:'font-family: monospace; white-space: nowrap; overflow-x: scroll;'}, [
                    command(vnode).map(item =>
                        // Remove the prepended app tags from youtube-dl. E.g. the "[youtube]" in "[youtube] id: Downloading thumbnail"
                        m('div', {style: 'width: 1em'}, item.replace(/\[[a-z]+\] +/i, ''))
                    )
                ])
            ])
        ]),
        m('button', {
            class: 'button is-info is-fullwidth' + (state.loading ? ' is-loading' : ''),
            disabled: !ready(vnode),
            onclick: event => download(vnode)
        }, [
            m('span', {class: 'icon'}, m('i', {class: 'fas fa-download'})),
            m('span', 'Download')
        ])
    ])
}