import m from 'mithril'
import { app } from '../main'

const state = {
    version: {},
    cookies: '',
    cookiesModal: false,
    updatingYdl: false
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

// Component for on/off toggles
const toggle = {
    view: vnode => m('div', {
        class: 'field has-tooltip-multiline' + (vnode.attrs.env ? ' controlled-by-env' : ''),
        style: 'display: flex',
        'data-tooltip': vnode.attrs.tooltip
    }, [
        m('span', {style: 'flex: 1; margin-right: 1em'}, vnode.attrs.label),
        m('input', {id: vnode.attrs.id, type: 'checkbox', class: 'switch is-info is-hidden', checked: vnode.attrs.value == 'true' ? true : false}),
        m('label', {for: vnode.attrs.id, onclick: vnode.attrs.onclick}),
        m(controlledByEnvWarn, {env: vnode.attrs.env})
    ])
}

// Component for input fields
const input = {
    view: vnode => m('div', {
        class: 'field has-tooltip-multiline' + (vnode.attrs.env ? ' controlled-by-env' : ''),
        style: 'display: flex; align-items: center;',
        'data-tooltip': vnode.attrs.tooltip
    }, [
        m('span', {style: 'flex: 1; margin-right: 1em'}, vnode.attrs.label),
        m('input', {class: 'input', style: 'width: 5em', type: 'text', value: vnode.attrs.value, oninput: vnode.attrs.oninput}),
        m(controlledByEnvWarn, {env: vnode.attrs.env})
    ])
}

// Component to overlay warning text on setting when controlled by environment variable
const controlledByEnvWarn = {
    view: vnode => m('span', {
        class: 'controlled-by-env-warn has-text-weight-bold' + (vnode.attrs.env ? '' : ' is-hidden'),
        style: 'position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);',
    }, 'Controlled by env')
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
    view: () => [
        m('div', {class: 'columns is-centered'}, [
            // Info area
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
            // Settings buttons
            m('div', {class: 'column is-narrow is-unselectable'}, [
                m('div', {class: 'box'}, [
                    m('div', {class: 'field' + (app.env.MODE ? ' controlled-by-env' : '')}, [
                        m('span', 'Download mode'),
                        m('div', {class: 'field is-grouped'}, [
                            m('a', {
                                class: 'button is-fullwidth' + (app.prefs.mode == 'browser' ? ' is-info' : ''),
                                style: 'margin-right: 0.2em',
                                onclick: event => {
                                    app.prefs.mode = 'browser'
                                    m.request({
                                        method: 'PUT',
                                        url: '/api/settings',
                                        params: {mode: 'browser'}
                                    }).catch(e => console.error(e))
                                }
                            }, [
                                m('span', {class: 'icon'}, m('i', {class: 'fas fa-globe'})),
                                m('span', 'Browser')
                            ]),
                            m('a', {
                                class: 'button is-fullwidth' + (app.prefs.mode == 'directory' ? ' is-info' : ''),
                                onclick: event => {
                                    app.prefs.mode = 'directory'
                                    m.request({
                                        method: 'PUT',
                                        url: '/api/settings',
                                        params: {mode: 'directory'}
                                    }).catch(e => console.error(e))
                                }
                            }, [
                                m('span', {class: 'icon'}, m('i', {class: 'fas fa-list'})),
                                m('span', 'Directory')
                            ])
                        ]),
                        m(controlledByEnvWarn, {env: app.env.MODE})
                    ]),
                    m('a', {
                        class: 'button field is-fullwidth' + (state.updatingYdl ? ' is-loading' : ''),
                        onclick: event => {
                            state.updatingYdl = true

                            m.request({
                                method: 'GET',
                                responseType: 'json',
                                url: '/api/update/ydl'
                            }).then(response => {
                                state.updatingYdl = false
                                getYdlVersion()
                            }).catch(e => console.error(e))
                        }
                    }, [
                        m('span', {class: 'icon'}, m('i', {class: 'fas fa-sync'})),
                        m('span', 'Update youtube-dl')
                    ]),
                    m('a', {
                        class: 'button field is-fullwidth',
                        onclick: event => {
                            m.request({
                                method: 'GET',
                                responseType: 'text',
                                url: '/api/cookies'
                            }).then(response => {
                                state.cookies = response
                            }).catch(e => console.error(e))

                            state.cookiesModal = true
                        }
                    }, [
                        m('span', {class: 'icon'}, m('i', {class: 'fas fa-file-import'})),
                        m('span', 'Import cookies')
                    ])
                ])
            ]),
            // Settings toggles & inputs
            m('div', {class: 'column is-narrow is-unselectable'}, [
                m('div', {class: 'box'}, [
                    m(toggle, {
                        id: 'embedThumbnail', label: 'Embed thumbnails',
                        tooltip: 'Embed thumbnail as cover art for audio downloads',
                        env: app.env.EMBED_THUMBNAIL, value: app.prefs.embedThumbnail,
                        onclick: event => {
                            // Toggle state
                            if (app.prefs.embedThumbnail == 'true') {
                                app.prefs.embedThumbnail = 'false'
                            } else if (app.prefs.embedThumbnail == 'false') {
                                app.prefs.embedThumbnail = 'true'
                            }
                    
                            m.request({
                                method: 'PUT',
                                url: '/api/settings',
                                params: {embedThumbnail: app.prefs.embedThumbnail}
                            }).catch(e => console.error(e))
                        }
                    }),
                    m(toggle, {
                        id: 'writeThumbnail', label: 'Write thumbnails',
                        tooltip: 'Write thumbnail as separate image file for video downloads',
                        env: app.env.WRITE_THUMBNAIL, value: app.prefs.writeThumbnail,
                        onclick: event => {
                            // Toggle state
                            if (app.prefs.writeThumbnail == 'true') {
                                app.prefs.writeThumbnail = 'false'
                            } else if (app.prefs.writeThumbnail == 'false') {
                                app.prefs.writeThumbnail = 'true'
                            }
                    
                            m.request({
                                method: 'PUT',
                                url: '/api/settings',
                                params: {writeThumbnail: app.prefs.writeThumbnail}
                            }).catch(e => console.error(e))
                        }
                    }),
                    m(input, {
                        label: 'uid', tooltip: "File's owner for all downloads. Not retroactive.",
                        env: app.env.UID, value: app.prefs.uid,
                        oninput: event => {
                            app.prefs.uid = event.target.value
                    
                            m.request({
                                method: 'PUT',
                                url: '/api/settings',
                                params: {uid: app.prefs.uid}
                            }).catch(e => console.error(e))
                        }
                    }),
                    m(input, {
                        label: 'gid', tooltip: "File's group for all downloads. Not retroactive.",
                        env: app.env.GID, value: app.prefs.gid,
                        oninput: event => {
                            app.prefs.gid = event.target.value
                    
                            m.request({
                                method: 'PUT',
                                url: '/api/settings',
                                params: {gid: app.prefs.gid}
                            }).catch(e => console.error(e))
                        }
                    }),
                    m(input, {
                        label: 'chmod', tooltip: "File permissions for all downloads. File mode bits for the chmod command. Not retroactive.",
                        env: app.env.CHMOD, value: app.prefs.chmod,
                        oninput: event => {
                            app.prefs.chmod = event.target.value
                    
                            m.request({
                                method: 'PUT',
                                url: '/api/settings',
                                params: {chmod: app.prefs.chmod}
                            }).catch(e => console.error(e))
                        }
                    })
                ])
            ])
        ]),
        // Cookies modal
        m('div', {class: 'modal' + (state.cookiesModal ? ' is-active' : '')}, [
            m('div', {class: 'modal-background', onclick: event => state.cookiesModal = false}),
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
                                url: '/api/cookies',
                                params: {cookies: state.cookies}
                            }).catch(e => console.error(e))
                        }
                    })
                ])
            ]),
            m('div', {class: 'modal-close is-large', onclick: event => state.cookiesModal = false, 'aria-label': 'close'})
        ])
    ]
}