// ── Header show on scroll ──
    window.addEventListener('scroll', () => {
        document.getElementById('header').classList.toggle('visible', window.scrollY > 80);
    });

    // ── Mobile menu ──
    document.getElementById('navToggle').addEventListener('click', () => {
        document.getElementById('mobileMenu').classList.add('active');
    });
    document.getElementById('closeMenu').addEventListener('click', () => {
        document.getElementById('mobileMenu').classList.remove('active');
    });

    // ── Gallery Slider (drag & swipe) ──
    const track = document.getElementById('sliderTrack');
    if (track) {
        let isDown = false, startX = 0, scrollLeft = 0;

        track.addEventListener('mousedown', e => {
            isDown = true;
            track.classList.add('dragging');
            startX = e.pageX - track.offsetLeft;
            scrollLeft = track.scrollLeft;
        });
        track.addEventListener('mouseleave', () => {
            isDown = false;
            track.classList.remove('dragging');
        });
        track.addEventListener('mouseup', () => {
            isDown = false;
            track.classList.remove('dragging');
        });
        track.addEventListener('mousemove', e => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - track.offsetLeft;
            track.scrollLeft = scrollLeft - (x - startX) * 1.5;
        });

        track.addEventListener('touchstart', e => {
            startX = e.touches[0].pageX;
            scrollLeft = track.scrollLeft;
        }, { passive: true });
        track.addEventListener('touchmove', e => {
            track.scrollLeft = scrollLeft - (e.touches[0].pageX - startX);
        }, { passive: true });
    }

    // ── Scroll animations ──
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.benefit-item, .stat-item').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.7s ease, transform 0.7s ease';
        observer.observe(el);
    });