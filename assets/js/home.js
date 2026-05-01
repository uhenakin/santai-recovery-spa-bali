// Header scroll + dynamic state per section
window.addEventListener('scroll', () => {
    const header = document.getElementById('header');
    const scrollY = window.scrollY;

    // Show/hide header
    if (scrollY > 80) header.classList.add('visible');
    else header.classList.remove('visible');

    // Section positions
    const about        = document.getElementById('about');
    const services     = document.getElementById('services');
    const partnerships = document.getElementById('partnerships');
    const contact      = document.getElementById('contact');

    const getTop = el => el ? el.getBoundingClientRect().top + scrollY - 80 : Infinity;

    const aboutTop        = getTop(about);
    const servicesTop     = getTop(services);
    const partnershipsTop = getTop(partnerships);
    const contactTop      = getTop(contact);

    // Remove all states first
    header.classList.remove('state-about', 'state-services', 'state-partnerships', 'state-contact');

    if (scrollY >= contactTop) {
        header.classList.add('state-contact');
    } else if (scrollY >= partnershipsTop) {
        header.classList.add('state-partnerships');
    } else if (scrollY >= servicesTop) {
        header.classList.add('state-services');
    } else if (scrollY >= aboutTop) {
        header.classList.add('state-about');
    }
});

// Smooth anchor + close mobile
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
        const href = anchor.getAttribute('href');
        if (href !== "#" && href !== "#home" && href !== "#services" && href !== "#about" && href !== "#contact") return;
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) target.scrollIntoView({ behavior: 'smooth' });
        document.getElementById('mobileMenu')?.classList.remove('active');
    });
});

// Mobile toggle
const navToggle = document.getElementById('navToggle');
const mobileMenu = document.getElementById('mobileMenu');
const closeMenu  = document.getElementById('closeMenu');
if (navToggle) navToggle.addEventListener('click', () => mobileMenu.classList.add('active'));
if (closeMenu)  closeMenu.addEventListener('click',  () => mobileMenu.classList.remove('active'));

// Intersection Observer for reveal
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity   = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, { threshold: 0.1 });
document.querySelectorAll('.stat-item, .about-content p').forEach(el => {
    el.style.opacity   = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.7s ease, transform 0.7s ease';
    observer.observe(el);
});

// ======================= INFINITE LOOP SLIDER (drag + auto) =======================
(function() {
    const wrapper = document.getElementById('servicesSlider');
    if (!wrapper) return;

    const track = wrapper.querySelector('.slider-track');
    const cards = Array.from(track.children); // original cards
    const cardCount = cards.length;
    if (cardCount === 0) return;

    // Clone cards untuk infinite effect
    const cloneFirst = cards.map(card => card.cloneNode(true));
    const cloneLast = cards.map(card => card.cloneNode(true));
    
    cloneLast.forEach(clone => track.appendChild(clone));          // append clones of first cards
    cloneFirst.reverse().forEach(clone => track.prepend(clone));  // prepend clones of last cards
    
    const totalCards = track.children.length;
    const realStartIndex = cardCount; // index pertama dari kartu asli (setelah clone awal)
    
    let currentIndex = realStartIndex;
    let startX = 0;
    let currentTranslate = 0;
    let isDragging = false;
    let autoSlideInterval = null;
    let isPaused = false;

    function getVisibleCards() {
        const w = window.innerWidth;
        if (w > 1100) return 3;
        if (w > 900)  return 2;
        return 1;
    }

    function getCardWidth() {
        return wrapper.clientWidth / getVisibleCards();
    }
    
    function setSliderPosition(instant = false) {
        const translateX = -currentIndex * getCardWidth();
        if (instant) {
            track.style.transition = 'none';
            track.style.transform = `translateX(${translateX}px)`;
            track.offsetHeight; // force reflow
            track.style.transition = '';
        } else {
            track.style.transform = `translateX(${translateX}px)`;
        }
    }
    
    function updateIndex() {
        const maxIndex = totalCards - 1;
        if (currentIndex < 1) {
            currentIndex = totalCards - cardCount - 1;
            setSliderPosition(true);
        } else if (currentIndex > maxIndex - 1) {
            currentIndex = cardCount;
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
        if (autoSlideInterval) clearInterval(autoSlideInterval);
        autoSlideInterval = setInterval(() => {
            if (!isPaused && !isDragging) {
                nextSlide();
            }
        }, 15000);
    }
    
    function stopAutoSlide() {
        if (autoSlideInterval) clearInterval(autoSlideInterval);
        autoSlideInterval = null;
    }
    
    // Drag handlers
    let dragDistance = 0;
    function onDragStart(e) {
        if (autoSlideInterval) stopAutoSlide();
        isDragging = true;
        isPaused = true;
        dragDistance = 0;
        startX = e.type.includes('mouse') ? e.pageX : e.touches[0].clientX;
        currentTranslate = -currentIndex * getCardWidth();
        track.style.transition = 'none';
        document.addEventListener('mousemove', onDragMove);
        document.addEventListener('mouseup', onDragEnd);
        wrapper.addEventListener('touchmove', onDragMove, { passive: false });
        wrapper.addEventListener('touchend', onDragEnd);
        e.preventDefault();
    }
    
    function onDragMove(e) {
        if (!isDragging) return;
        const x = e.type.includes('mouse') ? e.pageX : e.touches[0].clientX;
        const delta = x - startX;
        dragDistance = Math.abs(delta);
        let newTranslate = currentTranslate + delta;
        track.style.transform = `translateX(${newTranslate}px)`;
    }
    
    function onDragEnd(e) {
        if (!isDragging) return;
        isDragging = false;
        const movedX = (e.type === 'mouseup' ? e.pageX : (e.changedTouches[0].clientX)) - startX;
        const cardWidth = getCardWidth();
        const threshold = cardWidth * 0.2;
        
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
            if (!autoSlideInterval) startAutoSlide();
        }, 300);
        
        document.removeEventListener('mousemove', onDragMove);
        document.removeEventListener('mouseup', onDragEnd);
        wrapper.removeEventListener('touchmove', onDragMove);
        wrapper.removeEventListener('touchend', onDragEnd);
    }
    
    // Block navigation if user was dragging (mouse)
    wrapper.addEventListener('click', (e) => {
        if (dragDistance > 20) {
            e.preventDefault();
            e.stopPropagation();
        }
        dragDistance = 0;
    }, true);

    // Touch: navigasi langsung jika bukan drag
    wrapper.addEventListener('touchend', (e) => {
        if (dragDistance < 20) {
            const card = e.target.closest('a.service-card');
            if (card) window.location.href = card.getAttribute('href');
        }
    }, true);
    
    wrapper.addEventListener('mousedown', onDragStart);
    wrapper.addEventListener('touchstart', onDragStart, { passive: false });
    wrapper.addEventListener('dragstart', (e) => e.preventDefault());
    
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            setSliderPosition(true);
            updateIndex();
        }, 100);
    });
    
    wrapper.addEventListener('mouseenter', () => { isPaused = true; });
    wrapper.addEventListener('mouseleave', () => { isPaused = false; });
    
    // Initialize
    setSliderPosition(true);
    startAutoSlide();
})();