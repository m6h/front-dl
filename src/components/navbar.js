import m from 'mithril'

function toggleNavBurger() {
    document.querySelector('.navbar-burger').classList.toggle('is-active')
    document.querySelector('.navbar-menu').classList.toggle('is-active')
}

export default {
    view: () => [
        m('nav', {class: 'navbar has-shadow is-unselectable', style: 'border-top: #209cee 0.3em solid'}, [
            m('div', {class: 'container'}, [
                m('div', {class: 'navbar-brand'} , [
                    m('a', {class: 'navbar-item', href:'#!/'}, [
                        m('a', {class: 'title'}, 'front-dl')
                    ]),
                    m('a', {role: 'button', onclick: toggleNavBurger, class: 'navbar-burger'}, [
                        m('span'), m('span'), m('span')
                    ])
                ]),
                m('div', {class: 'navbar-menu'}, [
                    m('div', {class: 'navbar-start'}, [
                        m('a', {class: 'navbar-item', href: '#!/'}, 'Home'),
                        m('a', {class: 'navbar-item', href: '#!/settings'}, 'Settings'),
                    ]),
                    m('div', {class: 'navbar-end'}, '')
                ])
            ])
        ])
    ]
}