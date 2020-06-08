import m from 'mithril'
import navbar from './components/navbar'
import download from './views/download'
import playlist from './views/playlist'
import settings from './views/settings'
import directory from './components/directoryBrowser'

// App's global settings/preferences state.
export const app = {
    prefs: {},
    env: {}
}

// The root mithril component. Used to add static page elements.
const root = {
    view: vnode => [
        m(navbar),
        m('div', {class: 'container'}, [
            m('div', {class: 'section', style: 'padding-top: 0'}, vnode.children)
        ]),
        m('footer', {class: 'footer has-background-white', style: 'padding-bottom: 10em;'})
    ]
}

async function main() {
    try {
        // Fetch environment variables, and settings from the database.
        app.env = await m.request({method: 'GET', url: '/api/env'})
        app.prefs = await m.request({method: 'GET', url: '/api/settings'})

        // Environment variables have precedence over db/ui settings. If it exists, it overwrites the value in app prefs.
        app.env.MODE ? app.prefs.mode = app.env.MODE : null
        app.env.FORMAT ? app.prefs.format = app.env.FORMAT : null

        // Initialize directory's folder list on first run
        directory.get()

        // Application routes and their RouteResolvers
        m.route(document.body, '/', {
            '/':            {render: () => m(root, m(download))},
            '/playlist':    {render: () => m(root, m(playlist))},
            '/settings':    {render: () => m(root, m(settings))},
        })
    } catch (e) {console.error(e)}
} main()