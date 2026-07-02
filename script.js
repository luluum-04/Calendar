class Calendar {
    constructor() {
        this.currentDate = new Date();
        this.currentMonth = this.currentDate.getMonth();
        this.currentYear = this.currentDate.getFullYear();
        this.events = this.loadEvents();
        this.editingEventId = null;
        
        this.initializeDOM();
        this.renderCalendar();
        this.attachEvents();
        this.initPhotoUpload();
    }

    initializeDOM() {
        this.currentMonthDisplay = document.getElementById('currentMonth');
        this.calendarDays = document.getElementById('calendarDays');
        this.eventModal = document.getElementById('eventModal');
        this.eventListModal = document.getElementById('eventListModal');
        this.eventForm = document.getElementById('eventForm');
        this.dayEventsList = document.getElementById('dayEventsList');
        this.dayEventsTitle = document.getElementById('dayEventsTitle');
        
        this.eventIdInput = document.getElementById('eventId');
        this.eventTitleInput = document.getElementById('eventTitle');
        this.eventDateInput = document.getElementById('eventDate');
        this.eventTimeInput = document.getElementById('eventTime');
        this.eventDescriptionInput = document.getElementById('eventDescription');
        this.eventColorInput = document.getElementById('eventColor');
        this.deleteEventBtn = document.getElementById('deleteEventBtn');
        
        this.mainPhoto = document.getElementById('mainPhoto');
        this.photoUpload = document.getElementById('photoUpload');
        this.changePhotoBtn = document.getElementById('changePhotoBtn');
    }

    initPhotoUpload() {
        this.changePhotoBtn.addEventListener('click', () => {
            this.photoUpload.click();
        });

        this.photoUpload.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    this.mainPhoto.src = event.target.result;
                };
                reader.readAsDataURL(file);
            }
        });
    }

    loadEvents() {
        const stored = localStorage.getItem('corkCalendarEvents');
        return stored ? JSON.parse(stored) : [];
    }

    saveEvents() {
        localStorage.setItem('corkCalendarEvents', JSON.stringify(this.events));
    }

    renderCalendar() {
        const firstDay = new Date(this.currentYear, this.currentMonth, 1).getDay();
        const daysInMonth = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();
        const daysInPrevMonth = new Date(this.currentYear, this.currentMonth, 0).getDate();

        const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                           'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        this.currentMonthDisplay.textContent = `${monthNames[this.currentMonth]} ${this.currentYear}`;

        let html = '';
        const today = new Date();

        for (let i = firstDay - 1; i >= 0; i--) {
            const day = daysInPrevMonth - i;
            const date = new Date(this.currentYear, this.currentMonth - 1, day);
            html += this.createDayCell(date, day, true);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(this.currentYear, this.currentMonth, day);
            const isToday = date.toDateString() === today.toDateString();
            html += this.createDayCell(date, day, false, isToday);
        }

        const totalDays = firstDay + daysInMonth;
        const nextMonthDays = (7 - totalDays % 7) % 7;
        for (let day = 1; day <= nextMonthDays; day++) {
            const date = new Date(this.currentYear, this.currentMonth + 1, day);
            html += this.createDayCell(date, day, true);
        }

        this.calendarDays.innerHTML = html;
    }

    createDayCell(date, day, isOtherMonth, isToday = false) {
        const dateStr = date.toISOString().split('T')[0];
        const dayEvents = this.events.filter(e => e.date === dateStr);
        
        let eventsHtml = '';
        const maxDisplay = 2;
        const displayEvents = dayEvents.slice(0, maxDisplay);
        const remaining = dayEvents.length - maxDisplay;

        displayEvents.forEach(event => {
            eventsHtml += `<div class="event-indicator" style="border-color:${event.color || '#c0392b'}; background:${event.color || '#c0392b'}33;">
                ${event.time ? event.time.substring(0,5) + ' ' : ''}${event.title}
            </div>`;
        });

        if (remaining > 0) {
            eventsHtml += `<div class="event-indicator more">+${remaining}</div>`;
        }

        const classes = [
            'day-cell',
            isOtherMonth ? 'other-month' : '',
            isToday ? 'today' : ''
        ].filter(Boolean).join(' ');

        return `
            <div class="${classes}" data-date="${dateStr}" data-day="${day}">
                <div class="day-number">${day}</div>
                ${eventsHtml}
            </div>
        `;
    }

    attachEvents() {
        document.getElementById('prevBtn').addEventListener('click', () => this.changeMonth(-1));
        document.getElementById('nextBtn').addEventListener('click', () => this.changeMonth(1));
        document.getElementById('todayBtn').addEventListener('click', () => this.goToToday());

        document.getElementById('addEventBtn').addEventListener('click', () => this.openAddEventModal());
        
        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', () => this.closeModals());
        });

        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('vintage-modal')) {
                this.closeModals();
            }
        });

        this.calendarDays.addEventListener('click', (e) => {
            const dayCell = e.target.closest('.day-cell');
            if (dayCell) {
                const date = dayCell.dataset.date;
                this.showDayEvents(date);
            }
        });

        this.eventForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveEvent();
        });

        this.deleteEventBtn.addEventListener('click', () => {
            this.deleteEvent();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closeModals();
            if (e.key === 'ArrowLeft') this.changeMonth(-1);
            if (e.key === 'ArrowRight') this.changeMonth(1);
        });
    }

    changeMonth(delta) {
        this.currentMonth += delta;
        if (this.currentMonth > 11) {
            this.currentMonth = 0;
            this.currentYear++;
        } else if (this.currentMonth < 0) {
            this.currentMonth = 11;
            this.currentYear--;
        }
        this.renderCalendar();
    }

    goToToday() {
        const today = new Date();
        this.currentMonth = today.getMonth();
        this.currentYear = today.getFullYear();
        this.renderCalendar();
    }

    openAddEventModal(date = null) {
        this.editingEventId = null;
        document.getElementById('modalTitle').textContent = 'Agregar Evento';
        this.eventForm.reset();
        this.deleteEventBtn.style.display = 'none';
        
        if (date) {
            this.eventDateInput.value = date;
        } else {
            const today = new Date().toISOString().split('T')[0];
            this.eventDateInput.value = today;
        }
        
        this.eventModal.classList.add('show');
    }

    showDayEvents(dateStr) {
        const events = this.events.filter(e => e.date === dateStr);
        const date = new Date(dateStr + 'T00:00:00');
        const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
        this.dayEventsTitle.textContent = `✨ ${date.toLocaleDateString('es', options)}`;
        
        if (events.length === 0) {
            this.dayEventsList.innerHTML = `
                <div style="text-align:center;padding:25px;color:#8a7a6a;font-family:'Playfair Display',serif;">
                    <p style="font-size:16px;margin-bottom:12px;">No hay eventos</p>
                    <p style="font-size:12px;color:#5a4a3a;">Este día está libre...</p>
                    <button onclick="window.calendar.openAddEventModal('${dateStr}')" class="btn btn-primary vintage-primary" style="margin-top:15px;font-size:11px;padding:6px 18px;">
                        + Agregar Evento
                    </button>
                </div>
            `;
        } else {
            let html = '';
            events.forEach(event => {
                html += `
                    <div class="event-item" style="border-left-color:${event.color || '#c0392b'}">
                        <div class="event-info">
                            <div class="event-title">${event.title}</div>
                            ${event.time ? `<div class="event-time">🕐 ${event.time.substring(0,5)}</div>` : ''}
                            ${event.description ? `<div class="event-description">${event.description}</div>` : ''}
                        </div>
                        <div class="event-actions">
                            <button class="edit-btn" onclick="window.calendar.editEvent('${event.id}')">✎</button>
                            <button class="delete-btn" onclick="window.calendar.deleteEventById('${event.id}')">✕</button>
                        </div>
                    </div>
                `;
            });
            this.dayEventsList.innerHTML = html;
        }
        
        this.eventListModal.classList.add('show');
    }

    editEvent(eventId) {
        const event = this.events.find(e => e.id === eventId);
        if (!event) return;

        this.editingEventId = eventId;
        document.getElementById('modalTitle').textContent = 'Editar Evento';
        this.eventIdInput.value = event.id;
        this.eventTitleInput.value = event.title;
        this.eventDateInput.value = event.date;
        this.eventTimeInput.value = event.time || '';
        this.eventDescriptionInput.value = event.description || '';
        this.eventColorInput.value = event.color || '#c0392b';
        this.deleteEventBtn.style.display = 'block';
        
        this.closeModals();
        this.eventModal.classList.add('show');
    }

    saveEvent() {
        const eventData = {
            id: this.eventIdInput.value || Date.now().toString(),
            title: this.eventTitleInput.value.trim(),
            date: this.eventDateInput.value,
            time: this.eventTimeInput.value || '',
            description: this.eventDescriptionInput.value.trim(),
            color: this.eventColorInput.value
        };

        if (!eventData.title || !eventData.date) {
            alert('Por favor, ingresa título y fecha');
            return;
        }

        if (this.editingEventId) {
            const index = this.events.findIndex(e => e.id === this.editingEventId);
            if (index !== -1) {
                this.events[index] = eventData;
            }
            this.editingEventId = null;
        } else {
            this.events.push(eventData);
        }

        this.saveEvents();
        this.renderCalendar();
        this.closeModals();
        this.eventForm.reset();
    }

    deleteEvent() {
        if (this.editingEventId && confirm('¿Eliminar este evento?')) {
            this.events = this.events.filter(e => e.id !== this.editingEventId);
            this.saveEvents();
            this.renderCalendar();
            this.closeModals();
            this.editingEventId = null;
        }
    }

    deleteEventById(eventId) {
        if (confirm('¿Eliminar este evento?')) {
            this.events = this.events.filter(e => e.id !== eventId);
            this.saveEvents();
            this.renderCalendar();
            const date = this.events[0]?.date || new Date().toISOString().split('T')[0];
            this.showDayEvents(date);
        }
    }

    closeModals() {
        this.eventModal.classList.remove('show');
        this.eventListModal.classList.remove('show');
    }
}

const calendar = new Calendar();
window.calendar = calendar;