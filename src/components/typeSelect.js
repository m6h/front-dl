import m from 'mithril'
import { app } from '../main' // Singleton class for app settings

function set(vnode, event) {
    const el = vnode.dom.children
    
    // Get type of clicked button based on its id
    const type = event.target.id.toLowerCase()
    
    // Update style of buttons
    switch(type) {
        case 'audio':
            el['audio'].classList.add('is-info')
            el['video'].classList.remove('is-info')
            document.getElementById('tags').classList.remove('is-hidden')
            break
        case 'video':
            el['audio'].classList.remove('is-info')
            el['video'].classList.add('is-info')
            document.getElementById('tags').classList.add('is-hidden')
            break
    }

    // Set type in app settings
    app.prefs.dlType = type

    // Save selected type
    m.request({
        method: 'PUT',
        responseType: 'json',
        url: `/api/settings?dlType=${type}`
    }).then(response => {}).catch(e => console.error(e))
}

export default {
    oncreate: vnode => {
        if(app.prefs.dlType == 'audio') {
            document.getElementById('tags').classList.remove('is-hidden')
        } else {
            document.getElementById('tags').classList.add('is-hidden')
        }
    },
    view: vnode => m('div', {class: 'field is-grouped'}, [
        m('a', {
            id: 'audio',
            class: 'button is-fullwidth' + (app.prefs.dlType == 'audio' ? ' is-info' : ''),
            style: 'margin: 0.1em',
            onclick: event => set(vnode, event)
        }, 'Audio'),
        m('a', {
            id: 'video',
            class: 'button is-fullwidth' + (app.prefs.dlType == 'video' ? ' is-info' : ''),
            style: 'margin: 0.1em',
            onclick: event => set(vnode, event)
        }, 'Video')
    ])
}



// class Type {
//     set(vnode) {
//         // Get type of clicked button based on its id
//         const type = vnode.target.id.toLowerCase()

//         // Set type in app settings
//         app.prefs.dlType = type

//         // Style the buttons
//         this.style(vnode)

//         // Save selected type
//         m.request({
//             method: 'PUT',
//             responseType: 'json',
//             url: `/api/settings?dlType=${type}`
//         }).then(response => {}).catch(e => console.error(e))

//         // Toggle classes on buttons for style
//         var el = vnode.target.parentElement.children
//         switch(type) {
//             case 'audio':
//                 el['audio'].classList.add('is-info')
//                 el['video'].classList.remove('is-info')
//                 document.getElementById('tags').classList.remove('is-hidden')
//                 break
//             case 'video':
//                 el['audio'].classList.remove('is-info')
//                 el['video'].classList.add('is-info')
//                 document.getElementById('tags').classList.add('is-hidden')
//                 break
//         }
//     }

//     view() {
//         return m('div', {class: 'field is-grouped'}, [
//             m('a', {
//                 id: 'audio',
//                 class: 'button is-fullwidth',
//                 style: 'margin: 0.1em',
//                 onclick: vnode => this.set(vnode)
//             }, 'Audio'),
//             m('a', {
//                 id: 'video',
//                 class: 'button is-fullwidth',
//                 style: 'margin: 0.1em',
//                 onclick: vnode => this.set(vnode)
//             }, 'Video')
//         ])
//     }
// }

// // Export as singleton class
// var typeButtons = new Type
// export { typeButtons }