import m from 'mithril'
import { app } from '../main'

// Use state for all component instances
var path = [] // The path e.g. ['foo', 'bar', 'folder'] = foo/bar/folder
var folders = [] // Array of folder names in the current path.

// Directory is hidden if download mode is Browser
export default {
    // Get list of all folders in path
    get: vnode => {
        m.request({
            method: 'GET',
            responseType: 'json',
            url: `/api/browse?path=${path.join('/')}`
        }).then(response => {
            folders = response.split('/')
            folders.pop() // remove empty last element from using split()
        }).catch(e => console.error(e))
    },
    path: path,
    view: vnode => m('nav', {class: 'panel' + (app.prefs.mode == 'directory' ? '' : ' is-hidden'), style: 'word-break: break-all'}, [
        m('p', {class: 'panel-heading'}, 'Directory'),
        m('div', {class: 'panel-block'}, [
            m('a', {class: 'button is-small', onclick: () => {path.pop(); vnode.state.get(vnode)}}, [
                m('span', {class: 'icon is-small'}, m('i', {class: 'fas fa-arrow-left'})),
            ]),
            m('input', {
                class: 'input is-small',
                type:'text',
                readonly: true,
                placeholder: 'path',
                value: path.join('/')
            })
        ]),
        // Anchor element for each folder. Onclick push folder name to path then refresh list with new path.
        folders.map((item) => m('a', {
            class: 'panel-block is-unselectable',
            onclick: () => {
                path.push(item)
                vnode.state.get(vnode)
            }
        }, [
            m('span', {class: 'panel-icon'}, m('i', {class: 'fas fa-folder'})),
            m('span', `${item}`)
        ]))
    ])
}