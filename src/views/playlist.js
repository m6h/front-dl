import m from 'mithril'
import { app } from '../main'
import formatButtons from '../components/formatSelect'
import directory from '../components/directoryBrowser'
import terminalAndDownload from '../components/terminalAndDownload'
import { getMetadata, getThumbnail } from '../components/metadata'

const state = {
    url: '', playlistEntries: [], playlistName: '', loading: false,
    tableHidden: true,
    defaultOutputTemplate: '%(playlist_index)s - %(title)s.%(ext)s'
}

// Reusable input field component
const dlInputField = {
    view: vnode => m('div', {class: 'field'}, [
        m('label', {class: 'label'}, vnode.attrs.label),
        m('div', {class: 'control has-icons-left has-icons-right' + (state.loading ? ' is-loading' : '')}, [
            m('span', {class: 'icon is-left'}, m('i', {class: vnode.attrs.icon})),
            m('input', {
                class: 'input',
                type:'text',
                placeholder: vnode.attrs.placeholder,
                value: vnode.attrs.value,
                oninput: vnode.attrs.oninput,
                onfocus: vnode.attrs.onfocus,
                onblur: vnode.attrs.onblur
            })
        ]),
        vnode.children
    ])
}

export default {
    view: vnode => [
        m('article', {class: 'message is-info' + (app.prefs.mode == 'directory' ? ' is-hidden' : '')}, [
            // Message if in Browser download mode
            m('div', {class: 'message-body'}, 'Playlists are currently only supported in Directory download mode')
        ]),
        m('div', {class: 'columns' + (app.prefs.mode == 'directory' ? '' : ' is-hidden')}, [
            m('div', {class: 'column'}, [
                m(dlInputField, {
                    label: 'URL', icon: 'fas fa-link', placeholder: 'e.g. https://www.youtube.com/playlist?list=PLy5DTsT7EPziGT9nRfiWU1g7Nig6VQbhX', value: state.url,
                    oninput: event => {
                        state.url = event.target.value

                        // Add loading spinner to each input field
                        state.loading = true

                        getMetadata(state.url).then(res => {
                            if (res && res._type == 'playlist') {
                                // Playlist Name
                                res.title ? state.playlistName = res.title : state.playlistName = ''
                                res.entries ? state.playlistEntries = res.entries : null
                            }

                            state.loading = false
                            state.tableHidden = false
                        })
                    }
                }),
                m(dlInputField, {
                    label: 'Playlist Name', icon: 'fas fa-file', value: state.playlistName,
                    oninput: event => {
                        state.playlistName = event.target.value
                    }
                }),
                m(formatButtons),
                m('article', {class: 'message is-info is-small'}, [
                    m('div', {class: 'message-body'}, 'Note: fetching metadata for playlists can be slow')
                ]),
            ]),
            m('div', {class: 'column'}, [
                m(directory),
                m(terminalAndDownload, {
                    type: 'playlist',
                    url: state.url,
                    playlistEntries: state.playlistEntries,
                    playlistName: state.playlistName,
                    path: directory.path
                })
            ])
        ]),
        m('table', {id: 'table', class: 'table' + (state.tableHidden ? ' is-hidden' : ''), style: 'width: 100%'}, [
            m('thead', [
                m('th'),
                m('th', {style: 'width: 160px'}),
                m('th'),
            ]),
            m('tbody', [
                state.playlistEntries.map((item, index) => m('tr', [
                    m('th', {style: 'vertical-align: middle; text-align: center'}, index + 1),
                    m('td', {style: 'vertical-align: middle'}, [
                        m('div', {class: 'box', style: 'padding: 0'}, [
                            m('figure', {class: 'image is-16by9'}, [
                                m('span', {
                                    class: 'has-text-weight-light is-unselectable',
                                    style: `position: absolute;
                                            top: 50%;
                                            left: 50%;
                                            transform: translate(-50%, -50%);`,
                                }, 'Thumbnail'),
                                m('img', {style: 'width: auto; margin: auto;', src: getThumbnail(item)})
                            ])
                        ])
                    ]),
                    m('td', {style: 'vertical-align: middle'}, item.title ? item.title : 'Unknown')
                ]))
            ])
        ])
    ]
}