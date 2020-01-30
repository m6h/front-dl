import m from 'mithril'

var settings = {}

var tooltips = {
    htmlDownload: "Send downloads to the browser instead of a directory."
}

function getYdlVersion() {
    m.request({
        method: 'GET',
        responseType: 'json',
        url: '/api/version/ydl'
    }).then(response => {
        settings.version.ydl = response
    }).catch(e => console.error(e))
}

export default {
    oninit: () => {
        // Get settings
        m.request({
            method: 'GET',
            responseType: 'json',
            url: '/api/settings'
        }).then(response => {
            settings = response

            // Get versions
            getYdlVersion()

            m.request({
                method: 'GET',
                responseType: 'json',
                url: '/api/version/ffmpeg'
            }).then(response => {
                settings.version.ffmpeg = response
            }).catch(e => console.error(e))

            m.request({
                method: 'GET',
                responseType: 'json',
                url: '/api/version/atomicparsley'
            }).then(response => {
                settings.version.atomicparsley = response
            }).catch(e => console.error(e))

            m.request({
                method: 'GET',
                responseType: 'json',
                url: '/api/version/python'
            }).then(response => {
                settings.version.python = response
            }).catch(e => console.error(e))
        }).catch(e => console.error(e))
    },
    oncreate: () => {

    },
    view: () => [
        m('div', {class: 'container'}, m('div', {class: 'section'}, [
            m('div', {class: 'columns is-centered'}, [
                m('div', {class: 'column is-narrow'}, [
                    m('div', {class: 'box'}, [
                        m('div', {class: 'subtitle'}, 'Versions'),
                        m('div', [
                            m('span', 'youtube-dl: '),
                            m('span', {class: 'has-text-success'}, settings.version.ydl)
                        ]),
                        m('div', [
                            m('span', 'ffmpeg: '),
                            m('span', {class: 'has-text-success'}, settings.version.ffmpeg)
                        ]),
                        m('div', [
                            m('span', 'AtomicParsley: '),
                            m('span', {class: 'has-text-success'}, settings.version.atomicparsley)
                        ]),
                        m('div', [
                            m('span', 'Python: '),
                            m('span', {class: 'has-text-success'}, settings.version.python)
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
                            m('input', {id: 'htmlDownload', type: 'checkbox', class: 'switch is-hidden', checked: settings.htmlDownload}),
                            m('label', {
                                for: 'htmlDownload',
                                class: 'is-pulled-right',
                                style: 'margin-left: 1em',
                                onclick: vnode => {
                                    settings.htmlDownload = !settings.htmlDownload
                                    // send xhr
                                    switch(settings.htmlDownload) {
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
                            m('input', {id: 'autoClear', type: 'checkbox', class: 'switch is-hidden', checked: settings.autoClear}),
                            m('label', {
                                for: 'autoClear',
                                class: 'is-pulled-right',
                                style: 'margin-left: 1em',
                                onclick: vnode => {
                                    settings.autoClear = !settings.autoClear
                                    // send xhr
                                    switch(settings.autoClear) {
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