import m from '../lib/mithril'
import * as qs from 'querystring'

var dl = {
    url: '', fileName: '', type: '', path: [], directory: [],
    tags: {
        artist: '',
        title: '',
        genre: ''
    },
    fullPath: () => {
        var fullPath = [...dl.path, dl.fileName] // clone dl.path and append dl.fileName
        return fullPath.join('/')
    },
    command: () => {
        if(dl.type == 'audio') {
            return `youtube-dl -f "bestaudio[ext=m4a]" --embed-thumbnail -o "${dl.fullPath()}.m4a" ${dl.url}`
        } else if(dl.type == 'video') {
            return `youtube-dl -f "bestvideo[height<=?1080]+bestaudio" --merge-output-format "mkv" --write-thumbnail -o "${dl.fullPath()}.mkv" ${dl.url}`
        }
    }
}

function typeSelect(vnode) {
    dl.type = vnode.target.innerText.toLowerCase() // equals content of currently selected button

    // remove 'is-info' class from all buttons, then add it to the clicked button
    document.getElementById('t1').classList.remove('is-info')
    document.getElementById('t2').classList.remove('is-info')
    vnode.target.classList.add('is-info')

    // show metadata tag fields if audio is selected
    if(dl.type == 'audio') {
        document.getElementById('tags').classList.remove('is-hidden')
    } else {
        document.getElementById('tags').classList.add('is-hidden')
    }
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

function go() {
    document.getElementById('download').classList.add('is-loading')

    var sendDL = {
        url: dl.url,
        type: dl.type,
        path: dl.fullPath()
    }

    m.request({
        method: 'GET',
        responseType: 'json',
        url: `/api/ydl?${qs.stringify(sendDL)}`
    }).then(response => {
        document.getElementById('download').classList.remove('is-loading')
    }).catch(e => console.error(e))
}

export var download = {
    oninit: () => {
        getDirectory()
    },
    onupdate: () => {
        // If fields have a value then enable download button
        if(dl.url && dl.fileName && dl.type) {
            // if audio then check tag values exist
            if(dl.type == 'audio' && dl.tags.artist && dl.tags.title && dl.tags.genre) {
                goState(true)
            } else if(dl.type == 'video') {
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
                        m('div', {class: 'control has-icons-left'}, [
                            m('span', {class: 'icon is-left'}, m('i', {class: 'fas fa-link'})),
                            m('input', {
                                class: 'input',
                                type:'text',
                                placeholder: 'e.g. https://youtu.be/Iy7xDGi5lp4',
                                value: dl.url,
                                oninput: vnode => dl.url = vnode.target.value
                            })
                        ])
                    ]),
                    m('div', {class: 'field'}, [
                        m('label', {class: 'label'}, 'File Name'),
                        m('div', {class: 'control has-icons-left'}, [
                            m('span', {class: 'icon is-left'}, m('i', {class: 'fas fa-file'})),
                            m('input', {
                                class: 'input',
                                type:'text',
                                placeholder: 'e.g. ERB - James Bond vs Austin Powers',
                                value: dl.fileName,
                                oninput: vnode => dl.fileName = vnode.target.value
                            })
                        ])
                    ]),
                    m('div', {class: 'field'}, [
                        m('label', {class: 'label'}, 'Type'),
                        m('div', {class: 'field is-grouped'}, [
                            m('a', {id: 't1', class: 'button is-fullwidth', onclick: vnode => typeSelect(vnode)}, 'Audio'),
                            m('a', {id: 't2', class: 'button is-fullwidth', onclick: vnode => typeSelect(vnode)}, 'Video')
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
                                    class: 'input',
                                    type:'text',
                                    placeholder: 'e.g. House',
                                    value: dl.tags.genre,
                                    oninput: vnode => dl.tags.genre = vnode.target.value
                                })
                            ])
                        ]),
                    ]),
                ]),
                m('div', {class: 'column'}, [
                    m('nav', {class: 'panel'}, [
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
                        m('label', {class: 'label'}, 'Command'),
                        m('div', {class: 'control has-icons-left'}, [
                            m('span', {class: 'icon is-left'}, m('i', {class: 'fas fa-terminal'})),
                            m('textarea', {
                                class: 'textarea',
                                style:'padding-left: 2.2em',
                                readonly: true,
                                rows: 6,
                                value: dl.command()
                            })
                        ])
                    ]),
                    m('button', {id: 'download', class: 'button is-fullwidth', disabled: 'true', onclick: go}, 'Go')
                ])
            ])
        ])
    ])
}