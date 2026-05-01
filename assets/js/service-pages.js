// ── Header show on scroll ──
window.addEventListener('scroll', () => {
    const header = document.getElementById('header');
    if (header) header.classList.toggle('visible', window.scrollY > 80);
});

// ── Mobile menu ──
const navToggle = document.getElementById('navToggle');
const mobileMenu = document.getElementById('mobileMenu');
const closeMenu = document.getElementById('closeMenu');
if (navToggle) navToggle.addEventListener('click', () => mobileMenu.classList.add('active'));
if (closeMenu) closeMenu.addEventListener('click', () => mobileMenu.classList.remove('active'));

// ======================= INFINITE LOOP SLIDER (sama seperti home.js) =======================
function initInfiniteSlider(container, options = {}) {
    if (!container) return null;
    
    const {
        itemSelector = '.slider-item',
        autoSlideInterval = 15000,
        getVisibleCards = null,
        gap = 16,
        onItemClick = null
    } = options;

    const track = container.querySelector('.slider-track');
    if (!track) return null;

    let originalItems = Array.from(track.children);
    if (originalItems.length === 0) return null;

    // Beri class slider-item jika belum ada
    originalItems.forEach(item => {
        if (!item.classList.contains('slider-item')) {
            item.classList.add('slider-item');
        }
    });

    // Clone items untuk infinite effect
    const cloneFirst = originalItems.map(item => item.cloneNode(true));
    const cloneLast = originalItems.map(item => item.cloneNode(true));
    cloneLast.forEach(clone => track.appendChild(clone));
    cloneFirst.reverse().forEach(clone => track.prepend(clone));

    const totalItems = track.children.length;
    const realStartIndex = originalItems.length;

    let currentIndex = realStartIndex;
    let startX = 0;
    let currentTranslate = 0;
    let isDragging = false;
    let autoTimer = null;
    let isPaused = false;
    let dragDistance = 0;
    let itemWidth = 0;

    function getVisibleCount() {
        if (getVisibleCards) return getVisibleCards(window.innerWidth);
        const w = window.innerWidth;
        if (w > 1100) return 3;
        if (w > 900) return 2;
        return 1;
    }

    function updateItemWidth() {
        const visible = getVisibleCount();
        const containerWidth = container.clientWidth;
        itemWidth = (containerWidth - (visible - 1) * gap) / visible;
        Array.from(track.children).forEach(item => {
            item.style.flex = `0 0 ${itemWidth}px`;
        });
        return itemWidth;
    }

    function setSliderPosition(instant = false) {
        const translateX = -currentIndex * (itemWidth + gap);
        if (instant) {
            track.style.transition = 'none';
            track.style.transform = `translateX(${translateX}px)`;
            track.offsetHeight;
            track.style.transition = '';
        } else {
            track.style.transform = `translateX(${translateX}px)`;
        }
    }

    function updateIndex() {
        const maxIndex = totalItems - 1;
        if (currentIndex < 1) {
            currentIndex = totalItems - originalItems.length - 1;
            setSliderPosition(true);
        } else if (currentIndex > maxIndex - 1) {
            currentIndex = originalItems.length;
            setSliderPosition(true);
        }
    }

    function nextSlide() {
        if (isDragging) return;
        currentIndex++;
        setSliderPosition();
        setTimeout(() => updateIndex(), 300);
    }

    function prevSlide() {
        if (isDragging) return;
        currentIndex--;
        setSliderPosition();
        setTimeout(() => updateIndex(), 300);
    }

    function startAutoSlide() {
        if (autoTimer) clearInterval(autoTimer);
        autoTimer = setInterval(() => {
            if (!isPaused && !isDragging) {
                nextSlide();
            }
        }, autoSlideInterval);
    }

    function stopAutoSlide() {
        if (autoTimer) clearInterval(autoTimer);
        autoTimer = null;
    }

    function onDragStart(e) {
        if (autoTimer) stopAutoSlide();
        isDragging = true;
        isPaused = true;
        dragDistance = 0;
        const clientX = e.type.includes('mouse') ? e.pageX : e.touches[0].clientX;
        startX = clientX;
        currentTranslate = -currentIndex * (itemWidth + gap);
        track.style.transition = 'none';
        document.addEventListener('mousemove', onDragMove);
        document.addEventListener('mouseup', onDragEnd);
        container.addEventListener('touchmove', onDragMove, { passive: false });
        container.addEventListener('touchend', onDragEnd);
        e.preventDefault();
    }

    function onDragMove(e) {
        if (!isDragging) return;
        const clientX = e.type.includes('mouse') ? e.pageX : e.touches[0].clientX;
        const delta = clientX - startX;
        dragDistance = Math.abs(delta);
        const newTranslate = currentTranslate + delta;
        track.style.transform = `translateX(${newTranslate}px)`;
    }

    function onDragEnd(e) {
        if (!isDragging) return;
        isDragging = false;
        const clientX = e.type === 'mouseup' ? e.pageX : (e.changedTouches[0].clientX);
        const movedX = clientX - startX;
        const threshold = (itemWidth + gap) * 0.2;

        if (Math.abs(movedX) > threshold) {
            if (movedX > 0) {
                currentIndex--;
            } else {
                currentIndex++;
            }
        }

        track.style.transition = '';
        setSliderPosition();
        setTimeout(() => {
            updateIndex();
            isPaused = false;
            if (!autoTimer) startAutoSlide();
        }, 300);

        document.removeEventListener('mousemove', onDragMove);
        document.removeEventListener('mouseup', onDragEnd);
        container.removeEventListener('touchmove', onDragMove);
        container.removeEventListener('touchend', onDragEnd);
    }

    // Cegah klik saat drag
    container.addEventListener('click', (e) => {
        if (dragDistance > 20) {
            e.preventDefault();
            e.stopPropagation();
        }
        dragDistance = 0;
    }, true);

    // Touch click handler
    container.addEventListener('touchend', (e) => {
        if (dragDistance < 20) {
            const targetItem = e.target.closest(itemSelector);
            if (targetItem && onItemClick) {
                onItemClick(targetItem, e);
            }
        }
    }, true);

    container.addEventListener('mousedown', onDragStart);
    container.addEventListener('touchstart', onDragStart, { passive: false });
    container.addEventListener('dragstart', (e) => e.preventDefault());

    container.addEventListener('mouseenter', () => { isPaused = true; });
    container.addEventListener('mouseleave', () => { isPaused = false; });

    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            updateItemWidth();
            setSliderPosition(true);
            updateIndex();
        }, 100);
    });

    // Initialize
    updateItemWidth();
    setSliderPosition(true);
    startAutoSlide();

    return { refresh: () => {
        updateItemWidth();
        setSliderPosition(true);
        updateIndex();
    }};
}

