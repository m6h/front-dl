import m from 'mithril'
import { app } from '../main' // Singleton class for app settings

function set(vnode, format) {
    const el = vnode.dom.children['buttons'].children
    
    // Update style of buttons
    switch(format) {
        case 'audio':
            el['audio'].classList.add('is-info')
            el['video'].classList.remove('is-info')
            break
        case 'video':
            el['audio'].classList.remove('is-info')
            el['video'].classList.add('is-info')
            break
    }

    // Set format in app settings
    app.prefs.format = format

    // Save selected format
    m.request({
        method: 'PUT',
        responseType: 'json',
        url: `/api/settings?format=${format}`
    }).then(response => {}).catch(e => console.error(e))
}

export default {
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