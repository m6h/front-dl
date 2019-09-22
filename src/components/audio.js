import m, { vnode } from '../lib/mithril'
var type = ''

function typeSelect(vnode) {
    vnode.target.classList.toggle('is-info')
    type = vnode.target.text
}

function go() {
    type = type.toLowerCase()
}

export var audio = {
    view: () => m('div', {class: 'container'}, [
        m('div', {class: 'section'}, [
            m('div', {class: 'columns'}, [
                m('div', {class: 'column'}, [
                    m('div', {class: 'field'}, [
                        m('label', {class: 'label'}, 'URL'),
                        m('div', {class: 'control has-icons-left'}, [
                            m('span', {class: 'icon is-left'}, m('i', {class: 'fas fa-link'})),
                            m('input', {class: 'input', type:'text', placeholder: 'e.g. https://youtu.be/Iy7xDGi5lp4'})
                        ])
                    ]),
                    m('div', {class: 'field'}, [
                        m('label', {class: 'label'}, 'Name'),
                        m('div', {class: 'control has-icons-left'}, [
                            m('span', {class: 'icon is-left'}, [
                                m('i', {class: 'fas fa-file'})
                            ]),
                            m('input', {class: 'input', type:'text', placeholder: 'e.g. ERB - James Bond vs Austin Powers'})
                        ])
                    ]),
                    m('div', {class: 'field'}, [
                        m('label', {class: 'label'}, 'Type'),
                        m('div', {class: 'field is-grouped'}, [
                            m('a', {class: 'button is-fullwidth', onclick: vnode => typeSelect(vnode)}, 'Audio'),
                            m('a', {class: 'button is-fullwidth', onclick: vnode => typeSelect(vnode)}, 'Video')
                        ]),
                    ]),
                    m('div', {class: 'field'}, [
                        m('label', {class: 'label'}, 'Output'),
                        m('div', {class: 'control has-icons-left'}, [
                            m('span', {class: 'icon is-left'}, [
                                m('i', {class: 'fas fa-save'})
                            ]),
                            m('input', {id: 'outputFile', class: 'input', type:'text', readonly: true})
                        ])
                    ]),
                    m('a', {class: 'button is-fullwidth', onclick: go}, 'Go')
                ]),
                m('div', {class: 'column'}, [
                    m('nav', {class: 'panel'}, [
                        m('p', {class: 'panel-heading'}, 'Destination'),
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

                ])
            ])
        ])
    ])
}