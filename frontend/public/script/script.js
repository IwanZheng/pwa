const chatMenuIcon = document.getElementById('chat-menu-icon')
chatMenuIcon.addEventListener('click', openSidebar)

const sidebarBack = document.getElementById('sidebar-back-icon')
sidebarBack.addEventListener('click', closeSidebar)

const menuClose = document.getElementById('menu-close-icon')
menuClose.addEventListener('click', closeMenu)

function openSidebar() {
  const sidebar = document.getElementById('sidebar')
  sidebar.style.display = "block"
}

function closeSidebar() {
  const sidebar = document.getElementById('sidebar')
  sidebar.style.display = "none"
}

function closeMenu() {
  const menu = document.getElementById('menu')
  menu.style.display = "none"
}

