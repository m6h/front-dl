import m from 'mithril'
import * as qs from 'qs'
import { app } from '../main' // Singleton class for app settings
import { socket } from '../main'
import typeButtons from '../components/typeSelect'
import directory from '../components/directoryBrowser'
import terminalAndDownload from '../components/terminalAndDownload'
import { getMetadata, getThumbnail } from '../components/metadata'

var dl = initDL()
function initDL() {
    return {
        url: '', fileName: '',
        // path: [], stdout: [], downloadProgress: 0,
        thumbnail: '/public/images/blank.png',
        tags: {
            artist: '',
            title: '',
            genre: ''
        },
        suggest: {
            genres: [],
            genresFiltered: []
        },
        // fullPath: () => {
        //     var fullPath = [...dl.path, dl.fileName] // clone dl.path and append dl.fileName
        //     return fullPath.join('/')
        // },
        // command: () => {
        //     if (dl.stdout[0]) {
        //         return dl.stdout
        //     } else if(app.prefs.dlType == 'audio') {
        //         return [`youtube-dl -f "bestaudio[ext=m4a]/bestaudio[ext=mp3]" --embed-thumbnail -o "${dl.fullPath()}.m4a" ${dl.url}`]
        //     } else if(app.prefs.dlType == 'video') {
        //         return [`youtube-dl -f "bestvideo[height<=?1080]+bestaudio" --merge-output-format "mkv" --write-thumbnail -o "${dl.fullPath()}.mkv" ${dl.url}`]
        //     }
        // }
    }
}

// recreate the main object, reset buttons, and fetch directories
function clearPage() {
    dl = initDL()
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

const dlInputField = {
    view: vnode => m('div', {class: 'field'}, [
        m('label', {class: 'label'}, vnode.attrs.label),
        m('div', {class: 'control has-icons-left has-icons-right'}, [
            m('span', {class: 'icon is-left'}, m('i', {class: vnode.attrs.icon})),
            m('input', {
                class: 'input',
                type:'text',
                placeholder: vnode.attrs.placeholder,
                value: vnode.attrs.value,
                oninput: vnode.attrs.oninput
            })
        ])
    ])
}

export default {
    oninit: () => {
        getSuggestions()
    },
    oncreate: () => {
        // If the "download to browser" setting is true hide the directory browser as it is not needed
        if (app.prefs.htmlDownload) {
            document.getElementById('directory').classList.add('is-hidden')
        } else {
            document.getElementById('directory').classList.remove('is-hidden')
        }
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
                        m(dlInputField, {
                            label: 'URL', icon: 'fas fa-link', placeholder: 'e.g. https://youtu.be/UKT5_l324wg', value: dl.url,
                            oninput: event => {
                                dl.url = event.target.value

                                // Get all input field elements. Convert htmlCollection to Array.
                                var inputFields = Array.from(document.getElementsByClassName('control'))

                                // Add loading spinner to all input fields
                                inputFields.forEach(item => item.classList.add('is-loading'))

                                getThumbnail(dl.url).then(res => {
                                    dl.thumbnail = res

                                    // Remove loading spinner on url field
                                   event.target.parentElement.classList.remove('is-loading')
                                })

                                // Passed object's parameters are assigned values, rather than promise returning primitives
                                getMetadata(dl.url, dl).then(res => {
                                    // Remove loading spinners on input all fields
                                    inputFields.forEach(item => item.classList.remove('is-loading'))
                                })
                            }
                        })
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
                            m('img', {style: 'width: auto; margin: auto;', src: dl.thumbnail})
                        ])
                    ]),
                    m(dlInputField, {
                        label: 'File Name', icon: 'fas fa-file', placeholder: 'e.g. Rootkit - Taking Me Higher', value: dl.fileName,
                        oninput: event => dl.fileName = event.target.value
                    }),
                    m('div', {class: 'field'}, [
                        m('label', {class: 'label'}, 'Type'),
                        m(typeButtons)
                    ]),
                    m('div', {id: 'tags', class: 'field is-hidden'}, [
                        m(dlInputField, {
                            label: 'Artist', icon: 'fas fa-music', placeholder: 'e.g. Rootkit', value: dl.tags.artist,
                            oninput: event => dl.tags.artist = event.target.value
                        }),
                        m(dlInputField, {
                            label: 'Title', icon: 'fas fa-music', placeholder: 'e.g. Taking Me Higher', value: dl.tags.title,
                            oninput: event => dl.tags.title = event.target.value
                        }),
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
                    m(directory),
                    m(terminalAndDownload, {
                        url: dl.url,
                        fileName: dl.fileName,
                        path: directory.path,
                        tags: dl.tags
                    })
                ])
            ])
        ])
    ])
}