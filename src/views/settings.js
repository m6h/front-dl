import m from 'mithril'
import { app } from '../main'

const state = {
    version: {},
    modal: false,
    cookies: ''
}

function getYdlVersion() {
    m.request({
        method: 'GET',
        responseType: 'json',
        url: '/api/version/ydl'
    }).then(response => {
        state.version.ydl = response
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
            state.version.ffmpeg = response
        }).catch(e => console.error(e))

        m.request({
            method: 'GET',
            responseType: 'json',
            url: '/api/version/atomicparsley'
        }).then(response => {
            state.version.atomicparsley = response
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
                        m('span', {class: 'has-text-success'}, state.version.ydl)
                    ]),
                    m('div', [
                        m('span', 'ffmpeg: '),
                        m('span', {class: 'has-text-success'}, state.version.ffmpeg)
                    ]),
                    m('div', [
                        m('span', 'AtomicParsley: '),
                        m('span', {class: 'has-text-success'}, state.version.atomicparsley)
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
                            m.request({
                                method: 'GET',
                                responseType: 'text',
                                url: '/api/cookies'
                            }).then(response => {
                                state.cookies = response
                            }).catch(e => console.error(e))

                            state.modal = true
                        }
                    }, 'Import cookies')
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
        ]),
        m('div', {class: 'modal' + (state.modal ? ' is-active' : '')}, [
            m('div', {class: 'modal-background', onclick: event => state.modal = false}),
            m('div', {class: 'modal-content'}, [
                m('div', {class: 'box has-text-centered', style: 'padding: 0.5em'}, [
                    m('div', {class: 'label'}, [
                        m('span', 'See '),
                        m('a', {href: 'https://github.com/ytdl-org/youtube-dl#how-do-i-pass-cookies-to-youtube-dl', target: '_blank'}, 'How do I pass cookies to youtube-dl'),
                        m('span', ' and '),
                        m('a', {href: 'https://github.com/ytdl-org/youtube-dl#http-error-429-too-many-requests-or-402-payment-required', target: '_blank'}, 'HTTP Error 429')
                    ]),
                    m('div', {style: 'font-family: monospace'}, '/etc/youtube-dl/cookies'),
                    m('textarea', {
                        class: 'textarea',
                        style: 'white-space: pre; height: 80vh',
                        spellcheck: false,
                        value: state.cookies,
                        oninput: event => {
                            state.cookies = event.target.value

                            // Write cookies to file
                            m.request({
                                method: 'PUT',
                                responseType: 'text',
                                url: `/api/cookies?cookies=${encodeURIComponent(state.cookies)}`
                            }).catch(e => console.error(e))
                        }
                    })
                ])
            ]),
            m('div', {class: 'modal-close is-large', onclick: event => state.modal = false, 'aria-label': 'close'})
        ])
    ])
}