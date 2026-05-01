// Mobile toggle
const navToggle = document.getElementById('navToggle');
const mobileMenu = document.getElementById('mobileMenu');
const closeMenu  = document.getElementById('closeMenu');
if (navToggle) navToggle.addEventListener('click', () => mobileMenu.classList.add('active'));
if (closeMenu)  closeMenu.addEventListener('click',  () => mobileMenu.classList.remove('active'));

// Discount cards reveal
const revealObs = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.1 });
document.querySelectorAll('.discount-card').forEach(el => revealObs.observe(el));

// ── PRICE SLIDER (infinite loop) ──
(function () {
    const wrapper = document.getElementById('priceSlider');
    if (!wrapper) return;

    const track = wrapper.querySelector('.price-slider-track');
    const origCards = Array.from(track.querySelectorAll('.price-card'));
    const N = origCards.length;
    if (N === 0) return;

    const dotsContainer = document.getElementById('priceDots');

    // ── Clone buffer: prepend last N, append first N ──
    // Result: [clone of last N] [originals N] [clone of first N]
    for (let i = N - 1; i >= 0; i--) {
        const cl = origCards[i].cloneNode(true);
        cl.setAttribute('aria-hidden', 'true');
        track.insertBefore(cl, track.firstChild);
    }
    origCards.forEach(c => {
        const cl = c.cloneNode(true);
        cl.setAttribute('aria-hidden', 'true');
        track.appendChild(cl);
    });

    const OFFSET = N; // real cards start at index N
    let cur      = OFFSET;
    let isAnim   = false;
    let autoTimer = null;

    // card step = card width + margin (7px each side = 14px total)
    function cardStep() {
        const card = track.children[0];
        const rect = card.getBoundingClientRect();
        const style = window.getComputedStyle(card);
        const ml = parseFloat(style.marginLeft) || 0;
        const mr = parseFloat(style.marginRight) || 0;
        return rect.width + ml + mr;
    }

    function setTrack(offset, anim) {
        track.style.transition = anim ? 'transform 0.5s cubic-bezier(0.4,0,0.2,1)' : 'none';
        track.style.transform  = 'translateX(' + offset + 'px)';
    }

    function jumpTo(index) {
        cur = index;
        setTrack(-cur * cardStep(), false);
    }

    function slideTo(index) {
        if (isAnim) return;
        isAnim = true;
        cur = index;
        setTrack(-cur * cardStep(), true);
    }

    track.addEventListener('transitionend', () => {
        isAnim = false;
        if (cur < OFFSET) {
            jumpTo(cur + N);
        } else if (cur >= OFFSET + N) {
            jumpTo(cur - N);
        }
        updateDots();
    });

    function next() { slideTo(cur + 1); }
    function prev() { slideTo(cur - 1); }

    // ── Dots ──
    function buildDots() {
        if (!dotsContainer) return;
        dotsContainer.innerHTML = '';
        for (let i = 0; i < N; i++) {
            const d = document.createElement('button');
            d.className = 'price-dot' + (i === 0 ? ' active' : '');
            d.setAttribute('aria-label', 'Slide ' + (i + 1));
            d.addEventListener('click', () => { slideTo(OFFSET + i); resetAuto(); });
            dotsContainer.appendChild(d);
        }
    }

    function updateDots() {
        if (!dotsContainer) return;
        const realIdx = ((cur - OFFSET) % N + N) % N;
        dotsContainer.querySelectorAll('.price-dot').forEach((d, i) => {
            d.classList.toggle('active', i === realIdx);
        });
    }

    // ── Arrow buttons ──
    const btnPrev = document.getElementById('pricePrev');
    const btnNext = document.getElementById('priceNext');
    if (btnPrev) btnPrev.addEventListener('click', () => { prev(); resetAuto(); });
    if (btnNext) btnNext.addEventListener('click', () => { next(); resetAuto(); });

    // ── Auto-advance ──
    function startAuto() { autoTimer = setInterval(next, 15000); }
    function stopAuto()  { clearInterval(autoTimer); }
    function resetAuto() { stopAuto(); startAuto(); }

    // ── Touch ──
    let tx = 0, ty = 0, dx = 0, locked = null, touching = false;

    wrapper.addEventListener('touchstart', e => {
        touching = true; locked = null; dx = 0;
        tx = e.touches[0].clientX;
        ty = e.touches[0].clientY;
        stopAuto();
        setTrack(-cur * cardStep(), false);
    }, { passive: true });

    wrapper.addEventListener('touchmove', e => {
        if (!touching) return;
        dx = e.touches[0].clientX - tx;
        const dy = e.touches[0].clientY - ty;
        if (locked === null && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
            locked = Math.abs(dx) > Math.abs(dy) ? 'h' : 'v';
        }
        if (locked === 'h') {
            e.preventDefault();
            setTrack(-cur * cardStep() + dx, false);
        }
    }, { passive: false });

    wrapper.addEventListener('touchend', () => {
        if (!touching) return;
        touching = false;
        if (locked === 'h') {
            if      (dx < -40) next();
            else if (dx >  40) prev();
            else               slideTo(cur);
        }
        resetAuto();
    }, { passive: true });

    wrapper.addEventListener('touchcancel', () => {
        touching = false; slideTo(cur); resetAuto();
    }, { passive: true });

    // ── Mouse drag ──
    let mx = 0, mdx = 0, dragging = false;
    wrapper.addEventListener('mousedown', e => {
        dragging = true; mx = e.clientX; mdx = 0;
        stopAuto(); setTrack(-cur * cardStep(), false);
        wrapper.style.cursor = 'grabbing';
    });
    window.addEventListener('mousemove', e => {
        if (!dragging) return;
        mdx = e.clientX - mx;
        setTrack(-cur * cardStep() + mdx, false);
    });
    window.addEventListener('mouseup', () => {
        if (!dragging) return;
        dragging = false; wrapper.style.cursor = '';
        if      (mdx < -50) next();
        else if (mdx >  50) prev();
        else                slideTo(cur);
        resetAuto();
    });

    // ── Resize ──
    let resizeT;
    window.addEventListener('resize', () => {
        clearTimeout(resizeT);
        resizeT = setTimeout(() => { jumpTo(cur); buildDots(); updateDots(); }, 120);
    });

    // ── Init ──
    buildDots();
    // Wait one frame for layout to settle before positioning
    requestAnimationFrame(() => {
        jumpTo(OFFSET);
        updateDots();
        startAuto();
    });
})();