import m from 'mithril'
import { app } from '../main' // Singleton class for app settings

function set(vnode, event) {
    const el = vnode.dom.children['buttons'].children
    
    // Get type of clicked button based on its id
    const type = event.target.id.toLowerCase()
    
    // Update style of buttons
    switch(type) {
        case 'audio':
            el['audio'].classList.add('is-info')
            el['video'].classList.remove('is-info')
            document.getElementById('tags').classList.remove('is-hidden')
            break
        case 'video':
            el['audio'].classList.remove('is-info')
            el['video'].classList.add('is-info')
            document.getElementById('tags').classList.add('is-hidden')
            break
    }

    // Set type in app settings
    app.prefs.dlType = type

    // Save selected type
    m.request({
        method: 'PUT',
        responseType: 'json',
        url: `/api/settings?dlType=${type}`
    }).then(response => {}).catch(e => console.error(e))
}

export default {
    oncreate: vnode => {
        if(app.prefs.dlType == 'audio') {
            document.getElementById('tags').classList.remove('is-hidden')
        } else {
            document.getElementById('tags').classList.add('is-hidden')
        }
    },
    view: vnode => m('div', {class: 'field'}, [
        m('label', {class: 'label'}, 'Type'),
        m('div', {id: 'buttons', class: 'field is-grouped'}, [
            m('a', {
                id: 'audio',
                class: 'button is-fullwidth' + (app.prefs.dlType == 'audio' ? ' is-info' : ''),
                style: 'margin-right: 0.2em',
                onclick: event => set(vnode, event)
            }, 'Audio'),
            m('a', {
                id: 'video',
                class: 'button is-fullwidth' + (app.prefs.dlType == 'video' ? ' is-info' : ''),
                onclick: event => set(vnode, event)
            }, 'Video')
        ])
    ])
}