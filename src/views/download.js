import m from 'mithril'
import { app } from '../main' // Singleton class for app settings
import formatButtons from '../components/formatSelect'
import directory from '../components/directoryBrowser'
import terminalAndDownload from '../components/terminalAndDownload'
import { getMetadata, getThumbnail, autofill } from '../components/metadata'

const state = {
    url: '', fileName: '', loading: false,
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
}

// fetch genre suggestions
function getSuggestions() {
    m.request({
        method: 'GET',
        responseType: 'json',
        url: '/api/suggest/genre'
    }).then(response => {
        state.suggest.genres = response

        // Slice array to include only the top 4 results
        state.suggest.genresFiltered = response.slice(0, 4)
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

// Reusable input field component
const dlInputField = {
    view: vnode => m('div', {class: 'field'}, [
        m('label', {class: 'label'}, vnode.attrs.label),
        m('div', {class: 'control has-icons-left has-icons-right ' + (state.loading ? 'is-loading' : '')}, [
            m('span', {class: 'icon is-left'}, m('i', {class: vnode.attrs.icon})),
            m('input', {
                class: 'input',
                type:'text',
                placeholder: vnode.attrs.placeholder,
                value: vnode.attrs.value,
                oninput: vnode.attrs.oninput,
                onfocus: vnode.attrs.onfocus,
                onblur: vnode.attrs.onblur
            })
        ]),
        vnode.children
    ])
}

export default {
    oninit: () => {
        getSuggestions()
    },
    oncreate: () => {
        // If downloading to browser then hide the directory browser
        if (app.prefs.mode == 'browser') {
            document.getElementById('directory').classList.add('is-hidden')
        } else {
            document.getElementById('directory').classList.remove('is-hidden')
        }
    },
    onupdate: () => {
        // If fields have a value then enable download button
        if(state.url && state.fileName && app.prefs.format) {
            // if audio then check tag values exist
            if(app.prefs.format == 'audio' && state.tags.artist && state.tags.title) {
                goState(true)
            } else if(app.prefs.format == 'video') {
                goState(true)
            } else {
                goState(false)
            }
        } else {
            goState(false)
        }
    },
    view: () => m('div', [
        m('div', {class: 'columns'}, [
            m('div', {class: 'column'}, [
                m('div', {class: 'field'}, [
                    m(dlInputField, {
                        label: 'URL', icon: 'fas fa-link', placeholder: 'e.g. https://youtu.be/UKT5_l324wg', value: state.url,
                        oninput: event => {
                            state.url = event.target.value
                            
                            // Add loading spinner to each input field
                            state.loading = true

                            getMetadata(state.url).then(res => {
                                if (res) {
                                    state.thumbnail = getThumbnail(res)
                                    autofill(res, state)
                                }
                                
                                // Remove loading spinner from input fields
                                state.loading = false
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
                        }, 'Thumbnail'),
                        m('img', {style: 'width: auto; margin: auto;', src: state.thumbnail})
                    ])
                ]),
                m(dlInputField, {
                    label: 'File Name', icon: 'fas fa-file', placeholder: 'e.g. Rootkit - Taking Me Higher', value: state.fileName,
                    oninput: event => state.fileName = event.target.value
                }),
                m(formatButtons),
                m('div', {id: 'tags', class: 'field is-hidden'}, [
                    m(dlInputField, {
                        label: 'Artist', icon: 'fas fa-music', placeholder: 'e.g. Rootkit', value: state.tags.artist,
                        oninput: event => state.tags.artist = event.target.value
                    }),
                    m(dlInputField, {
                        label: 'Title', icon: 'fas fa-music', placeholder: 'e.g. Taking Me Higher', value: state.tags.title,
                        oninput: event => state.tags.title = event.target.value
                    }),
                    m(dlInputField, {
                        label: 'Genre', icon: 'fas fa-music', placeholder: 'e.g. House', value: state.tags.genre,
                        oninput: vnode =>  {
                            state.tags.genre = vnode.target.value
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
                            state.suggest.genresFiltered = state.suggest.genres.filter(item => item.name.match(regex)).slice(0, 4)
                        },
                        onfocus: vnode => {
                            document.getElementById('suggest-genres').classList.remove('is-hidden')
                            vnode.target.classList.add('suggestions-field')
                        },
                        onblur: vnode => {
                            document.getElementById('suggest-genres').classList.add('is-hidden')
                            vnode.target.classList.remove('suggestions-field')
                        }
                    }, m('div', {id: 'suggest-genres', class: 'suggestions is-hidden'}, [
                        m('ul', {class: 'box'}, [
                            state.suggest.genresFiltered.map(item => 
                                m('li', {onmousedown: () => state.tags.genre = item.name}, [
                                    m('span', {
                                        class: 'icon',
                                        onmousedown: () => {
                                            // Remove genre from suggestions. Clear input field.
                                            m.request({
                                                method: 'DELETE',
                                                responseType: 'json',
                                                url: `/api/suggest/genre/${item.name}`
                                            }).then(response => {
                                                state.tags.genre = ''
                                                getSuggestions()
                                            }).catch(e => console.error(e))
                                            setTimeout(() => document.getElementById('genre').focus(), 50)
                                        }
                                    }, m('i', {class: 'fas fa-times'})),
                                    m('div', item.name)
                                ])
                            )
                        ])
                    ]))
                ])
            ]),
            m('div', {class: 'column'}, [
                m(directory),
                m(terminalAndDownload, {
                    url: state.url,
                    fileName: state.fileName,
                    path: directory.path,
                    tags: state.tags
                })
            ])
        ])
    ])
}