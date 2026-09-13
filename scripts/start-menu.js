class StartMenu {
  constructor() {
    this.open = false;
    this.btn = document.querySelector('.start-btn');
    this.taskbar = document.querySelector('.desktop__taskbar');
    this.menu = null;
    this.setup();
  }

  setup() {
    this.buildMenu();
    this.attachEvents();
  }

  buildMenu() {
    this.menu = document.createElement('div');
    this.menu.className = 'start-menu';
    this.menu.style.display = 'none';
    
    this.menu.innerHTML = `
      <div class="start-menu__sidebar">
        <span class="start-menu__sidebar-text">LambOS 98</span>
      </div>
      
      <div class="start-menu__content">
        <div class="start-menu__item">
          <img src="./src/icons/windows__ico.svg" alt="Programs">
          <span>Programs</span>
          <span class="arrow">▶</span>
        </div>
        
        <div class="start-menu__item">
          <img src="./src/icons/documents__ico.svg" alt="Documents">
          <span>Documents</span>
          <span class="arrow">▶</span>
        </div>
        
        <div class="start-menu__item">
          <img src="./src/icons/control-panel__ico.svg" alt="Settings">
          <span>Settings</span>
          <span class="arrow">▶</span>
        </div>
        
        <div class="start-menu__item">
          <img src="./src/icons/desktop__ico.svg" alt="Find">
          <span>Find</span>
        </div>
        
        <div class="start-menu__separator"></div>
        
        <div class="start-menu__item">
          <img src="./src/icons/windows__ico.svg" alt="Run">
          <span>Run...</span>
        </div>
        
        <div class="start-menu__separator"></div>
        
        <div class="start-menu__item">
          <img src="./src/icons/windows__ico.svg" alt="Shut Down">
          <span>Shut Down...</span>
        </div>
      </div>
    `;
    
    document.body.appendChild(this.menu);
  }

  attachEvents() {
    this.btn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggle();
    });

    document.addEventListener('click', (e) => {
      if (this.open && !this.menu.contains(e.target) && !this.btn.contains(e.target)) {
        this.close();
      }
    });

    window.addEventListener('resize', () => {
      if (this.open) {
        this.updatePosition();
      }
    });

    const items = this.menu.querySelectorAll('.start-menu__item');
    items.forEach(item => {
      item.addEventListener('click', () => {
        const text = item.querySelector('span').textContent;
        
        if (text === 'Shut Down...') {
          this.shutdown();
        }
        
        this.close();
      });
    });
  }

  updatePosition() {
    const rect = this.btn.getBoundingClientRect();
    this.menu.style.left = `${rect.left}px`;
  }

  toggle() {
    this.open ? this.close() : this.showMenu();
  }

  showMenu() {
    this.updatePosition();
    this.menu.style.display = 'flex';
    this.btn.classList.add('active');
    this.open = true;
  }

  close() {
    this.menu.style.display = 'none';
    this.btn.classList.remove('active');
    this.open = false;
  }

  shutdown() {
    alert('It is now safe to turn off your computer');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new StartMenu();
});