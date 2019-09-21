import m from './lib/mithril'
import {navbar} from './components/navbar'
import {audio} from './components/audio'
import {video} from './components/video'

function appRoute(c) {
    return {
        view: () => [
            m(navbar),
            m(c),
        ]
    }
}

m.route(document.body, '/', {
    '/':        {view: () => m(navbar)},
    '/audio':   appRoute(audio),
    '/video':   appRoute(video),
})