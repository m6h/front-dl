import m from 'mithril'

export var settings = {
    view: () => [
        m('div', {class: 'container'}, m('div', {class: 'section'}, [
            m('div', [
                m('div', {class: 'subtitle'}, 'Settings')
            ])
        ]))
    ]
}