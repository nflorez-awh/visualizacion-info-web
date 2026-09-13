class ContextMenu {
  constructor() {
    this.menu = null;
    this.currentTarget = null;
    this.isOpen = false;
    this.init();
  }

  init() {
    this.menu = document.createElement("div");
    this.menu.className = "context-menu";
    this.menu.style.display = "none";
    document.body.appendChild(this.menu);
    
    this.setupEvents();
  }

  setupEvents() {
    const desktop = document.querySelector(".desktop__container");
    
    desktop.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      this.showDesktopMenu(e.clientX, e.clientY);
    });

    const icons = document.querySelectorAll(".desktop__icons .icon");
    icons.forEach((icon) => {
      icon.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.showIconMenu(e.clientX, e.clientY, icon);
      });
    });

    document.addEventListener("contextmenu", (e) => {
      const titlebar = e.target.closest(".window__titlebar");
      if (titlebar) {
        e.preventDefault();
        e.stopPropagation();
        const win = e.target.closest(".window");
        this.showWindowMenu(e.clientX, e.clientY, win);
      }
    });

    document.addEventListener("click", () => this.hide());
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") this.hide();
    });

    this.menu.addEventListener("click", (e) => e.stopPropagation());
  }

  show(x, y, items) {
    this.menu.innerHTML = "";
    
    items.forEach((item) => {
      if (item.separator) {
        const sep = document.createElement("div");
        sep.className = "context-menu__separator";
        this.menu.appendChild(sep);
        return;
      }

      const menuItem = document.createElement("div");
      menuItem.className = "context-menu__item";
      
      if (item.disabled) menuItem.classList.add("disabled");

      if (item.icon) {
        const icon = document.createElement("img");
        icon.src = item.icon;
        icon.className = "context-menu__icon";
        menuItem.appendChild(icon);
      }

      const label = document.createElement("span");
      label.textContent = item.label;
      menuItem.appendChild(label);

      if (item.shortcut) {
        const shortcut = document.createElement("span");
        shortcut.className = "context-menu__shortcut";
        shortcut.textContent = item.shortcut;
        menuItem.appendChild(shortcut);
      }

      if (item.submenu) {
        const arrow = document.createElement("span");
        arrow.className = "context-menu__arrow";
        arrow.textContent = "▶";
        menuItem.appendChild(arrow);
      }

      if (item.onClick && !item.disabled) {
        menuItem.addEventListener("click", () => {
          item.onClick();
          this.hide();
        });
      }

      this.menu.appendChild(menuItem);
    });

    this.positionMenu(x, y);
    this.menu.style.display = "block";
    this.isOpen = true;
  }

  positionMenu(x, y) {
    const menuWidth = 200;
    const menuHeight = this.menu.offsetHeight;
    const winWidth = window.innerWidth;
    const winHeight = window.innerHeight;

    if (x + menuWidth > winWidth) {
      x = winWidth - menuWidth - 10;
    }

    if (y + menuHeight > winHeight) {
      y = winHeight - menuHeight - 10;
    }

    this.menu.style.left = x + "px";
    this.menu.style.top = y + "px";
  }

  hide() {
    this.menu.style.display = "none";
    this.currentTarget = null;
    this.isOpen = false;
  }

  showDesktopMenu(x, y) {
    const items = [
      { label: "Line up Icons", onClick: () => this.arrangeIcons() },
      { separator: true },
      { label: "Refresh", onClick: () => this.refresh() },
      { separator: true },
      { label: "Properties", onClick: () => this.showProperties() }
    ];

    this.show(x, y, items);
  }

  showIconMenu(x, y, icon) {
    this.currentTarget = icon;

    const items = [
      { label: "Open", onClick: () => icon.dispatchEvent(new Event("dblclick")) },
      { separator: true },
      { label: "Delete", onClick: () => this.deleteIcon(icon) },
      { label: "Rename", onClick: () => this.renameIcon(icon) },
      { separator: true },
      { label: "Properties", onClick: () => this.showIconProps(icon) }
    ];

    this.show(x, y, items);
  }

  showWindowMenu(x, y, win) {
    this.currentTarget = win;
    const maximized = win.style.width === "100%";

    const items = [
      { 
        label: "Minimize",
        onClick: () => win.querySelector(".window__btn--minimize").click()
      },
      { 
        label: maximized ? "Restore" : "Maximize",
        onClick: () => win.querySelector(".window__btn--maximize").click()
      },
      { separator: true },
      { 
        label: "Close",
        shortcut: "Alt+F4",
        onClick: () => win.querySelector(".window__btn--close").click()
      }
    ];

    this.show(x, y, items);
  }

  arrangeIcons() {
    const icons = document.querySelectorAll(".desktop__icons .icon");
    const gap = { x: 110, y: 100 };
    const start = { x: 20, y: 20 };

    icons.forEach((icon, i) => {
      const col = Math.floor(i / 6);
      const row = i % 6;
      icon.style.left = start.x + col * gap.x + "px";
      icon.style.top = start.y + row * gap.y + "px";
    });
  }

  refresh() {
    const desktop = document.querySelector(".desktop__container");
    desktop.style.opacity = "0.5";
    setTimeout(() => desktop.style.opacity = "1", 200);
  }

  deleteIcon(icon) {
    const name = icon.querySelector("span").textContent;
    if (!confirm(`Delete "${name}"?`)) return;
    
    icon.style.transition = "opacity 0.3s";
    icon.style.opacity = "0";
    setTimeout(() => icon.remove(), 300);
  }

  renameIcon(icon) {
    const span = icon.querySelector("span");
    const oldName = span.textContent;
    const newName = prompt("New name:", oldName);
    
    if (newName && newName !== oldName) {
      span.textContent = newName;
    }
  }

  showIconProps(icon) {
    const name = icon.querySelector("span").textContent;
    const src = icon.querySelector("img").src;
    const today = new Date().toLocaleDateString();

    if (typeof createWindow === "undefined") return;

    createWindow({
      title: `${name} Properties`,
      icon: src,
      width: 400,
      height: 450,
      content: `
        <div style="padding: 20px; font-family: 'W95Fa', sans-serif;">
          <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 20px;">
            <img src="${src}" style="width: 48px; height: 48px; image-rendering: pixelated;">
            <div>
              <h3 style="margin: 0; font-size: 16px;">${name}</h3>
              <p style="margin: 5px 0 0 0; font-size: 12px; color: #666;">Desktop Icon</p>
            </div>
          </div>
          
          <hr style="border: none; border-top: 1px solid #808080; border-bottom: 1px solid #fff; margin: 20px 0;">
          
          <div style="font-size: 14px;">
            <p><strong>Type:</strong> Application</p>
            <p><strong>Location:</strong> C:\\LambOS\\Desktop</p>
            <p><strong>Size:</strong> 256 KB</p>
            <p><strong>Created:</strong> ${today}</p>
            <p><strong>Modified:</strong> ${today}</p>
          </div>
          
          <hr style="border: none; border-top: 1px solid #808080; border-bottom: 1px solid #fff; margin: 20px 0;">
          
          <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
            <button onclick="this.closest('.window').querySelector('.window__btn--close').click()">OK</button>
            <button onclick="this.closest('.window').querySelector('.window__btn--close').click()">Cancel</button>
          </div>
        </div>
      `
    });
  }

  showProperties() {
    if (typeof createWindow === "undefined") return;

    createWindow({
      title: "Display Properties",
      icon: "./src/icons/control-panel__ico.svg",
      width: 450,
      height: 500,
      content: `
        <div style="padding: 20px; font-family: 'W95Fa', sans-serif;">
          <h3 style="margin: 0 0 15px 0; font-size: 16px;">Display Settings</h3>
          
          <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Background:</label>
            <select style="width: 100%; padding: 4px; font-family: 'W95Fa', sans-serif;">
              <option>Windows 98</option>
              <option>Frieren (Current)</option>
              <option>Bliss</option>
              <option>None</option>
            </select>
          </div>
          
          <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Screen Resolution:</label>
            <select style="width: 100%; padding: 4px; font-family: 'W95Fa', sans-serif;">
              <option>640 x 480</option>
              <option>800 x 600</option>
              <option selected>1024 x 768</option>
              <option>1280 x 1024</option>
            </select>
          </div>
          
          <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Colors:</label>
            <select style="width: 100%; padding: 4px; font-family: 'W95Fa', sans-serif;">
              <option>16 Colors</option>
              <option>256 Colors</option>
              <option>High Color (16 bit)</option>
              <option selected>True Color (32 bit)</option>
            </select>
          </div>
          
          <hr style="border: none; border-top: 1px solid #808080; border-bottom: 1px solid #fff; margin: 20px 0;">
          
          <div style="display: flex; justify-content: flex-end; gap: 10px;">
            <button onclick="alert('Settings applied!'); this.closest('.window').querySelector('.window__btn--close').click()">OK</button>
            <button onclick="this.closest('.window').querySelector('.window__btn--close').click()">Cancel</button>
            <button onclick="alert('Apply clicked!')">Apply</button>
          </div>
        </div>
      `
    });
  }
}

// Init
let contextMenu;

function initContextMenu() {
  contextMenu = new ContextMenu();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initContextMenu);
} else {
  initContextMenu();
}

window.ContextMenu = ContextMenu;
window.contextMenu = contextMenu;