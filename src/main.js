import m from 'mithril'
import {navbar} from './components/navbar'
import {download} from './components/download'
import {settings} from './components/settings'

function appRoute(c) {
    return {
        view: () => [
            m(navbar),
            m(c),
        ]
    }
}

m.route(document.body, '/', {
    '/':            appRoute(download),
    '/settings':    appRoute(settings),
})