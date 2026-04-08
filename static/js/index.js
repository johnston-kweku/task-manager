import { Alpine } from "alpinejs";

window.Alpine = Alpine;



document.addEventListener('alpine:init', () => {
    Alpine.data('user', () => ({
        count: 10,
        name: 'Johnston',
        search: ''
    }))
})

Alpine.start()