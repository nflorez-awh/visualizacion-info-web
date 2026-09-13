class TaskbarClock {
  constructor() {
    this.clockElement = document.querySelector('.taskbar__clock');
    if (this.clockElement) {
      this.init();
    }
  }

  init() {
    this.updateClock();
    // Actualizar cada segundo
    setInterval(() => this.updateClock(), 1000);
  }

  updateClock() {
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes();
    
    // Formato de 12 horas con AM/PM (estilo clásico de Win 98)
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // La hora '0' pasa a ser '12'
    
    const minutesFormatted = minutes < 10 ? '0' + minutes : minutes;
    
    this.clockElement.textContent = `${hours}:${minutesFormatted} ${ampm}`;
  }
}

// Inicializar al cargar el DOM
document.addEventListener('DOMContentLoaded', () => {
  new TaskbarClock();
});