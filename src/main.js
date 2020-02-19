import m from 'mithril'
import navbar from './components/navbar'
import download from './components/download'
import settings from './components/settings'

// App's settings/preferences. Global app state. Singleton class.
class Settings {
    set(prefs) {
        this.prefs = prefs
    }
}

// Create new instance of class. Export same instance for all imports.
var app = new Settings
export { app }

// Add static page elements before or after main page component
function addStatic(c) {
    return {
        view: () => [
            m(navbar),
            m(c),
            m('footer', {class: 'footer'})
        ]
    }
}

async function main() {

    // Get app settings state from server
    function initSettings() {
        return new Promise((resolve, reject) => {
            m.request({
                method: 'GET',
                responseType: 'json',
                url: '/api/settings'
            }).then(response => {
                app.set(response)
                resolve()
            }).catch(e => reject(e))
        })
    }

    // Wait for settings object to resolve before mithril starts routing
    await initSettings()

    m.route(document.body, '/', {
        '/':            addStatic(download),
        '/settings':    addStatic(settings),
    })

}
main()