class DraggableIcon {
  constructor(el) {
    this.icon = el;
    this.dragging = false;
    this.offsetX = 0;
    this.offsetY = 0;
    this.setup();
  }

  setup() {
    this.icon.style.position = 'absolute';
    this.icon.style.cursor = 'pointer';
    
    const rect = this.icon.getBoundingClientRect();
    const parent = this.icon.parentElement.getBoundingClientRect();
    this.icon.style.left = (rect.left - parent.left) + 'px';
    this.icon.style.top = (rect.top - parent.top) + 'px';
    
    this.icon.addEventListener('mousedown', (e) => this.startDrag(e));
    document.addEventListener('mousemove', (e) => this.drag(e));
    document.addEventListener('mouseup', () => this.stopDrag());
  }

  startDrag(e) {
    if (e.button !== 0) return;
    
    this.dragging = true;
    this.icon.classList.add('dragging');
    
    const rect = this.icon.getBoundingClientRect();
    this.offsetX = e.clientX - rect.left;
    this.offsetY = e.clientY - rect.top;
    
    e.preventDefault();
  }

  drag(e) {
    if (!this.dragging) return;
    
    const parent = this.icon.parentElement.getBoundingClientRect();
    
    let x = e.clientX - parent.left - this.offsetX;
    let y = e.clientY - parent.top - this.offsetY;
    
    x = Math.max(0, Math.min(x, parent.width - this.icon.offsetWidth));
    y = Math.max(0, Math.min(y, parent.height - this.icon.offsetHeight - 36));
    
    this.icon.style.left = x + 'px';
    this.icon.style.top = y + 'px';
  }

  stopDrag() {
    this.dragging = false;
    this.icon.classList.remove('dragging');
  }
}

class DraggableWindow {
  constructor(win) {
    this.win = win;
    this.titlebar = win.querySelector('.window__titlebar-content');
    this.dragging = false;
    this.maximized = false;
    this.offsetX = 0;
    this.offsetY = 0;
    this.savedState = null;
    this.setup();
  }

  setup() {
    this.titlebar.addEventListener('mousedown', (e) => this.startDrag(e));
    document.addEventListener('mousemove', (e) => this.drag(e));
    document.addEventListener('mouseup', () => this.stopDrag());
    this.titlebar.addEventListener('dblclick', () => this.toggleMax());
    
    const maxBtn = this.win.querySelector('.window__btn--maximize');
    if (maxBtn) {
      maxBtn.addEventListener('click', () => this.toggleMax());
    }
    
    this.win.addEventListener('mousedown', () => this.focus());
  }

  startDrag(e) {
    if (this.maximized) return;
    
    this.dragging = true;
    this.focus();
    
    const rect = this.win.getBoundingClientRect();
    this.offsetX = e.clientX - rect.left;
    this.offsetY = e.clientY - rect.top;
    
    e.preventDefault();
  }

  drag(e) {
    if (!this.dragging) return;
    
    const desktop = this.win.parentElement.getBoundingClientRect();
    
    let x = e.clientX - desktop.left - this.offsetX;
    let y = e.clientY - desktop.top - this.offsetY;
    
    x = Math.max(0, Math.min(x, desktop.width - this.win.offsetWidth));
    y = Math.max(0, Math.min(y, desktop.height - this.win.offsetHeight - 36));
    
    this.win.style.left = x + 'px';
    this.win.style.top = y + 'px';
  }

  stopDrag() {
    this.dragging = false;
  }

  focus() {
    const windows = document.querySelectorAll('.window');
    let max = 100;
    
    windows.forEach(w => {
      const z = parseInt(window.getComputedStyle(w).zIndex) || 100;
      if (z > max) max = z;
    });
    
    this.win.style.zIndex = max + 1;
  }

  toggleMax() {
    if (this.maximized) {
      this.restore();
    } else {
      this.maximize();
    }
  }

  maximize() {
    const desktop = this.win.parentElement;
    
    this.savedState = {
      left: this.win.style.left,
      top: this.win.style.top,
      width: this.win.style.width,
      height: this.win.style.height
    };
    
    this.win.style.left = '0';
    this.win.style.top = '0';
    this.win.style.width = desktop.clientWidth + 'px';
    this.win.style.height = (desktop.clientHeight - 36) + 'px';
    
    this.maximized = true;
  }

  restore() {
    if (this.savedState) {
      this.win.style.left = this.savedState.left;
      this.win.style.top = this.savedState.top;
      this.win.style.width = this.savedState.width;
      this.win.style.height = this.savedState.height;
    }
    
    this.maximized = false;
  }
}

function initDragDrop() {
  const icons = document.querySelectorAll('.desktop__icons .icon');
  icons.forEach(icon => new DraggableIcon(icon));
  
  const windows = document.querySelectorAll('.window');
  windows.forEach(win => new DraggableWindow(win));
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDragDrop);
} else {
  initDragDrop();
}

window.DraggableIcon = DraggableIcon;
window.DraggableWindow = DraggableWindow;
window.initDragDrop = initDragDrop;