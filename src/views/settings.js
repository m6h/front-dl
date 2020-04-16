import m from 'mithril'
import { app } from '../main' // Singleton class for app settings

var version = {}

function getYdlVersion() {
    m.request({
        method: 'GET',
        responseType: 'json',
        url: '/api/version/ydl'
    }).then(response => {
        version.ydl = response
    }).catch(e => console.error(e))
}

export default {
    oncreate: () => {
        // Get versions
        getYdlVersion()

        m.request({
            method: 'GET',
            responseType: 'json',
            url: '/api/version/ffmpeg'
        }).then(response => {
            version.ffmpeg = response
        }).catch(e => console.error(e))

        m.request({
            method: 'GET',
            responseType: 'json',
            url: '/api/version/atomicparsley'
        }).then(response => {
            version.atomicparsley = response
        }).catch(e => console.error(e))
    },
    view: () => m('div', [
        m('div', {class: 'columns is-centered'}, [
            m('div', {class: 'column is-narrow'}, [
                m('div', {class: 'box'}, [
                    m('div', {class: 'has-text-centered'}, [
                        m('a', {class: 'subtitle', href: 'https://github.com/m6h/front-dl', target: '_blank'}, 'front-dl'),
                        m('div', {style: 'border-bottom: 1px solid; margin-top: 0.5em; margin-bottom: 0.5em;'}),
                        m('label', {class: 'label'}, 'Versions'),
                    ]),
                    m('div', [
                        m('span', 'youtube-dl: '),
                        m('span', {class: 'has-text-success'}, version.ydl)
                    ]),
                    m('div', [
                        m('span', 'ffmpeg: '),
                        m('span', {class: 'has-text-success'}, version.ffmpeg)
                    ]),
                    m('div', [
                        m('span', 'AtomicParsley: '),
                        m('span', {class: 'has-text-success'}, version.atomicparsley)
                    ])
                ])
            ]),
            m('div', {class: 'column is-narrow'}, [
                m('div', {class: 'box'}, [
                    m('a', {
                        class: 'button field is-fullwidth',
                        onclick: vnode => {
                            vnode.target.classList.add('is-loading')
                            m.request({
                                method: 'GET',
                                responseType: 'json',
                                url: '/api/update/ydl'
                            }).then(response => {
                                vnode.target.classList.remove('is-loading')
                                getYdlVersion()
                            }).catch(e => console.error(e))
                        }
                    }, 'Update youtube-dl')
                ])
            ]),
            m('div', {class: 'column is-narrow is-unselectable'}, [
                m('div', {class: 'box'}, [
                    m('div', {class: 'field'}, [
                        m('label', {class: 'label'}, 'Download mode'),
                        m('div', {id: 'buttons', class: 'field is-grouped'}, [
                            m('a', {
                                id: 'browser',
                                class: 'button is-fullwidth' + (app.prefs.mode == 'browser' ? ' is-info' : ''),
                                style: 'margin-right: 0.2em',
                                onclick: event => {
                                    app.prefs.mode = 'browser'
                                    m.request({
                                        method: 'PUT',
                                        responseType: 'json',
                                        url: '/api/settings?mode=browser'
                                    }).then(response => {}).catch(e => console.error(e))
                                }
                            }, [
                                m('span', {class: 'icon'}, m('i', {class: 'fas fa-globe'})),
                                m('span', 'Browser')
                            ]),
                            m('a', {
                                id: 'directory',
                                class: 'button is-fullwidth' + (app.prefs.mode == 'directory' ? ' is-info' : ''),
                                onclick: event => {
                                    app.prefs.mode = 'directory'
                                    m.request({
                                        method: 'PUT',
                                        responseType: 'json',
                                        url: '/api/settings?mode=directory'
                                    }).then(response => {}).catch(e => console.error(e))
                                }
                            }, [
                                m('span', {class: 'icon'}, m('i', {class: 'fas fa-list'})),
                                m('span', 'Directory')
                            ])
                        ])
                    ])
                ])
            ])
        ])
    ])
}