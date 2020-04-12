import m from 'mithril'
import navbar from './components/navbar'
import download from './views/download'
import playlist from './views/playlist'
import settings from './views/settings'
import directory from './components/directoryBrowser'

// App's global settings/preferences state.
export const app = {
    prefs: {}
}

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
    app.prefs = response

    // Initialize directory's folder list on first run
    directory.get()

    // Application routes and their RouteResolvers
    m.route(document.body, '/', {
        '/':            {render: () => m(root, m(download))},
        '/playlist':    {render: () => m(root, m(playlist))},
        '/settings':    {render: () => m(root, m(settings))},
    })

}).catch(e => console.error(e))
