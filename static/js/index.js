import { Alpine } from "alpinejs";

window.Alpine = Alpine;



document.addEventListener('alpine:init', () => {


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
                        'Content-Type':'spplication/json'
                    },
                    body:JSON.stringify(this.task)
                });

                if(response.ok) {
                    window.location.reload()
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

    window.triggerAction = async (action) => {
        const taskId = Alpine.store('menu').taskId;
        if(!taskId) return;

        


        Alpine.store('menu').close()

        if(action === 'pause') {
            window.dispatchEvent(new CustomEvent('toggle-active-pause'));
            return;
        }


        const endpoints = {
            'activate':`/tasks/activate/${taskId}/`,
            'complete':`/tasks/complete/${taskId}/`,
            'delete':`/tasks/delete/${taskId}/`
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
                window.location.reload();
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


        open(e, id){
            e.preventDefault()
            this.show = true;
            this.x = e.clientX;
            this.y = e.clientY;
            this.taskId = id
        },
         

        close() {
            this.show = false;
            this.taskId = null
        }
    })


    Alpine.store('chronos', {
        activeTask: {
            id:null,
            isRunning:false,
            offset: 691,
            percent: 0,
            elapsedSeconds: 0,
            syncRate: '0.0',
            secondsLeft: 0,
            totalSeconds: 0
        },
        update(data) {
            this.activeTask = { ...this.activeTask, ...data };
        }
    });


    Alpine.data('taskTimer', (initialSeconds, taskId) => ({
        secondsLeft: initialSeconds,
        elapsedSeconds: 0,
        totalSeconds: initialSeconds || 0,
        timerInterval: null,
        isRunning: false,
        isActive: false,
        priority: '',

        init() {
            const saved = localStorage.getItem(`task_${taskId}_progress`);
            if (saved) {
                const data = JSON.parse(saved);
                this.elapsedSeconds = data.elapsed;
                this.secondsLeft = data.left;

            }


            window.addEventListener('toggle-active-pause', () => {
            if(this.isActive) {
                    this.togglePause();
                }
            })
            this.updateStore();
            window.addEventListener('beforeunload', () => this.persist())
        },

        updateStore() {
            // 1. Ensure percent is treated as a number
            const currentPercent = this.percent; 
            
            // 2. Logic: Start at 75%, and add progress to reach up to ~99%
            // We add (percent * 0.24) so that at 100% progress, we add 24 to 75 = 99%
            const baseSync = 75.0;
            const dynamicSync = baseSync + (currentPercent * 0.24);

            Alpine.store('chronos').update({
                id:taskId,
                isRunning:this.isRunning,
                secondsLeft: this.secondsLeft,
                totalSeconds: this.totalSeconds, 
                elapsedSeconds: this.elapsedSeconds,
                percent: currentPercent,
                offset: this.offset,
                syncRate: dynamicSync.toFixed(1)
            });
        },


        start() {
            if (this.isRunning) return;
            if (this.secondsLeft <= 0) return;
            this.isRunning = true;

            this.timerInterval = setInterval(() => {
                if (this.secondsLeft > 0) this.secondsLeft--;

                this.elapsedSeconds++;

                if(this.elapsedSeconds % 5 === 0) this.persist();

                if (this.isActive) {
                    this.updateStore()
                }
            }, 1000);
        },


        persist() {
            localStorage.setItem(`task_${taskId}_progress`, JSON.stringify({
                elapsed:this.elapsedSeconds,
                left:this.secondsLeft
            }));
        },

        formatActiveTime() {
            const h = Math.floor(this.elapsedSeconds / 3600);
            const m = Math.floor((this.elapsedSeconds % 3600) / 60);
            const s = this.elapsedSeconds % 60;
            return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':')
        },



        stop() {
            if (this.timerInterval) {
                clearInterval(this.timerInterval);
                this.timerInterval = null;
            }
            this.isRunning = false;
        },

        formatTime() {
            const h = Math.floor(this.secondsLeft / 3600);
            const m = Math.floor((this.secondsLeft % 3600) / 60);
            const s = Math.floor(this.secondsLeft % 60);
            return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':')
        },

        get percent() {
            if (!this.totalSeconds || this.totalSeconds === 0) return 0;
            const elapsed = 1 - (this.secondsLeft / this.totalSeconds);
            return Math.max(0, Math.min(100, Math.floor(elapsed * 100)));
        },

        get offset() {
            const circumference = 691;
            if (!this.totalSeconds || this.totalSeconds === 0) return circumference;
            const elapsed = 1 - (this.secondsLeft / this.totalSeconds);
            return Math.max(0, circumference - elapsed * circumference);
        },


        get priorityClasses() {
        const themes = {
            'THREAT_LEVEL_RED': 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]',
            'NODE_VALIDATION': 'border-cyan-500 shadow-[0_0_15px_rgba(0,242,255,0.3)]',
            'GHOST_PROTOCOL': 'border-gray-500 shadow-none'
        };
        return themes[this.priority] || 'border-slate-700';
    },


    // Add this inside Alpine.data('taskTimer', ...)
    pause() {
        this.stop(); // Clears the setInterval
        this.updateStore(); // Ensure UI reflects it's stopped
    },

    resume() {
        if (this.isActive && !this.isRunning) {
            this.start();
        }
    },

    async togglePause() {
        // Only allow pausing the currently active task
        if (!this.isActive) return;
        console.log(this.isActive)

        if (this.isRunning) {
            this.pause();
        } else {
            this.resume();
        }
        

    }
    
    }))
})

Alpine.start()
