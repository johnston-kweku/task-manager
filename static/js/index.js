import { Alpine } from "alpinejs";

window.Alpine = Alpine;



document.addEventListener('alpine:init', () => {


    Alpine.data('taskTimer', (initialSeconds) => ({
        secondsLeft:initialSeconds,
        totalSeconds:initialSeconds,
        timerInterval:null,
        isRunning:false,
        isActiv:false,
        priority:'',


        init() {

        },

        start() {
            if(this.isRunning) return;
            this.isRunning = true;
            this.timerInterval = setInterval(() => {
                if(this.secondsLeft > 0) {
                    this.secondsLeft--;
                }else(
                    this.stop()
                )
            }, 1000)
        },

        stop() {
            this.clearInterval(this.timerInterval)
            this.isRunning = false
        },

        formatTime() {
            const h = Math.floor(this.secondsLeft / 3600);
            const m = Math.floor((this.secondsLeft % 3600) / 60);
            const s = Math.floor(this.secondsLeft % 60);
            return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':')
        },

        get percent(){
            return Math.floor((this.secondsLeft / this.totalSeconds) * 100); 
        },

        get offset() {
            const circumference = 691;
            return circumference - (this.secondsLeft / this.totalSeconds) * circumference
        },


        get priorityClasses() {
        const themes = {
            'THREAT_LEVEL_RED': 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]',
            'NODE_VALIDATION': 'border-cyan-500 shadow-[0_0_15px_rgba(0,242,255,0.3)]',
            'GHOST_PROTOCOL': 'border-gray-500 shadow-none'
        };
        return themes[this.priority] || 'border-slate-700';
    },
    }))
})

Alpine.start()
