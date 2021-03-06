import m from 'mithril'
import { app } from '../main'

export default {
    view: vnode => m('div', {class: 'field' + (app.env.FORMAT ? ' controlled-by-env' : '')}, [
        m('label', {class: 'label'}, 'Format'),
        m('div', {class: 'field is-grouped'}, [
            m('a', {
                class: 'button is-fullwidth' + (app.prefs.format == 'audio' ? ' is-info' : ''),
                style: 'margin-right: 0.2em',
                onclick: event => {
                    app.prefs.format = 'audio'
                    m.request({
                        method: 'PUT',
                        url: '/api/settings',
                        params: {format: 'audio'}
                    }).catch(e => console.error(e))
                }
            }, [
                m('span', {class: 'icon'}, m('i', {class: 'fas fa-music'})),
                m('span', 'Audio')
            ]),
            m('a', {
                class: 'button is-fullwidth' + (app.prefs.format == 'video' ? ' is-info' : ''),
                onclick: event => {
                    app.prefs.format = 'video'
                    m.request({
                        method: 'PUT',
                        url: '/api/settings',
                        params: {format: 'video'}
                    }).catch(e => console.error(e))
                }
            }, [
                m('span', {class: 'icon'}, m('i', {class: 'fas fa-film'})),
                m('span', 'Video')
            ])
        ]),
        m('span', {
            class: 'controlled-by-env-warn has-text-weight-bold' + (app.env.FORMAT ? '' : ' is-hidden'),
            style: 'position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);',
        }, 'Controlled by env')
    ])
}