// ========== INITIALIZE GALLERY SLIDER ==========
const galleryContainer = document.querySelector('.gallery-slider-container');
if (galleryContainer) {
    // Lightbox elements
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = lightbox ? lightbox.querySelector('.lightbox-img') : null;
    const closeBtn = lightbox ? lightbox.querySelector('.lightbox-close') : null;

    const onGalleryClick = (item, event) => {
        if (lightbox && lightboxImg && item.tagName === 'IMG') {
            lightbox.classList.add('active');
            lightboxImg.src = item.src;
        }
    };

    if (lightbox && closeBtn) {
        closeBtn.addEventListener('click', () => lightbox.classList.remove('active'));
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) lightbox.classList.remove('active');
        });
    }

    initInfiniteSlider(galleryContainer, {
        itemSelector: '.slider-item',
        autoSlideInterval: 15000,
        gap: 16,
        onItemClick: onGalleryClick
    });
}

// ========== INITIALIZE OTHER SERVICES SLIDER ==========
const otherSliderContainer = document.querySelector('.other-slider-container');
if (otherSliderContainer) {
    const onOtherClick = (item, event) => {
        if (item.tagName === 'A') {
            const href = item.getAttribute('href');
            if (href && href !== '#') {
                window.location.href = href;
            }
        }
    };

    initInfiniteSlider(otherSliderContainer, {
        itemSelector: '.slider-item',
        autoSlideInterval: 15000,
        gap: 3,
        onItemClick: onOtherClick
    });
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