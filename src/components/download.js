import m from 'mithril'
import * as qs from 'qs'
import io from 'socket.io-client'
import { app } from '../main' // Singleton class for app settings

var dl = initDL()
function initDL() {
    return {
        url: '', fileName: '', path: [], directory: [], stdout: [], downloadProgress: 0,
        thumbnail: '/public/blank.png',
        tags: {
            artist: '',
            title: '',
            genre: ''
        },
        suggest: {
            genres: [],
            genresFiltered: []
        },
        fullPath: () => {
            var fullPath = [...dl.path, dl.fileName] // clone dl.path and append dl.fileName
            return fullPath.join('/')
        },
        command: () => {
            if (dl.stdout[0]) {
                return dl.stdout
            } else if(app.prefs.dlType == 'audio') {
                return [`youtube-dl -f "bestaudio[ext=m4a]" --embed-thumbnail -o "${dl.fullPath()}.m4a" ${dl.url}`]
            } else if(app.prefs.dlType == 'video') {
                return [`youtube-dl -f "bestvideo[height<=?1080]+bestaudio" --merge-output-format "mkv" --write-thumbnail -o "${dl.fullPath()}.mkv" ${dl.url}`]
            }
        }
    }
}

const socket = io()
// Listen on socket. Sockets automatically join a room identified by their id. This room is where the server emits the stdout stream.
socket.on('connect', () => {
    // Output stdout to text area
    socket.on('console_stdout', data => {
        // Regex to match only the download % from stdout. Download % is not present in all output lines.
        const match = data.match(/([0-9]{1,3}.[0-9])\%/)
        // Use capture group 1 to get value without the % symbol.
        match ? dl.downloadProgress = match[1] : null

        // Append console stdout to array
        length = dl.stdout.push(data)

        // Maintain array length of 4
        if (length > 6) {
            dl.stdout.shift()
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

function typeSelect(vnode) {
    if (vnode) {
        const type = vnode.target.innerText.toLowerCase() // equals content of currently selected button

        // Set type in app settings
        app.prefs.dlType = type

        // Save selected type
        m.request({
            method: 'PUT',
            responseType: 'json',
            url: `/api/settings?dlType=${type}`
        }).then(response => {}).catch(e => console.error(e))
    }

    // Toggle html classes on download type select buttons (audio or video)
    switch(app.prefs.dlType) {
        case 'audio':
            document.getElementById('t1').classList.add('is-info')
            document.getElementById('t2').classList.remove('is-info')
            document.getElementById('tags').classList.remove('is-hidden')
            break
        case 'video':
            document.getElementById('t1').classList.remove('is-info')
            document.getElementById('t2').classList.add('is-info')
            document.getElementById('tags').classList.add('is-hidden')
            break
    }
}

// recreate the main object, reset buttons, and fetch directories
function clearPage() {
    dl = initDL()
    getDirectory()
}

 // update directory browser listings
function getDirectory() {
    m.request({
        method: 'GET',
        responseType: 'json',
        url: `/api/browse?path=${dl.path.join('/')}`
    }).then(response => {
        dl.directory = response.split('/')
        dl.directory.pop() // remove empty last element from using split()
    }).catch(e => console.error(e))
}

// Fetch video metadata and thumbnail
function getMetadata() {
    // Get all input field elements. Convert htmlCollection to Array.
    var inputFields = Array.from(document.getElementsByClassName('control'))

    // Add loading spinner to all input fields
    inputFields.forEach(item => item.classList.add('is-loading'))

    // Thumbnail
    m.request({
        method: 'GET',
        responseType: 'json',
        url: `/api/thumbnail?url=${dl.url}`
    }).then(response => {
        document.getElementById('url-control').classList.remove('is-loading')
        if (response) {
            dl.thumbnail = response
        } else {
            dl.thumbnail = '/public/blank.png'
        }
    }).catch(e => console.error(e))

    // Metadata
    m.request({
        method: 'GET',
        responseType: 'json',
        url: `/api/metadata?url=${dl.url}`
    }).then(response => {
        // Remove loading spinners on input fields
        inputFields.forEach(item => item.classList.remove('is-loading'))

        // Autofill fields.
        // If Artist has a value then the media is likely a song with proper metadata
        if (response.artist) {
            // File name
            response.title ? dl.fileName = `${response.artist} - ${response.track}` : dl.fileName = ''
        } else {
            // File name
            response.title ? dl.fileName = response.title : dl.fileName = ''
        }
        // Artist
        response.artist ? dl.tags.artist = response.artist : dl.tags.artist = ''
        // Title (aka track)
        response.track ? dl.tags.title = response.track : dl.tags.title = ''

    }).catch(e => console.error(e))
}

// fetch genre suggestions
function getSuggestions() {
    m.request({
        method: 'GET',
        responseType: 'json',
        url: '/api/suggest/genre'
    }).then(response => {
        dl.suggest.genres = response

        // Slice array to include only the top 4 results
        dl.suggest.genresFiltered = response.slice(0, 4)
    }).catch(e => console.error(e))
}

// enable or disable Go button
function goState(s) {
    if(s) {
        // if true then enable go button
        document.getElementById('download').classList.add('is-info')
        document.getElementById('download').removeAttribute('disabled')
    } else {
        // else disable go button
        document.getElementById('download').classList.remove('is-info')
        document.getElementById('download').setAttribute('disabled', 'true')
    }
}

// send xhr to begin download
function go() {
    document.getElementById('download').classList.add('is-loading')

    var sendDL = {
        url: dl.url,
        type: app.prefs.dlType,
        tags: dl.tags,
        path: '',
        fileName: dl.fileName,
        socketId: socket.id
    }

    // Change path depending on "download to browser" app setting. A normal path = download to directory. 'false' = download to browser.
    app.prefs.htmlDownload ? sendDL.path = 'false' : sendDL.path = dl.path.join('/')

    if (app.prefs.dlType == 'audio' && dl.tags.genre) {
        // Add genre to genre suggestions
        m.request({
            method: 'PUT',
            responseType: 'json',
            url: `/api/suggest/genre/${dl.tags.genre}`
        }).then(response => getSuggestions()).catch(e => console.error(e))
    }

    // Send download request
    m.request({
        method: 'GET',
        responseType: 'json',
        url: `/api/download?${qs.stringify(sendDL)}`
    }).then(response => {}).catch(e => console.error(e)) // response is handled via socket.io
}

export default {
    oninit: () => {
        getDirectory()
        getSuggestions()
    },
    oncreate: () => {
        // If the "download to browser" setting is true hide the directory browser as it is not needed
        if (app.prefs.htmlDownload) {
            document.getElementById('directory').classList.add('is-hidden')
        } else {
            document.getElementById('directory').classList.remove('is-hidden')
        }

        typeSelect()
    },
    onupdate: () => {
        // If fields have a value then enable download button
        if(dl.url && dl.fileName && app.prefs.dlType) {
            // if audio then check tag values exist
            if(app.prefs.dlType == 'audio' && dl.tags.artist && dl.tags.title) {
                goState(true)
            } else if(app.prefs.dlType == 'video') {
                goState(true)
            } else {
                goState(false)
            }
        } else {
            goState(false)
        }
    },
    view: () => m('div', {class: 'container'}, [
        m('div', {class: 'section'}, [
            m('div', {class: 'columns'}, [
                m('div', {class: 'column'}, [
                     m('div', {class: 'field'}, [
                        m('label', {class: 'label'}, 'URL'),
                        m('div', {id: 'url-control', class: 'control has-icons-left has-icons-right'}, [
                            m('span', {class: 'icon is-left'}, m('i', {class: 'fas fa-link'})),
                            m('input', {
                                class: 'input',
                                type:'text',
                                placeholder: 'e.g. https://youtu.be/UKT5_l324wg',
                                value: dl.url,
                                oninput: vnode => {
                                    dl.url = vnode.target.value
                                    getMetadata()
                                }
                            })
                        ])
                    ]),
                    m('div', {class: 'box', style: 'padding: 0.5em'}, [
                        m('figure', {class: 'image is-16by9'}, [
                            m('span', {
                                class: 'has-text-weight-light is-unselectable',
                                style: `position: absolute;
                                        top: 50%;
                                        left: 50%;
                                        transform: translate(-50%, -50%);`,
                            }, 'Thumbnail preview'),
                            m('img', {src: dl.thumbnail})
                        ])
                    ]),
                    m('div', {class: 'field'}, [
                        m('label', {class: 'label'}, 'File Name'),
                        m('div', {class: 'control has-icons-left has-icons-right'}, [
                            m('span', {class: 'icon is-left'}, m('i', {class: 'fas fa-file'})),
                            m('input', {
                                class: 'input',
                                type:'text',
                                placeholder: 'e.g. Rootkit - Taking Me Higher',
                                value: dl.fileName,
                                oninput: vnode => dl.fileName = vnode.target.value
                            })
                        ])
                    ]),
                    m('div', {class: 'field'}, [
                        m('label', {class: 'label'}, 'Type'),
                        m('div', {class: 'field is-grouped'}, [
                            m('a', {
                                id: 't1',
                                class: 'button is-fullwidth',
                                style: 'margin: 0.1em',
                                onclick: vnode => typeSelect(vnode)
                            }, 'Audio'),
                            m('a', {
                                id: 't2',
                                class: 'button is-fullwidth',
                                style: 'margin: 0.1em',
                                onclick: vnode => typeSelect(vnode)
                            }, 'Video')
                        ]),
                    ]),
                    m('div', {id: 'tags', class: 'field is-hidden'}, [
                        m('div', {class: 'field'}, [
                            m('label', {class: 'label'}, 'Artist'),
                            m('div', {class: 'control has-icons-left'}, [
                                m('span', {class: 'icon is-left'}, m('i', {class: 'fas fa-music'})),
                                m('input', {
                                    class: 'input',
                                    type:'text',
                                    placeholder: 'e.g. Rootkit',
                                    value: dl.tags.artist,
                                    oninput: vnode => dl.tags.artist = vnode.target.value
                                })
                            ])
                        ]),
                        m('div', {class: 'field'}, [
                            m('label', {class: 'label'}, 'Title'),
                            m('div', {class: 'control has-icons-left'}, [
                                m('span', {class: 'icon is-left'}, m('i', {class: 'fas fa-music'})),
                                m('input', {
                                    class: 'input',
                                    type:'text',
                                    placeholder: 'e.g. Taking Me Higher',
                                    value: dl.tags.title,
                                    oninput: vnode => dl.tags.title = vnode.target.value
                                })
                            ])
                        ]),
                        m('div', {class: 'field'}, [
                            m('label', {class: 'label'}, 'Genre'),
                            m('div', {class: 'control has-icons-left'}, [
                                m('span', {class: 'icon is-left'}, m('i', {class: 'fas fa-music'})),
                                m('input', {
                                    id: 'genre',
                                    class: 'input',
                                    type:'text',
                                    placeholder: 'e.g. House',
                                    autocomplete: 'off',
                                    value: dl.tags.genre,
                                    oninput: vnode =>  {
                                        dl.tags.genre = vnode.target.value
                                        const input = vnode.target.value
                                        var regex

                                        // If only 1 letter, must begin with input, otherwise must contain input. Case (i)nsensitive matching.
                                        if (input.length == 1) {
                                            regex = new RegExp(`^${input}`, 'i')
                                        } else {
                                            regex = new RegExp(`${input}`, 'i')
                                        }

                                        // Filter into new array with only results that match the above regex.
                                        // Slice array to include only the top 4 results.
                                        dl.suggest.genresFiltered = dl.suggest.genres.filter(item => item.name.match(regex)).slice(0, 4)
                                    },
                                    onfocus: vnode => {
                                        document.getElementById('suggest-genres').classList.remove('is-hidden')
                                        vnode.target.classList.add('suggestions-field')
                                    },
                                    onblur: vnode => {
                                        document.getElementById('suggest-genres').classList.add('is-hidden')
                                        vnode.target.classList.remove('suggestions-field')
                                    }
                                })
                            ]),
                            m('div', {id: 'suggest-genres', class: 'suggestions is-hidden'}, [
                                m('ul', {class: 'box'}, [
                                    dl.suggest.genresFiltered.map(item => 
                                        m('li', {onmousedown: () => dl.tags.genre = item.name}, [
                                            m('span', {
                                                class: 'icon',
                                                onmousedown: () => {
                                                    // Remove genre from suggestions. Clear input field.
                                                    m.request({
                                                        method: 'DELETE',
                                                        responseType: 'json',
                                                        url: `/api/suggest/genre/${item.name}`
                                                    }).then(response => {
                                                        dl.tags.genre = ''
                                                        getSuggestions()
                                                    }).catch(e => console.error(e))
                                                    setTimeout(() => document.getElementById('genre').focus(), 50)
                                                }
                                            }, m('i', {class: 'fas fa-times'})),
                                            m('div', item.name)
                                        ])
                                    )
                                ])
                            ])
                        ]),
                    ]),
                ]),
                m('div', {class: 'column'}, [
                    m('nav', {id: 'directory', class: 'panel'}, [
                        m('p', {class: 'panel-heading'}, 'Directory'),
                        m('div', {class: 'panel-block'}, [
                            m('a', {class: 'button is-small', onclick: vnode => {dl.path.pop(); getDirectory()}}, [
                                m('span', {class: 'icon is-small'}, m('i', {class: 'fas fa-arrow-left'})),
                            ]),
                            m('input', {
                                class: 'input is-small',
                                type:'text',
                                readonly: true,
                                placeholder: 'path',
                                value: dl.path.join('/')
                            })
                        ]),
                        dl.directory.map(item => 
                            m('a', {class: 'panel-block', onclick: vnode => {dl.path.push(vnode.target.innerText); getDirectory()}}, [
                                m('span', {class: 'panel-icon'}, m('i', {class: 'fas fa-folder'})),
                                m('span', `${item}`)
                            ])
                        )
                    ]),
                    m('div', {class: 'field'}, [
                        m('label', {class: 'label'}, m('i', {class: 'fas fa-terminal'})),
                        m('div', {class: 'control'}, [
                            m('progress', {
                                class: 'progress is-info',
                                style: `margin-bottom: 0;
                                        height: 0.5em;
                                        position: absolute;
                                        z-index: 5;
                                        border-radius: 0;
                                        border-top-left-radius: 6px;
                                        border-top-right-radius: 6px;`,
                                value: dl.downloadProgress,
                                max: 100
                            }),
                            m('div', {class: 'box', style:'font-family: monospace; white-space: nowrap; overflow-x: scroll;'}, [
                                dl.command().map(item => 
                                    // Remove the prepended app tags from youtube-dl. E.g. the "[youtube]" in "[youtube] id: Downloading thumbnail"
                                    m('div', {style: 'width: 1em'}, item.replace(/\[[a-z]+\] +/i, ''))
                                )
                            ])
                        ])
                    ]),
                    m('div', {class: 'field is-grouped'}, [
                        m('button', {id: 'download', class: 'button is-fullwidth', disabled: 'true', onclick: go}, 'Go'),
                        m('a', {
                            class: 'button is-outlined is-danger',
                            style: 'margin-left: 1em',
                            'data-tooltip': 'Clear page',
                            onclick: vnode => clearPage(),
                        }, m('span', {class: 'icon'}, m('i', {class: 'fas fa-times'}))),
                    ])
                ])
            ])
        ])
    ])
}