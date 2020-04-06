import m from 'mithril'
import typeButtons from '../components/typeSelect'
import directory from '../components/directoryBrowser'
import terminalAndDownload from '../components/terminalAndDownload'
import { getMetadata, getThumbnail } from '../components/metadata'

var state = {
    url: '', fileName: '',
    thumbnail: '/public/images/blank.png',
    tags: {
        artist: '',
        title: '',
        genre: ''
    },
}

const dlInputField = {
    view: vnode => m('div', {class: 'field'}, [
        m('label', {class: 'label'}, vnode.attrs.label),
        m('div', {class: 'control has-icons-left has-icons-right'}, [
            m('span', {class: 'icon is-left'}, m('i', {class: vnode.attrs.icon})),
            m('input', {
                class: 'input',
                type:'text',
                placeholder: vnode.attrs.placeholder,
                value: vnode.attrs.value,
                oninput: vnode.attrs.oninput
            })
        ])
    ])
}

export default {
    oncreate: () => {
        
    },
    view: () => m('div', {class: 'container'}, [
        m('div', {class: 'section'}, [
            m('div', {class: 'columns'}, [
                m('div', {class: 'column'}, [
                    m(dlInputField, {
                        label: 'URL', icon: 'fas fa-link', placeholder: 'e.g. https://www.youtube.com/playlist?list=PLyBpB3ighZihP_yu9gkkfEnIbhXW7ziGT', value: state.url,
                        oninput: event => {
                            state.url = event.target.value

                            // Get all input field elements. Convert htmlCollection to Array.
                            var inputFields = Array.from(document.getElementsByClassName('control'))

                            // Add loading spinner to all input fields
                            inputFields.forEach(item => item.classList.add('is-loading'))

                            getThumbnail(state.url).then(res => {
                                state.thumbnail = res

                                // Remove loading spinner on url field
                               event.target.parentElement.classList.remove('is-loading')
                            })

                            // Passed object's parameters are assigned values, rather than promise returning primitives
                            getMetadata(state.url, state).then(res => {
                                // Remove loading spinners on input all fields
                                inputFields.forEach(item => item.classList.remove('is-loading'))
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
            ])
        ])
    ])
}