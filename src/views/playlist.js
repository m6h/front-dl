import m from 'mithril'
import typeButtons from '../components/typeSelect'
import directory from '../components/directoryBrowser'
import terminalAndDownload from '../components/terminalAndDownload'
import { getMetadata, getThumbnail, autofill } from '../components/metadata'

var playlist = {
    entries: []
}

const state = {
    url: '', fileName: '', tableHidden: true, loading: false,
    thumbnail: '/public/images/blank.png',
    tags: {
        artist: '',
        title: '',
        genre: ''
    },
}

// Reusable input field component
const dlInputField = {
    view: vnode => m('div', {class: 'field'}, [
        m('label', {class: 'label'}, vnode.attrs.label),
        m('div', {class: 'control has-icons-left has-icons-right ' + (state.loading ? 'is-loading' : '')}, [
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
    oncreate: () => {
        
    },
    view: vnode => m('div', [
        m('div', {class: 'columns'}, [
            m('div', {class: 'column'}, [
                m(dlInputField, {
                    label: 'URL', icon: 'fas fa-link', placeholder: 'e.g. https://www.youtube.com/playlist?list=PLyBpB3ighZihP_yu9gkkfEnIbhXW7ziGT', value: state.url,
                    oninput: event => {
                        state.url = event.target.value

                        // Add loading spinner to each input field
                        state.loading = true

                        getMetadata(state.url).then(res => {
                            if (res._type == 'playlist') {
                                // Unhide table
                                state.tableHidden = false

                                playlist = res

                                // autofill(res, state)
                            }

                            // Remove loading spinner from input fields
                            state.loading = false
                        })
                    }
                }),
                m(typeButtons),
                m(terminalAndDownload, {
                    url: state.url,
                    fileName: state.fileName,
                    path: directory.path,
                    tags: state.tags
                })
            ]),
            m('div', {class: 'column'}, [
                m(directory),
            ])
        ]),
        m('div', {id: 'tags', class: 'is-hidden'}, [
            m('span', 'tags')
        ]),
        m('table', {id: 'table', class: 'table ' + (state.tableHidden ? 'is-hidden' : '')}, [
            m('thead', [
                m('th'),
                m('th', {style: 'width: 160px'}),
                m('th', 'File Name'),
            ]),
            m('tbody', [
                playlist.entries.map((item, index) => m('tr', [
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
                    m('td', {style: 'vertical-align: middle'}, item ? item.title : 'Unknown')
                ]))
            ])
        ])
    ])
}