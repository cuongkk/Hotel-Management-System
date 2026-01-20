document.addEventListener('DOMContentLoaded', function () {
    document.addEventListener('click', function (e) {
        const target = e.target;
        const menuBtn = target.closest('.room-menu-btn');
        const dropdown = target.closest('.room-menu-dropdown');

        if (menuBtn) {
            e.preventDefault();
            e.stopPropagation();

            const currentDropdown = menuBtn.nextElementSibling;

            document.querySelectorAll('.room-menu-dropdown').forEach(d => {
                if (d !== currentDropdown) d.classList.add('hidden');
            });

            currentDropdown.classList.toggle('hidden');
        }

        else if (!dropdown) {
            document.querySelectorAll('.room-menu-dropdown').forEach(d => {
                d.classList.add('hidden');
            });
        }
    });
});