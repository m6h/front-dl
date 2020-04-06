import m from 'mithril'
import * as qs from 'qs'
import { socket } from '../main'
import { app } from '../main' // Singleton class for app settings

var progress = 0 // Current percentage of download progress
var stdout = []

function pathWithFileName(vnode) {
    var fullPath = [...vnode.attrs.path, vnode.attrs.fileName] // Append fileName to path array
    return fullPath.join('/')
}

function command(vnode) {
    if (stdout[0]) {
        return stdout
    } else if(app.prefs.dlType == 'audio') {
        return [`youtube-dl -f "bestaudio[ext=m4a]/bestaudio[ext=mp3]" --embed-thumbnail -o "${pathWithFileName(vnode)}.m4a" ${vnode.attrs.url}`]
    } else if(app.prefs.dlType == 'video') {
        return [`youtube-dl -f "bestvideo[height<=?1080]+bestaudio" --merge-output-format "mkv" --write-thumbnail -o "${pathWithFileName(vnode)}.mkv" ${vnode.attrs.url}`]
    }
}

// send xhr to begin download
function startDownload(vnode) {
    const el = vnode.dom.children
    el['buttons'].children['download'].classList.add('is-loading')

    var sendDL = {
        url: vnode.attrs.url,
        fileName: vnode.attrs.fileName,
        tags: vnode.attrs.tags,
        type: app.prefs.dlType,
        socketId: socket.id
    }

    // Change path depending on app's download mode setting. A normal path = download to directory. 'false' = download to browser.
    app.prefs.htmlDownload ? sendDL.path = 'false' : sendDL.path = vnode.attrs.path.join('/')
    
    console.log(sendDL)

    // if (app.prefs.dlType == 'audio' && vnode.attrs.tags.genre) {
    //     // Add genre to genre suggestions
    //     m.request({
    //         method: 'PUT',
    //         responseType: 'json',
    //         url: `/api/suggest/genre/${encodeURIComponent(vnode.attrs.tags.genre)}`
    //     }).then(response => {
    //         // getSuggestions()
    //     }).catch(e => console.error(e))
    // }

    // // Send download request
    // m.request({
    //     method: 'GET',
    //     responseType: 'json',
    //     url: `/api/download?${qs.stringify(sendDL)}`
    // }).then(response => {}).catch(e => console.error(e)) // response is handled via socket.io
}


export default {
    stdout: input => {
        stdout.push(input)
    },
    oninit: vnode => {
        vnode.state.progress = 0
    },
    oncreate: vnode => {
        // Listen on socket. Sockets automatically join a room identified by their id. This room is where the server emits the stdout stream.
        socket.on('connect', () => {

            // Output stdout to text area
            socket.on('console_stdout', data => {
                // Regex to match only the download % from stdout. Download % is not present in all output lines.
                const match = data.match(/([0-9]{1,3}.[0-9])\%/)
                // Use capture group 1 to get value without the % symbol.
                match ? progress = match[1] : null

                // Append console stdout to array
                const length = stdout.push(data)

                // Maintain specific array length (lines in the output)
                if (length > 6) {
                    stdout.shift()
                }

                m.redraw() // Manually trigger Mithril redraw so textarea gets updated live
            })

            // Download progress (on complete)
            socket.on('download_complete', fileName => {
                document.getElementById('download').classList.remove('is-loading')

                // Fetch file if downloading to browser. fileName contains the file extension.
                app.prefs.htmlDownload ? window.location.href = `/api/download/cache/${fileName}` : null

                // Clear the page after download if that setting is enabled
                app.prefs.autoClear ? clearPage() : null
            })
        })
    },
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
                    value: progress,
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
        m('div', {id: 'buttons', class: 'field is-grouped'}, [
            m('button', {id: 'download', class: 'button is-fullwidth', disabled: 'true', onclick: event => startDownload(vnode)}, 'Download'),
            m('a', {
                class: 'button is-outlined is-danger',
                style: 'margin-left: 1em',
                'data-tooltip': 'Clear page',
                // onclick: vnode => clearPage(),
            }, m('span', {class: 'icon'}, m('i', {class: 'fas fa-times'}))),
        ])
    ])
}