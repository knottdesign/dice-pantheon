/* Dice Pantheon — shared behaviour.
   The hero frame sequence only runs on a page that contains #stage. */
(function(){
  'use strict';
  // tells the inline head script the enhancement layer arrived. If this file
  // never loads or throws before here, that script strips the `js` class after
  // 4s and every hidden section becomes visible again.
  window.__dpReady = true;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- scroll-driven intro ----------
     "Dice Pantheon" starts off the left edge, the slogan off the right and below
     it. Scrolling pulls them together until they sit stacked in the middle, and
     the photograph resolves in behind them. */
  (function(){
    var stage = document.getElementById('intro');
    if(!stage) return;
    var a = stage.querySelector('.intro-a'),
        b = stage.querySelector('.intro-b'),
        cue = stage.querySelector('.hero-cue');
    if(!a || !b) return;
    if(reduce) return;   // leaves the CSS defaults: a plain centred hero

    var clamp = function(v){ return v < 0 ? 0 : v > 1 ? 1 : v; };
    // smoothstep, not ease-out: the lines should still be visibly apart halfway
    // through the scroll rather than closing almost immediately
    var ease = function(t){ return t * t * (3 - 2 * t); };

    var root = document.documentElement;

    var apply = function(){
      var rect = stage.getBoundingClientRect();
      var span = stage.offsetHeight - window.innerHeight;
      var p = span > 0 ? clamp(-rect.top / span) : 0;

      // Scroll snapping fights a scrubbed section: scrolling back up gets yanked
      // to a snap point instead of running the animation in reverse. Turn it off
      // for as long as the intro owns the viewport.
      root.classList.toggle('in-intro', rect.top <= 1 && rect.bottom > window.innerHeight - 1);

      var conv = ease(clamp(p / 0.62));          // 0 = far apart, 1 = stacked

      // Travel only as far as the margin, measured from the real text width, so a
      // line is never cut off by the viewport — it starts flush left or flush
      // right and slides to centre, always fully readable.
      var pad = parseFloat(getComputedStyle(stage).getPropertyValue('--pad')) || 24;
      var room = function(el){
        var w = el.firstElementChild ? el.firstElementChild.getBoundingClientRect().width : 0;
        return Math.max(0, (window.innerWidth - w) / 2 - pad);
      };
      stage.style.setProperty('--ax', (-(1 - conv) * room(a)).toFixed(1) + 'px');
      stage.style.setProperty('--bx', ( (1 - conv) * room(b)).toFixed(1) + 'px');

      // the type starts as a whisper and resolves as the two lines meet
      stage.style.setProperty('--tx', (0.14 + 0.86 * conv).toFixed(3));

      // the eyebrow and buttons only once the lockup has landed
      stage.style.setProperty('--cta', clamp((p - 0.60) / 0.22).toFixed(3));
      if(cue) cue.style.opacity = (1 - clamp(p / 0.18)).toFixed(3);
    };

    addEventListener('scroll', apply, {passive:true});
    addEventListener('resize', apply);
    addEventListener('load', apply);
    // the travel distance is measured from the rendered text width, so it must be
    // recomputed once the real face is in — measuring against the fallback font
    // gives too much room and the line starts off the edge of the screen
    if(document.fonts && document.fonts.ready){
      document.fonts.ready.then(apply).catch(function(){});
    }
    setTimeout(apply, 400);
    setTimeout(apply, 1500);
    apply();
  })();

  /* ---------- intro loader ----------
     Only on the home page, once per browser session. Built here rather than in
     the markup so a page without JS never gets covered by it. */
  (function(){
    if(reduce) return;
    if(!document.querySelector('.hero-photo')) return;
    try{ if(sessionStorage.getItem('dp-intro')) return; }catch(e){}

    var WORDS = ['Cast in Magic', 'Forged with Might', 'Fifteen Dice · Five Metals'];
    var root = document.documentElement;
    var el = document.createElement('div');
    el.className = 'dp-loader';
    var words = document.createElement('div');
    words.className = 'dp-words';
    WORDS.forEach(function(w){
      var s = document.createElement('span');
      s.textContent = w;
      words.appendChild(s);
    });
    var foot = document.createElement('div');
    foot.className = 'dp-foot';
    foot.innerHTML = '<span>Loading</span><span class="pct">0%</span>';
    el.appendChild(words);
    el.appendChild(foot);
    document.body.appendChild(el);
    root.classList.add('dp-loading');

    var spans = words.querySelectorAll('span');
    var pct = foot.querySelector('.pct');
    spans.forEach(function(s,i){ setTimeout(function(){ s.classList.add('on'); }, 260 + i*360); });

    var started = Date.now(), DURATION = 2400, done = false;
    var finish = function(){
      if(done) return; done = true;
      try{ sessionStorage.setItem('dp-intro','1'); }catch(e){}
      words.classList.add('fade');
      setTimeout(function(){
        el.classList.add('out');
        root.classList.remove('dp-loading');
        setTimeout(function(){ if(el.parentNode) el.parentNode.removeChild(el); }, 1200);
      }, 420);
    };
    // setInterval, not requestAnimationFrame: rAF is paused in a hidden or
    // throttled tab and the counter would sit at 0% until the safety timer fired
    var timer = setInterval(function(){
      var p = Math.min(1, (Date.now()-started)/DURATION);
      pct.textContent = Math.round(p*100) + '%';
      if(p >= 1){ clearInterval(timer); finish(); }
    }, 40);
    // last resort if even the interval is starved
    setTimeout(function(){ clearInterval(timer); finish(); }, DURATION + 1600);
  })();

  /* ---------- nav ---------- */
  var nav = document.getElementById('nav');
  if(nav){
    var onScrollNav = function(){ nav.classList.toggle('stuck', window.scrollY > 40); };
    addEventListener('scroll', onScrollNav, {passive:true});
    onScrollNav();
    var btn = document.getElementById('mobBtn'), menu = document.getElementById('mobMenu');
    if(btn && menu){
      var setMenu = function(o){ menu.classList.toggle('open', o); btn.setAttribute('aria-expanded', o?'true':'false'); };
      btn.addEventListener('click', function(){ setMenu(!menu.classList.contains('open')); });
      menu.addEventListener('click', function(e){ if(e.target.tagName==='A') setMenu(false); });
    }
  }

  /* ---------- products menu ---------- */
  (function(){
    var menu = document.querySelector('.menu');
    if(!menu) return;
    var btn = menu.querySelector('button');
    var open = function(on){
      menu.setAttribute('data-open', on ? 'true' : 'false');
      btn.setAttribute('aria-expanded', on ? 'true' : 'false');
    };
    open(false);
    btn.addEventListener('click', function(e){
      e.stopPropagation();
      open(menu.getAttribute('data-open') !== 'true');
    });
    document.addEventListener('click', function(e){
      if(!menu.contains(e.target)) open(false);
    });
    document.addEventListener('keydown', function(e){
      if(e.key === 'Escape') open(false);
    });
    menu.addEventListener('click', function(e){
      if(e.target.tagName === 'A') open(false);
    });
  })();

  /* ---------- reveal on scroll ----------
     Geometry, not IntersectionObserver. An observer that never fires used to trip
     a blanket "show everything" fallback, which popped the whole feed open at once
     instead of one frame at a time. This reveals each element as it comes up and
     degrades to the same behaviour everywhere. */
  var rv = [].slice.call(document.querySelectorAll('.rv,#weigh'));
  var showAll = function(){ rv.forEach(function(el){ el.classList.add('in'); }); };

  if(reduce){
    showAll();
  } else {
    var pending = rv.slice();
    var sweep = function(){
      if(!pending.length) return;
      var limit = window.innerHeight - 70;
      var still = [];
      for(var i=0;i<pending.length;i++){
        var el = pending[i], r = el.getBoundingClientRect();
        // on screen, or already scrolled past
        if(r.top < limit && r.bottom > -200) el.classList.add('in');
        else if(r.bottom <= -200) el.classList.add('in');
        else still.push(el);
      }
      pending = still;
      if(!pending.length){
        removeEventListener('scroll', onSweep);
        removeEventListener('resize', onSweep);
      }
    };
    // called directly rather than throttled through requestAnimationFrame: rAF is
    // paused in a hidden tab, which would strand the throttle flag and stop the
    // reveal for good. The sweep only ever walks what is still pending.
    var onSweep = sweep;
    addEventListener('scroll', onSweep, {passive:true});
    addEventListener('resize', onSweep);
    sweep();
    // images landing late can change the layout under us
    addEventListener('load', sweep);
    setTimeout(sweep, 600);
  }

  /* ---------- set carousels ---------- */
  [].slice.call(document.querySelectorAll('[data-carousel]')).forEach(function(root){
    var wrap  = root.querySelector('.track-wrap');
    var track = root.querySelector('.track');
    var rail  = root.querySelector('.crail i');
    var prev  = root.querySelector('[data-dir="-1"]');
    var next  = root.querySelector('[data-dir="1"]');
    if(!track) return;

    // one item per press, whatever the item is: a die thumbnail, a small window,
    // or a full-width slide
    var step = function(){
      var card = track.firstElementChild;
      if(!card) return 300;
      var gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      return card.getBoundingClientRect().width + gap;
    };
    var maxScroll = function(){ return Math.max(0, track.scrollWidth - track.clientWidth); };

    // a slide carousel shows one product at a time, so it gets a marker per slide
    // and a count. A strip of small windows has the rail instead.
    var slides = [].slice.call(track.querySelectorAll('.slide'));
    var dots = root.querySelector('.sdots');
    var count = root.querySelector('.scount');
    var index = function(){
      var w = track.clientWidth;
      return w ? Math.min(slides.length - 1, Math.round(track.scrollLeft / w)) : 0;
    };
    if(dots && slides.length){
      slides.forEach(function(s, i){
        var b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('aria-label', 'Go to slide ' + (i+1));
        b.addEventListener('click', function(){
          track.scrollTo({left: i * track.clientWidth, behavior:'smooth'});
        });
        dots.appendChild(b);
      });
    }
    var marks = dots ? [].slice.call(dots.children) : [];

    var sync = function(){
      var max = maxScroll(), x = track.scrollLeft;
      if(marks.length){
        var k = index();
        marks.forEach(function(b, i){ b.setAttribute('aria-current', i === k ? 'true' : 'false'); });
        if(count) count.textContent = (k+1) + ' / ' + slides.length;
      }
      if(rail){
        var visible = track.clientWidth / track.scrollWidth;
        rail.style.width = (visible*100)+'%';
        rail.style.transform = 'translateX(' + (max ? (x/max)*((1-visible)*track.clientWidth) : 0) + 'px)';
      }
      if(wrap){
        wrap.classList.toggle('scrolled', x > 4);
        wrap.classList.toggle('at-end', x >= max - 4);
      }
      if(prev) prev.disabled = x <= 4;
      if(next) next.disabled = x >= max - 4;
    };
    track.addEventListener('scroll', sync, {passive:true});
    addEventListener('resize', sync);
    sync();

    if(prev) prev.addEventListener('click', function(){ track.scrollBy({left:-step(), behavior:'smooth'}); });
    if(next) next.addEventListener('click', function(){ track.scrollBy({left: step(), behavior:'smooth'}); });

    // a vertical wheel over the strip drives it sideways, but hand the page back
    // its scroll once the strip has run out — otherwise the page feels stuck
    track.addEventListener('wheel', function(e){
      if(e.ctrlKey) return;
      var d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if(!d) return;
      var max = maxScroll();
      if((d < 0 && track.scrollLeft <= 0) || (d > 0 && track.scrollLeft >= max)) return;
      e.preventDefault();
      track.scrollLeft += d;
    }, {passive:false});

    // drag to pan
    var down=false, startX=0, startLeft=0, moved=0;
    track.addEventListener('pointerdown', function(e){
      if(e.pointerType === 'touch') return;      // let touch scroll natively
      down=true; moved=0; startX=e.clientX; startLeft=track.scrollLeft;
      track.classList.add('dragging');
      track.setPointerCapture(e.pointerId);
    });
    track.addEventListener('pointermove', function(e){
      if(!down) return;
      var dx = e.clientX - startX;
      moved = Math.max(moved, Math.abs(dx));
      track.scrollLeft = startLeft - dx;
    });
    var endDrag = function(){
      if(!down) return;
      down=false; track.classList.remove('dragging');
    };
    track.addEventListener('pointerup', endDrag);
    track.addEventListener('pointercancel', endDrag);
    // a drag should not also fire the card's link
    track.addEventListener('click', function(e){ if(moved > 6){ e.preventDefault(); e.stopPropagation(); } }, true);

    track.addEventListener('keydown', function(e){
      if(e.key === 'ArrowRight'){ e.preventDefault(); track.scrollBy({left:step(), behavior:'smooth'}); }
      if(e.key === 'ArrowLeft'){  e.preventDefault(); track.scrollBy({left:-step(),behavior:'smooth'}); }
    });

    // one small nudge the first time it comes into view, so it reads as scrollable
    // a 54px nudge on a full-width slide just looks like a glitch
    if(!reduce && !slides.length && 'IntersectionObserver' in window){
      var nudged=false;
      var nio=new IntersectionObserver(function(es){
        es.forEach(function(en){
          if(!en.isIntersecting || nudged) return;
          nudged=true; nio.disconnect();
          setTimeout(function(){
            if(track.scrollLeft > 2) return;
            track.scrollTo({left:54, behavior:'smooth'});
            setTimeout(function(){ track.scrollTo({left:0, behavior:'smooth'}); }, 520);
          }, 420);
        });
      },{threshold:.35});
      nio.observe(root);
    }
  });

  /* ---------- hero frame sequence ---------- */
  var stage = document.getElementById('stage');
  if(!stage) return;

  var TOTAL = 150, PAD = 3, DIR = 'frames/pantheon/';
  var canvas  = document.getElementById('seqCanvas'),
      phases  = [].slice.call(document.querySelectorAll('.phase')),
      loadbar = document.getElementById('loadbar');

  var applyPhases = function(p){
    var k = p < 0.20 ? 0 : p < 0.44 ? 1 : p < 0.72 ? 2 : 3;
    for(var i=0;i<phases.length;i++) phases[i].classList.toggle('on', i===k);
    stage.classList.toggle('past', p > 0.06);
  };
  var progress = function(){
    var span = stage.offsetHeight - window.innerHeight;
    var p = span > 0 ? (-stage.getBoundingClientRect().top)/span : 0;
    return p < 0 ? 0 : p > 1 ? 1 : p;
  };

  // The sequence is ~3MB. Don't spend that on a phone, a narrow window or a
  // metered connection — those get the single still instead.
  var conn = navigator.connection || {};
  var lightMode = reduce
    || innerWidth < 760
    || conn.saveData === true
    || /^(slow-2g|2g|3g)$/.test(conn.effectiveType || '');

  if(lightMode || !canvas || !canvas.getContext){
    if(loadbar) loadbar.classList.add('done');
    if(canvas) canvas.style.display = 'none';
    var fb = document.querySelector('.seq img.fallback');
    if(fb) fb.style.display = 'block';
    if(!reduce){
      addEventListener('scroll', function(){ applyPhases(progress()); }, {passive:true});
    }
    return;
  }

  var ctx = canvas.getContext('2d');
  var imgs = new Array(TOTAL), ready = new Array(TOTAL), loaded = 0, current = -1;
  var src = function(i){ var s = String(i); while(s.length < PAD) s = '0'+s; return DIR+s+'.webp'; };

  var draw = function(i){
    if(i === current || !ready[i]) return;
    current = i;
    ctx.drawImage(imgs[i], 0, 0, canvas.width, canvas.height);
  };
  // if the exact frame is not in yet, show the nearest one that is
  var drawNearest = function(i){
    if(ready[i]){ draw(i); return; }
    for(var d=1; d<TOTAL; d++){
      if(i-d >= 0 && ready[i-d]){ draw(i-d); return; }
      if(i+d < TOTAL && ready[i+d]){ draw(i+d); return; }
    }
  };
  var load = function(i, cb){
    if(imgs[i]) return;
    var im = new Image();
    im.decoding = 'async';
    im.onload = function(){
      ready[i] = true; loaded++;
      if(loadbar) loadbar.firstElementChild.style.width = (loaded/TOTAL*100)+'%';
      if(loaded === 1) drawNearest(0);
      if(loaded === TOTAL && loadbar) loadbar.classList.add('done');
      if(cb) cb();
    };
    im.onerror = function(){ loaded++; if(loaded >= TOTAL && loadbar) loadbar.classList.add('done'); };
    im.src = src(i);
    imgs[i] = im;
  };

  // first frame immediately, then a coarse pass so scrubbing works early,
  // then everything else in the background
  load(0, function(){
    var coarse = [];
    for(var i=5;i<TOTAL;i+=5) coarse.push(i);
    var k = 0;
    (function next(){
      if(k < coarse.length){ load(coarse[k++], next); return; }
      for(var j=0;j<TOTAL;j++) load(j);
    })();
  });

  var raf = null;
  var onScroll = function(){
    var p = progress();
    applyPhases(p);
    var target = Math.min(TOTAL-1, Math.round(p*(TOTAL-1)));
    if(raf === null) raf = requestAnimationFrame(function(){ raf = null; drawNearest(target); });
  };
  addEventListener('scroll', onScroll, {passive:true});
  addEventListener('resize', onScroll);
  onScroll();
})();
