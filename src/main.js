import m from './lib/mithril'
import {navbar} from './components/navbar'
import {download} from './components/download'
import {about} from './components/about'

function appRoute(c) {
    return {
        view: () => [
            m(navbar),
            m(c),
        ]
    }
}

m.route(document.body, '/', {
    '/':        appRoute(download),
    '/about':   appRoute(about),
})