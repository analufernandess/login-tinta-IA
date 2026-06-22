window.onload = function() {
    // Garante que o plugin Draggable do GSAP está registrado e ativo
    gsap.registerPlugin(Draggable);

    const canvas = document.getElementById('paintCanvas');
    const ctx = canvas.getContext('2d');
    let particles = [];
    let splats = []; 
    let isAnimating = false;

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    const inkColors = ['#00b4d8', '#f43f5e', '#ffb703', '#9d4edd', '#06d6a0'];

    // 1. Definição das gotas da explosão inicial
    class InkDrop {
        constructor(x, y) {
            this.x = x; this.y = y;
            this.color = inkColors[Math.floor(Math.random() * inkColors.length)];
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 20 + 8; 
            this.vx = Math.cos(angle) * speed; this.vy = Math.sin(angle) * speed;
            this.radius = Math.random() * 14 + 5;
            this.alpha = 1;
        }
        update() {
            this.x += this.vx; this.y += this.vy;
            this.vx *= 0.93; this.vy *= 0.93;
            this.alpha -= 0.015;
        }
        draw() {
            ctx.save(); ctx.globalAlpha = this.alpha; ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = this.color; ctx.fill(); ctx.restore();
        }
    }

    // 2. Definição das grandes manchas orgânicas expandindo do centro
    class ScreenSplat {
        constructor(x, y) {
            this.startX = x; this.startY = y;
            this.targetX = x + (Math.random() - 0.5) * window.innerWidth * 0.85;
            this.targetY = y + (Math.random() - 0.5) * window.innerHeight * 0.85;
            this.x = x; this.y = y;
            this.color = inkColors[Math.floor(Math.random() * inkColors.length)];
            this.maxRadius = Math.random() * 160 + 100;
            this.currentRadius = 0;
            this.alpha = 1;
            this.growthSpeed = Math.random() * 6 + 12;
            this.holdFrames = 40;
        }
        update() {
            if (this.currentRadius < this.maxRadius) {
                this.currentRadius += this.growthSpeed;
                this.x += (this.targetX - this.startX) * 0.15;
                this.y += (this.targetY - this.startY) * 0.15;
            } else if (this.holdFrames > 0) {
                this.holdFrames--;
            } else {
                this.alpha -= 0.025;
            }
        }
        draw() {
            if (this.alpha <= 0) return;
            ctx.save(); ctx.globalAlpha = this.alpha; ctx.beginPath();
            ctx.arc(this.x, this.y, this.currentRadius, 0, Math.PI * 2);
            ctx.fillStyle = this.color; ctx.fill(); ctx.restore();
        }
    }

    function renderInkAnimation() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach((p, i) => { p.update(); p.draw(); if (p.alpha <= 0) particles.splice(i, 1); });
        splats.forEach((s, i) => { s.update(); s.draw(); if (s.alpha <= 0) splats.splice(i, 1); });
        
        if (particles.length > 0 || splats.length > 0) {
            requestAnimationFrame(renderInkAnimation);
        } else {
            isAnimating = false;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }

    // --- DISPARO DO BOTÃO ENTRAR ---
    document.getElementById('btnConfirmar').addEventListener('click', (e) => {
        if (isAnimating) return;
        isAnimating = true;

        const rect = e.target.getBoundingClientRect();
        const clickX = rect.left + rect.width / 2; 
        const clickY = rect.top + rect.height / 2;

        for (let i = 0; i < 100; i++) particles.push(new InkDrop(clickX, clickY));
        for (let i = 0; i < 16; i++) splats.push(new ScreenSplat(clickX, clickY));
        renderInkAnimation();

        // Esconde a tela de login suavemente com GSAP
        gsap.to('#loginScreen', { 
            duration: 0.3, 
            scale: 0.7, 
            opacity: 0, 
            ease: "power2.inOut", 
            onComplete: () => {
                document.getElementById('loginScreen').style.display = 'none';
            }
        });

        setTimeout(revelarCaptchaModerno, 800); 
    });

    function revelarCaptchaModerno() {
        const captcha = document.getElementById('captchaScreen');
        captcha.style.pointerEvents = 'auto'; // Reativa interações no formulário
        
        gsap.to(captcha, { 
            duration: 0.6, 
            opacity: 1, 
            scale: 1, 
            ease: "power3.out", 
            onComplete: iniciarJogoAlquimia 
        });
    }

    // --- MISTURA DE TINTAS DO CAPTCHA ---
    const alvosDef = {
        "alvo-violeta": { hex: "#9d4edd" },
        "alvo-verde": { hex: "#06d6a0" }
    };
    let objetivosConcluidos = 0;

    function iniciarJogoAlquimia() {
        configurarBaldeAlquimia("cyan");
        configurarBaldeAlquimia("magenta");
        configurarBaldeAlquimia("yellow");
    }

    function configurarBaldeAlquimia(corId) {
        const balde = document.getElementById(`balde-${corId}`);
        
        Draggable.create(balde, {
            type: "x,y",
            bounds: "#gameZone",
            onRelease: function() {
                let colidiu = false;
                const alvosDOM = document.querySelectorAll('.alvo-complexo');

                alvosDOM.forEach(alvo => {
                    if (this.hitTest(alvo, "40%")) {
                        colidiu = true;
                        processarEntregaTinta(this, balde, alvo, corId);
                    }
                });

                if (!colidiu) {
                    gsap.to(balde, { x: 0, y: 0, duration: 0.5, ease: "elastic.out(1, 0.6)" });
                }
            }
        });
    }

    function processarEntregaTinta(draggableObj, baldeElement, alvoElement, corEnviada) {
        const listaRequisitada = alvoElement.getAttribute('data-required').split(',');
        const misturasAtuais = alvoElement.getAttribute('data-mixed') ? alvoElement.getAttribute('data-mixed').split(',') : [];

        if (listaRequisitada.includes(corEnviada) && !misturasAtuais.includes(corEnviada)) {
            misturasAtuais.push(corEnviada);
            alvoElement.setAttribute('data-mixed', misturasAtuais.join(','));

            // Efeito visual do balde depositando a cor
            gsap.to(baldeElement, {
                scale: 1.2, duration: 0.15, yoyo: true, repeat: 1,
                onComplete: () => gsap.to(baldeElement, { x: 0, y: 0, scale: 1, duration: 0.3 })
            });

            const statusTxt = alvoElement.querySelector('.status');
            
            if (misturasAtuais.length === 1) {
                statusTxt.innerText = "Falta 1 cor...";
                statusTxt.className = "status text-[9px] font-bold text-amber-400 mt-1";
                gsap.to(alvoElement, { backgroundColor: "rgba(245, 158, 11, 0.1)", borderColor: "rgba(245, 158, 11, 0.3)", duration: 0.3 });
            } 
            
            if (misturasAtuais.length === 2) {
                objetivosConcluidos++;
                const infoAlvo = alvosDef[alvoElement.id];
                statusTxt.innerText = "SINTETIZADO ✨";
                statusTxt.className = "status text-[9px] font-black text-white mt-1";
                
                gsap.to(alvoElement, {
                    backgroundColor: infoAlvo.hex,
                    color: "#ffffff",
                    boxShadow: `0 12px 30px ${infoAlvo.hex}66`,
                    borderColor: "transparent",
                    duration: 0.4
                });
                
                if (objetivosConcluidos === 2) {
                    setTimeout(() => {
                        alert("🧪 Alquimia Perfeita! Identidade Humana Confirmada.");
                        location.reload();
                    }, 400);
                }
            }
        } else {
            // Mistura errada: Erro visual e repele o balde
            gsap.to(alvoElement, { x: 6, duration: 0.05, repeat: 4, yoyo: true, onComplete: () => gsap.to(alvoElement, { x: 0, duration: 0.1 }) });
            gsap.to(baldeElement, { x: 0, y: 0, duration: 0.5, ease: "bounce.out" });
        }
    }
};