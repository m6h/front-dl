import m from '../lib/mithril'
var type = ''
var output = ''

function typeSelect(vnode) {
    // remove 'is-info' class from all buttons, then add it to the clicked button
    document.getElementById('t1').classList.remove('is-info')
    document.getElementById('t2').classList.remove('is-info')
    vnode.target.classList.add('is-info')
    type = vnode.target.text
    console.log(vnode)
}

function go() {
    type = type.toLowerCase()
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
                            m('input', {class: 'input', type:'text', placeholder: 'e.g. https://youtu.be/Iy7xDGi5lp4',
                            })
                        ])
                    ]),
                    m('div', {class: 'field'}, [
                        m('label', {class: 'label'}, 'Name'),
                        m('div', {class: 'control has-icons-left'}, [
                            m('span', {class: 'icon is-left'}, [
                                m('i', {class: 'fas fa-file'})
                            ]),
                            m('input', {
                                class: 'input',
                                type:'text',
                                placeholder: 'e.g. ERB - James Bond vs Austin Powers',
                                onkeyup: vnode => output = vnode.target.value
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
                    m('div', {class: 'field'}, [
                        m('label', {class: 'label'}, 'Output'),
                        m('div', {class: 'control has-icons-left'}, [
                            m('span', {class: 'icon is-left'}, [
                                m('i', {class: 'fas fa-save'})
                            ]),
                            m('input', {class: 'input', type:'text', readonly: true, value: output})
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