import m from 'mithril'

function tab(vnode) {
    setTimeout(() => {
        // Get the window location after "#!/" to match against the id's of anchor elements.
        // Anchor's id must match url path (href).
        var location = window.location.hash.split('/')[1]
    
        // Default to a specific tab when hashbang is missing or doesn't have a path after it
        if (location == '' || location === undefined) {
            location = 'single'
        }
    
        // Get tab list item elements in navbar
        const el = vnode.dom.children[0].children
    
        // Remove highlight from all tabs
        Array.from(el).forEach(item => {
            item.classList.remove('is-active')
        })
    
        // Add highlight to current tab
        el[location].classList.add('is-active')
    }, 10)
}

export default {
    oncreate: vnode => {
        window.onhashchange = tab(vnode)
    },
    view: vnode => m('div', {class: 'tabs is-centered', style: 'margin: 0'}, m('ul', [
        m('li', {id: 'single'}, m(m.route.Link, {onclick: () => tab(vnode), href: '/'}, [
            m('span', {class: 'icon is-small'}, m('i', {class: 'fas fa-square'})),
            m('span', 'Single')
        ])),
        m('li', {id: 'playlist'}, m(m.route.Link, {onclick: () => tab(vnode), href: '/playlist'}, [
            m('span', {class: 'icon is-small'}, m('i', {class: 'fas fa-th-large'})),
            m('span', 'Playlist')
        ])),
        m('li', {id: 'settings'}, m(m.route.Link, {onclick: () => tab(vnode), href: '/settings'}, [
            m('span', {class: 'icon is-small'}, m('i', {class: 'fas fa-cog'})),
            m('span', 'Settings')
        ]))
    ]))
}