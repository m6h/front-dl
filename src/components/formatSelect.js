import m from 'mithril'
import { app } from '../main' // Singleton class for app settings

function set(vnode, format) {
    const el = vnode.dom.children['buttons'].children
    
    // Update style of buttons
    switch(format) {
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
    app.prefs.format = format

    // Save selected type
    m.request({
        method: 'PUT',
        responseType: 'json',
        url: `/api/settings?format=${format}`
    }).then(response => {}).catch(e => console.error(e))
}

export default {
    oncreate: vnode => {
        if(app.prefs.format == 'audio') {
            document.getElementById('tags').classList.remove('is-hidden')
        } else {
            document.getElementById('tags').classList.add('is-hidden')
        }
    },
    view: vnode => m('div', {class: 'field'}, [
        m('label', {class: 'label'}, 'Format'),
        m('div', {id: 'buttons', class: 'field is-grouped'}, [
            m('a', {
                id: 'audio',
                class: 'button is-fullwidth' + (app.prefs.format == 'audio' ? ' is-info' : ''),
                style: 'margin-right: 0.2em',
                onclick: event => set(vnode, 'audio')
            }, [
                m('span', {class: 'icon'}, m('i', {class: 'fas fa-music'})),
                m('span', 'Audio')
            ]),
            m('a', {
                id: 'video',
                class: 'button is-fullwidth' + (app.prefs.format == 'video' ? ' is-info' : ''),
                onclick: event => set(vnode, 'video')
            }, [
                m('span', {class: 'icon'}, m('i', {class: 'fas fa-film'})),
                m('span', 'Video')
            ])
        ])
    ])
}