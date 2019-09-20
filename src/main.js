import m from './lib/mithril'
import {youtube_dl} from './components/youtube_dl'

function appRoute(c) {
    return {
        view: () => m('div', {id: 'main'}, [
            // m(navbar),
            m(c),
        ])
    }
}

m.route(document.body, '/', {
    '/':        appRoute(youtube_dl),
})