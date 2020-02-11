import m from 'mithril'
import { app } from '../main' // Singleton class for app settings

var version = {}

var tooltips = {
    htmlDownload: "Send downloads to the browser instead of a directory."
}

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
                        m('div', {class: 'subtitle'}, 'Versions'),
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
                            m('span', {class: 'has-tooltip-multiline', 'data-tooltip': tooltips.htmlDownload}, 'Download to browser'),
                            m('input', {id: 'htmlDownload', type: 'checkbox', class: 'switch is-hidden', checked: app.prefs.htmlDownload}),
                            m('label', {
                                for: 'htmlDownload',
                                class: 'is-pulled-right',
                                style: 'margin-left: 1em',
                                onclick: vnode => {
                                    app.prefs.htmlDownload = !app.prefs.htmlDownload
                                    // send xhr
                                    switch(app.prefs.htmlDownload) {
                                        case true:
                                            m.request({
                                                method: 'PUT',
                                                responseType: 'json',
                                                url: '/api/settings?htmlDownload=true'
                                            }).then(response => {}).catch(e => console.error(e))
                                            break
                                        case false:
                                            m.request({
                                                method: 'PUT',
                                                responseType: 'json',
                                                url: '/api/settings?htmlDownload=false'
                                            }).then(response => {}).catch(e => console.error(e))
                                            break
                                    }
                                }
                            })
                        ]),
                        m('div', {class: 'field'}, [
                            m('span', {class: 'is-unselectable'}, 'Clear page after download'),
                            m('input', {id: 'autoClear', type: 'checkbox', class: 'switch is-hidden', checked: app.prefs.autoClear}),
                            m('label', {
                                for: 'autoClear',
                                class: 'is-pulled-right',
                                style: 'margin-left: 1em',
                                onclick: vnode => {
                                    app.prefs.autoClear = !app.prefs.autoClear
                                    // send xhr
                                    switch(app.prefs.autoClear) {
                                        case true:
                                            m.request({
                                                method: 'PUT',
                                                responseType: 'json',
                                                url: '/api/settings?autoClear=true'
                                            }).then(response => {}).catch(e => console.error(e))
                                            break
                                        case false:
                                            m.request({
                                                method: 'PUT',
                                                responseType: 'json',
                                                url: '/api/settings?autoClear=false'
                                            }).then(response => {}).catch(e => console.error(e))
                                            break
                                    }
                                }
                            })
                        ])
                    ])
                ])
            ])
        ]))
    ]
}