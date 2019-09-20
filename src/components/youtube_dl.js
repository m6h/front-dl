import m from '../lib/mithril'

var count = 0

export var youtube_dl = {
    view: () => m('main', [
        m('h1', 'youtube-dl'),
        m('div', count),
        m('button', {onclick: () => count++}, 'go')
    ])
}