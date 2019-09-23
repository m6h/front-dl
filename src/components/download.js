import m from '../lib/mithril'

var dl = {
    url: '', title: '', type: '', path: '',
    command: () => {
        if(dl.type == 'audio') {
            return `youtube-dl -f "bestaudio[ext=m4a]" --embed-thumbnail -o "${dl.title}.%(ext)s" ${dl.url}`
        } else if(dl.type == 'video') {
            return `youtube-dl -f "bestvideo[height<=?1080]+bestaudio" --merge-output-format "mkv" --write-thumbnail -o "${dl.title}.%(ext)s" ${dl.url}`
        }
    }
}

function typeSelect(vnode) {
    // remove 'is-info' class from all buttons, then add it to the clicked button
    document.getElementById('t1').classList.remove('is-info')
    document.getElementById('t2').classList.remove('is-info')
    vnode.target.classList.add('is-info')
    dl.type = vnode.target.innerText.toLowerCase() // equals content of currently selected button
}
function go() {
    console.log(dl)
}

export var download = {
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
                        m('label', {class: 'label'}, 'Title'),
                        m('div', {class: 'control has-icons-left'}, [
                            m('span', {class: 'icon is-left'}, m('i', {class: 'fas fa-file'})),
                            m('input', {
                                class: 'input',
                                type:'text',
                                placeholder: 'e.g. ERB - James Bond vs Austin Powers',
                                value: dl.title,
                                oninput: vnode => dl.title = vnode.target.value
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
                    m('nav', {class: 'panel'}, [
                        m('p', {class: 'panel-heading'}, 'Destination'),
                        m('div', {class: 'panel-block'}, [
                            m('a', {class: 'button is-small', onclick: vnode => alert('back')}, [
                                m('span', {class: 'icon is-small'}, m('i', {class: 'fas fa-arrow-left'})),
                            ]),
                            m('input', {
                                class: 'input is-small',
                                type:'text',
                                readonly: true,
                                placeholder: 'path',
                                value: dl.path,
                                oninput: vnode => dl.path = vnode.target.value
                            })
                        ]),
                        m('a', {class: 'panel-block'}, [
                            m('span', {class: 'panel-icon'}, m('i', {class: 'fas fa-folder'})),
                            m('span', 'Folder A')
                        ]),
                        m('a', {class: 'panel-block'}, [
                            m('span', {class: 'panel-icon'}, m('i', {class: 'fas fa-folder'})),
                            m('span', 'Folder B')
                        ]),
                        m('a', {class: 'panel-block'}, [
                            m('span', {class: 'panel-icon'}, m('i', {class: 'fas fa-folder'})),
                            m('span', 'Folder C')
                        ])
                    ]),
                ]),
                m('div', {class: 'column'}, [
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
                    m('a', {class: 'button is-fullwidth', onclick: go}, 'Go')
                ])
            ])
        ])
    ])
}