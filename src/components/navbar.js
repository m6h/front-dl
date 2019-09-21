import m from '../lib/mithril'

export var navbar = {
    view: () => [
        m('h1', 'youtube-dl'),
        m('navbar', [
            m('button', 'audio'),
            m('button', 'video'),
        ])
    ]
}