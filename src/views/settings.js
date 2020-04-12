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
    view: () => [
        m('div', {class: 'container'}, m('div', {class: 'section'}, [
            m('div', {class: 'columns is-centered'}, [
                m('div', {class: 'column is-narrow'}, [
                    m('div', {class: 'box'}, [
                        m('label', {class: 'label'}, 'Versions'),
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
                        }, 'Update youtube-dl'),
                        m('a', {
                            class: 'button field is-fullwidth',
                            onclick: vnode => {
                                vnode.target.classList.add('is-loading')
                                m.request({
                                    method: 'DELETE',
                                    responseType: 'json',
                                    url: '/api/thumbnail'
                                }).then(response => {
                                    vnode.target.classList.remove('is-loading')
                                }).catch(e => console.error(e))
                            }
                        }, 'Clear thumbnail cache')
                    ])
                ]),
                m('div', {class: 'column is-narrow is-unselectable'}, [
                    m('div', {class: 'box'}, [
                        m('div', {class: 'field'}, [
                            m('label', {class: 'label'}, 'Download mode'),
                            m('div', {id: 'buttons', class: 'field is-grouped'}, [
                                m('a', {
                                    id: 'browser',
                                    class: 'button is-fullwidth' + (app.prefs.dlMode == 'browser' ? ' is-info' : ''),
                                    style: 'margin-right: 0.2em',
                                    onclick: event => {
                                        app.prefs.dlMode = 'browser'
                                        m.request({
                                            method: 'PUT',
                                            responseType: 'json',
                                            url: '/api/settings?dlMode=browser'
                                        }).then(response => {}).catch(e => console.error(e))
                                    }
                                }, 'Browser'),
                                m('a', {
                                    id: 'directory',
                                    class: 'button is-fullwidth' + (app.prefs.dlMode == 'directory' ? ' is-info' : ''),
                                    onclick: event => {
                                        app.prefs.dlMode = 'directory'
                                        m.request({
                                            method: 'PUT',
                                            responseType: 'json',
                                            url: '/api/settings?dlMode=directory'
                                        }).then(response => {}).catch(e => console.error(e))
                                    }
                                }, 'Directory')
                            ])
                        ])
                    ])
                ])
            ])
        ]))
    ]
}