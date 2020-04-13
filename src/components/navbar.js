import m from 'mithril'

function toggleNavBurger() {
    document.querySelector('.navbar-burger').classList.toggle('is-active')
    document.querySelector('.navbar-menu').classList.toggle('is-active')
}

function highlight(vnode) {
    setTimeout(() => {
        // Get the window location after "#!/" to match against the id's of anchor elements.
        // Anchor's id must match url path (href).
        var location = window.location.hash.split('/')[1]
    
        // If root path is empty string, replace empty string with default tab id
        if (location == '') {
            location = 'single'
        }
    
        // Get tab anchor elements in navbar
        const el = vnode.dom.children[0].children[1].children[0].children
    
        // Remove highlight from all tabs
        Array.from(el).forEach(item => {
            item.classList.remove('has-background-light')
            item.removeAttribute('style')
        })
    
        // Add highlight to current tab
        el[location].classList.add('has-background-light')
        el[location].style.borderTop = '0.15em solid transparent'
        el[location].style.borderBottom = '0.15em solid #209cee'
    }, 10)
}

export default {
    oncreate: vnode => {
        window.onhashchange = highlight(vnode)
    },
    view: vnode => m('nav', {class: 'navbar has-shadow is-unselectable'}, [
        m('div', {class: 'container'}, [
            m('div', {class: 'navbar-brand'} , [
                m(m.route.Link, {class: 'navbar-item', onclick: () => highlight(vnode), href:'/'}, [
                    m('span', {class: 'title'}, 'front-dl')
                ]),
                m('a', {role: 'button', onclick: () => toggleNavBurger(), class: 'navbar-burger'}, [
                    m('span'), m('span'), m('span')
                ])
            ]),
            m('div', {class: 'navbar-menu'}, [
                m('div', {class: 'navbar-start'}, [
                    m(m.route.Link, {id:   'single', class: 'navbar-item has-text-grey-dark', onclick: () => highlight(vnode), href: '/'}, 'Single'),
                    m(m.route.Link, {id: 'playlist', class: 'navbar-item has-text-grey-dark', onclick: () => highlight(vnode), href: '/playlist'}, 'Playlist'),
                    m(m.route.Link, {id: 'settings', class: 'navbar-item has-text-grey-dark', onclick: () => highlight(vnode), href: '/settings'}, 'Settings'),
                ]),
                m('div', {class: 'navbar-end'}, '')
            ])
        ])
    ])
}