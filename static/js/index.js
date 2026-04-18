import { Alpine } from "alpinejs";

window.Alpine = Alpine;



document.addEventListener('alpine:init', () => {


    Alpine.store('pageName', {
        page:'',

        setActivePage(pageName) {
            this.page = pageName
        }
    })


    window.fetchPage = async (page, pushToHistory = true) => {
        const url = `/fetch/page/${page}/`;
        const displayUrl = `/${page}/`;
        const mainContainer = document.getElementById('main-container');

        try {
            const response = await fetch(url);
            if (response.ok) {
                const htmlContent = await response.text();

                if (pushToHistory) {
                    history.pushState({ page: page }, page.toUpperCase(), displayUrl);
                }

                document.title = `NEURAL COMMAND - ${page.replace(/([A-Z])/g, ' $1').trim().toUpperCase()}`;
                Alpine.store('pageName').setActivePage(page);

                mainContainer.style.opacity = '0';
                setTimeout(() => {
                    mainContainer.innerHTML = htmlContent;
                    mainContainer.style.opacity = '1';


                    Alpine.discoverUninitializedComponents((el) => {
                        Alpine.initializeComponent(el);
                    });
                    
                    console.log(`WARP_SUCCESS: Entered ${page} sector.`);
                }, 150);
            }
        } catch (error) {
            console.error("LINK_SEVERED: Uplink failure.");
        }
    };




    window.addEventListener('popstate', (event) => {
        if (event.state && event.state.page) {

            window.fetchPage(event.state.page, false);
        } else {
            location.reload(); 
        }
    });


    Alpine.store('taskDetail', {
        on:false,
        isEditing:false,
        task: {
            id:null,
            name:'',
            description:'',
            priority:'',
            duration:''
        },
        open(taskData) {
            this.task = { ...taskData };
            this.on = true
            this.isEditing = false
        },
        close() {
            this.on = false
        },
        

        async save() {
            if(!this.task.id) {
                console.error('Critical Error: Node ID missing from memory.')
                return;
            }
            try {
                const response = await fetch(`/tasks/update/${this.task.id}/`, {
                    method:'POST',
                    headers:{
                        'X-CSRFToken':document.querySelector('[name=csrfmiddlewaretoken]').value,
                        'Content-Type':'application/json'
                    },
                    body:JSON.stringify(this.task)
                });

                if(response.ok) {
                    window.fetchPage(Alpine.store('pageName').page || 'commandCenter')
                    this.isEditing = false;
                    this.on = false
                }
            }catch(error) {
                console.error('Synchronization failure: ',error)
            }
        }
    })

    Alpine.store('modal', {
            on: false,
            open() { this.on = true },
            close() { this.on = false }
        });

    
    window.formatSecondsToTime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':');
    };

    window.speak = (msg) => {
        const message = new SpeechSynthesisUtterance(msg)
        message.rate = 0.8
        window.speechSynthesis.cancel()
        window.speechSynthesis.speak(message)
    }

    window.triggerAction = async (action, extraData = {}) => {
        const taskId = Alpine.store('menu').taskId;
        if(!taskId) return;

        Alpine.store('menu').close()

        if(action === 'activate') {
            window.speak('Node initiated successfully');
            // Optimistic update
            if (extraData.duration) {
                Alpine.store('chronos').activate(taskId, extraData.duration);
            }
        }

        if(action === 'deactivate' || action === 'complete') {
            if (Alpine.store('chronos').activeTask.id == taskId) {
                Alpine.store('chronos').stopTicker();
                // Clear active task if it was this one
                if (action === 'complete' || action === 'deactivate') {
                     Alpine.store('chronos').update({id: null});
                }
            }
            window.speak(action === 'complete' ? 'Node complete' : 'Node severed');
        }

        if(action === 'delete') {
            window.speak('Node terminated successfully');
            if (Alpine.store('chronos').activeTask.id == taskId) {
                Alpine.store('chronos').stopTicker();
                Alpine.store('chronos').update({id: null});
            }
        }

        if (action === 'pause') {
            window.dispatchEvent(new CustomEvent('toggle-active-pause'));
            return;
        }

        if (action === 'restart') {
             if (Alpine.store('chronos').activeTask.id == taskId) {
                 const total = Alpine.store('chronos').activeTask.totalSeconds;
                 Alpine.store('chronos').activate(taskId, total);
             }
             window.speak('Node reinitiated');
             return;
        }


        const endpoints = {
            'activate':`/tasks/activate/${taskId}/`,
            'complete':`/tasks/complete/${taskId}/`,
            'delete':`/tasks/delete/${taskId}/`,
            'deactivate':`/tasks/deactivate/${taskId}/`
        };


        try{
            const response = await fetch(endpoints[action], {
                method:'POST',
                headers: {
                    'X-CSRFToken':document.querySelector('[name=csrfmiddlewaretoken]').value,
                    'Content-Type': 'application/json'
                }
            });
            if (response.ok) {
                window.fetchPage(Alpine.store('pageName').page || 'commandCenter');
            }else {
                console.error('Command execution failed')
            }
        }catch(error) {
            console.error('Connection error: ',error)
        }
    };


    Alpine.store('menu', {
        show:false,
        x:0,
        y:0,
        taskId:null,
        duration: 0,


        open(e, id, duration = 0){
            e.preventDefault()
            this.show = true;
            this.x = e.clientX;
            this.y = e.clientY;
            this.taskId = id;
            this.duration = duration;
        },
         

        close() {
            this.show = false;
            this.taskId = null
        }
    })


    Alpine.store('chronos', {
        activeTask: {
            id: null,
            isRunning: false,
            percent: 0,
            elapsedSeconds: 0,
            secondsLeft: 0,
            totalSeconds: 0,
            syncRate: '0.0',
            startTime: null, // Unix timestamp when started/resumed
            savedElapsed: 0  // Elapsed time before the current "start"
        },

        init() {
            // Rehydrate from localStorage
            const saved = localStorage.getItem('active_task_core');
            if (saved) {
                this.activeTask = { ...this.activeTask, ...JSON.parse(saved) };
                if (this.activeTask.isRunning) {
                    this.startTicker();
                }
            }
        },

        update(data) {
            this.activeTask = { ...this.activeTask, ...data };
            this.persist();
        },

        persist() {
            localStorage.setItem('active_task_core', JSON.stringify(this.activeTask));
        },

        startTicker() {
            if (this.interval) clearInterval(this.interval);
            this.activeTask.isRunning = true;
            this.activeTask.startTime = Date.now();
            
            this.interval = setInterval(() => {
                const now = Date.now();
                const delta = Math.floor((now - this.activeTask.startTime) / 1000);
                
                const currentElapsed = this.activeTask.savedElapsed + delta;
                const currentLeft = Math.max(0, this.activeTask.totalSeconds - currentElapsed);
                
                this.activeTask.elapsedSeconds = currentElapsed;
                this.activeTask.secondsLeft = currentLeft;

                // Progress Calc
                if (this.activeTask.totalSeconds > 0) {
                    this.activeTask.percent = Math.floor((currentElapsed / this.activeTask.totalSeconds) * 100);
                    const baseSync = 75.0;
                    this.activeTask.syncRate = (baseSync + (this.activeTask.percent * 0.24)).toFixed(1);
                }

                if (currentLeft <= 0) {
                    this.stopTicker();
                }
                this.persist();
            }, 1000);
        },

        stopTicker() {
            if (this.interval) clearInterval(this.interval);
            this.interval = null;
            this.activeTask.isRunning = false;
            this.activeTask.savedElapsed = this.activeTask.elapsedSeconds;
            this.persist();
        },

        activate(id, totalSeconds) {
            // If another task was running, stop it
            if (this.activeTask.id && this.activeTask.id !== id) {
                this.stopTicker();
            }
            
            // If it's a new task or reset
            if (this.activeTask.id !== id) {
                this.activeTask = {
                    id: id,
                    isRunning: false,
                    percent: 0,
                    elapsedSeconds: 0,
                    secondsLeft: totalSeconds,
                    totalSeconds: totalSeconds,
                    syncRate: '75.0',
                    startTime: null,
                    savedElapsed: 0
                };
            }
            this.startTicker();
        }
    });


    Alpine.data('taskTimer', (initialSeconds, taskId) => ({
        secondsLeft: initialSeconds,
        totalSeconds: initialSeconds || 0,
        isActive: false,
        priority: '',

        init() {
            // Check if this is the globally active task
            const global = Alpine.store('chronos').activeTask;
            if (global.id == taskId) {
                this.isActive = true;
            }

            // Sync listener for UI updates
            this.$watch('$store.chronos.activeTask', (val) => {
                if (val.id == taskId) {
                    this.isActive = true;
                    this.secondsLeft = val.secondsLeft;
                } else {
                    this.isActive = false;
                }
            });

            window.addEventListener('toggle-active-pause', () => {
                if(this.isActive) {
                    const chronos = Alpine.store('chronos');
                    if (chronos.activeTask.isRunning) chronos.stopTicker();
                    else chronos.startTicker();
                }
            });
        },

        formatActiveTime() {
            const global = Alpine.store('chronos').activeTask;
            const elapsed = (global.id == taskId) ? global.elapsedSeconds : 0;
            const h = Math.floor(elapsed / 3600);
            const m = Math.floor((elapsed % 3600) / 60);
            const s = elapsed % 60;
            return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':')
        },

        formatTime() {
            let displaySeconds = this.secondsLeft;
            const global = Alpine.store('chronos').activeTask;
            if (global.id == taskId) {
                displaySeconds = global.secondsLeft;
            }
            const h = Math.floor(displaySeconds / 3600);
            const m = Math.floor((displaySeconds % 3600) / 60);
            const s = Math.floor(displaySeconds % 60);
            return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':')
        },

        get percent() {
            const global = Alpine.store('chronos').activeTask;
            if (global.id == taskId) return global.percent;
            return 0;
        },

        get offset() {
            const circumference = 691;
            const p = this.percent;
            return circumference - (p / 100) * circumference;
        },

        get isRunning() {
            const global = Alpine.store('chronos').activeTask;
            return global.id == taskId && global.isRunning;
        },

        get priorityClasses() {
            const themes = {
                'THREAT_LEVEL_RED': 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]',
                'NODE_VALIDATION': 'border-cyan-500 shadow-[0_0_15px_rgba(0,242,255,0.3)]',
                'GHOST_PROTOCOL': 'border-gray-500 shadow-none'
            };
            return themes[this.priority] || 'border-slate-700';
        }
    }))
})

Alpine.start()
