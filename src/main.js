import m from 'mithril'
import io from 'socket.io-client'
import navbar from './components/navbar'
import download from './views/download'
import playlist from './views/playlist'
import settings from './views/settings'
import directory from './components/directoryBrowser'

// App's settings/preferences. Global app state. Singleton class.
class Settings {
    set(prefs) {
        this.prefs = prefs
    }
}

// Create new instance of class. Export same instance for all imports.
var app = new Settings
export { app }

// Initialize socket for the app
export const socket = io()

// The root mithril component. Used to add static page elements.
const root = {
    view: vnode => [
        m(navbar),
        m('', vnode.children),
        m('footer', {class: 'footer has-background-white'})
    ]
}

m.request({
    method: 'GET',
    responseType: 'json',
    url: '/api/settings'
}).then(response => {
    app.set(response)

    // Initialize directory's folder list on first run
    directory.get()

    // Application routes and their RouteResolvers
    m.route(document.body, '/', {
        '/':            {render: () => m(root, m(download))},
        '/playlist':    {render: () => m(root, m(playlist))},
        '/settings':    {render: () => m(root, m(settings))},
    })

}).catch(e => console.error(e))
