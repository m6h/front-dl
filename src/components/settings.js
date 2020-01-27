import m from 'mithril'
import io from 'socket.io-client'

const socket = io()
var settings = {}

function getYdlVersion() {
    m.request({
        method: 'GET',
        responseType: 'json',
        url: '/api/version/ydl'
    }).then(response => {
        settings.ydlVersion = response
    }).catch(e => console.error(e))
}

export var settings = {
    oncreate: () => {
        // socket.on('connect', () => {
        //     socket.on('settings_update', data => {
        //         settings = data
        //         m.redraw() // manually trigger mithril redraw to update checkboxes after event
        //     })
        // })
        getYdlVersion()
    },
    view: () => [
        m('div', {class: 'container'}, m('div', {class: 'section'}, [
            m('div', {class: 'columns is-centered'}, [
                m('div', {class: 'column'}, [
                    m('div', {class: 'box'}, [
                        m('div', {class: 'subtitle'}, 'Versions'),
                        m('div', [
                            m('span', 'youtube-dl: '),
                            m('span', {class: 'has-text-success'}, settings.ydlVersion)
                        ])
                    ])
                ]),
                m('div', {class: 'column'}, [
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
                            onclick: vnode => null
                        }, 'Clear thumbnail cache')
                    ])
                ]),
                m('div', {class: 'column'}, [
                    m('div', {class: 'box'}, [
                        m('div', {class: 'field'}, [
                            m('span', {class: 'is-unselectable'}, 'Clear page after download'),
                            m('input', {
                                id: 'autoClear',
                                type: 'checkbox',
                                class: 'switch is-hidden',
                                checked: settings.autoClear,
                            }),
                            m('label', {
                                for: 'autoClear',
                                class: 'is-pulled-right',
                                onclick: vnode => {
                                    // send xhr
                                    switch(!settings.autoClear) {
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