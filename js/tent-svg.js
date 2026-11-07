/* ==========================================================
   US Camp — Springbar-style tent illustration (SVG string)
   Local coordinates: front-base centre = (0,0), up is -y.
   Colours come from CSS custom properties on a parent:
   --wall  --wall-shade  --roof  --roof-shade
   ========================================================== */
(function (global) {
  'use strict';

  const P = {
    fbl: [-100, 0], fbr: [100, 0],          // front base
    fel: [-80, -110], fer: [80, -110],      // front eaves
    fr: [0, -170],                          // front ridge
    bbr: [250, -25], ber: [230, -130],      // back right base / eave
    br: [150, -188], bel: [70, -128]        // back ridge / back left eave
  };
  const pt = (p) => p.join(',');
  const poly = (pts) => pts.map(pt).join(' ');

  /**
   * @param {Object} o
   *  o.id       unique prefix for gradient ids
   *  o.awning   boolean
   *  o.door     'open' | 'closed'
   *  o.extras   boolean: include optional prop groups (toggled by classes)
   */
  function tentSVG(o) {
    o = Object.assign({ id: 't', awning: true, door: 'open', extras: false }, o);
    const id = o.id;
    const s = [];

    s.push(`<defs>
      <linearGradient id="${id}-doorGlow" x1="0" y1="1" x2="0" y2="0">
        <stop offset="0" stop-color="#FFB862" stop-opacity=".95"/>
        <stop offset="1" stop-color="#7A3E1A" stop-opacity=".9"/>
      </linearGradient>
      <pattern id="${id}-mesh" width="4" height="4" patternUnits="userSpaceOnUse">
        <rect width="4" height="4" fill="#2A241D"/>
        <path d="M0 0L4 4M4 0L0 4" stroke="#3A332A" stroke-width=".6"/>
      </pattern>
      <pattern id="${id}-weave" width="6" height="6" patternUnits="userSpaceOnUse">
        <path d="M0 3H6M3 0V6" stroke="#000" stroke-opacity=".025" stroke-width=".8"/>
      </pattern>
    </defs>`);

    // ground shadow
    s.push(`<ellipse cx="75" cy="-6" rx="210" ry="26" fill="#000" opacity=".18"/>`);

    if (o.extras) {
      // ground tarp
      s.push(`<g class="prop prop-tarp"><polygon points="-118,8 118,8 268,-22 34,-32" fill="#4C5544" opacity=".9"/></g>`);
    }

    // left roof (mostly hidden)
    s.push(`<polygon points="${poly([P.fel, P.fr, P.br, P.bel])}" style="fill:var(--roof-shade)" />`);
    // right side wall
    s.push(`<polygon points="${poly([P.fbr, P.bbr, P.ber, P.fer])}" style="fill:var(--wall-shade)" />`);
    s.push(`<polygon points="${poly([P.fbr, P.bbr, P.ber, P.fer])}" fill="url(#${id}-weave)" />`);
    // side seams
    s.push(`<path d="M150 -14 L142 -117 M200 -21 L188 -124" stroke="#000" stroke-opacity=".12" stroke-width="1.2"/>`);
    // side window (rolled flap)
    s.push(`<polygon points="150,-40 205,-47 198,-98 146,-92" fill="url(#${id}-mesh)" />`);
    s.push(`<path d="M145 -95 L199 -101" stroke="var(--wall)" stroke-width="7" stroke-linecap="round" style="stroke:var(--wall)"/>`);
    // right roof
    s.push(`<polygon points="${poly([P.fer, P.ber, P.br, P.fr])}" style="fill:var(--roof)" />`);
    s.push(`<polygon points="${poly([P.fer, P.ber, P.br, P.fr])}" fill="url(#${id}-weave)" />`);

    if (o.extras) {
      // stove pipe + smoke
      s.push(`<g class="prop prop-stove">
        <rect x="146" y="-222" width="9" height="70" fill="#3B3631"/>
        <rect x="141" y="-228" width="19" height="8" fill="#2A2622"/>
        <rect x="140" y="-160" width="21" height="6" rx="2" fill="#8A8178"/>
        <g class="smoke">
          <circle cx="150" cy="-240" r="9"/><circle cx="156" cy="-262" r="12"/><circle cx="148" cy="-290" r="15"/>
        </g>
      </g>`);
    }

    // front gable
    s.push(`<polygon points="${poly([P.fbl, P.fbr, P.fer, P.fr, P.fel])}" style="fill:var(--wall)" />`);
    s.push(`<polygon points="${poly([P.fbl, P.fbr, P.fer, P.fr, P.fel])}" fill="url(#${id}-weave)" />`);
    // roof band on gable top (white roof panel visible at front edge)
    s.push(`<polygon points="-80,-110 0,-170 80,-110 72,-106 0,-160 -72,-106" style="fill:var(--roof)" />`);

    // door
    if (o.door === 'open') {
      s.push(`<polygon class="door-hole" points="-40,0 40,0 22,-142 -22,-142" fill="url(#${id}-mesh)"/>`);
      s.push(`<polygon class="door-glow" points="-40,0 40,0 22,-142 -22,-142" fill="url(#${id}-doorGlow)"/>`);
      if (o.extras) {
        s.push(`<g class="prop prop-cot"><rect x="-30" y="-30" width="60" height="7" fill="#6E4A2E"/>
          <path d="M-26 -23 V-6 M26 -23 V-6" stroke="#3a2a1c" stroke-width="3"/>
          <rect x="-28" y="-36" width="22" height="7" rx="3" fill="#D9CDB4"/></g>`);
      }
      // tied-back flaps
      s.push(`<path d="M-22 -142 L-40 0 L-56 0 Q-44 -70 -30 -120 Z" style="fill:var(--wall-shade)"/>`);
      s.push(`<path d="M22 -142 L40 0 L56 0 Q44 -70 30 -120 Z" style="fill:var(--wall-shade)"/>`);
      s.push(`<path d="M-50 -60 l10 4 M50 -60 l-10 4" stroke="#F3EBDD" stroke-width="2.4" stroke-linecap="round"/>`);
    } else {
      s.push(`<path d="M0 0 V-150" stroke="#000" stroke-opacity=".35" stroke-width="1.5"/>`);
      s.push(`<path d="M-30 0 L-16 -140 M30 0 L16 -140" stroke="#000" stroke-opacity=".1" stroke-width="1.2"/>`);
      s.push(`<path d="M-8 -64 l8 4 l8 -4" stroke="#F3EBDD" stroke-width="2.2" fill="none"/>`);
    }
    // front label patch
    s.push(`<polygon points="52,-28 76,-28 64,-12" fill="#F3EBDD" opacity=".85"/>`);

    // poles
    const pole = `stroke="#B9B4AA" stroke-width="3.2" stroke-linecap="round"`;
    s.push(`<path d="M0 6 V-178" ${pole}/>`);
    s.push(`<path d="M-104 6 L-82 -111 M104 6 L82 -111 M254 -19 L232 -131" ${pole}/>`);
    // spring bars (bowed)
    s.push(`<path d="M60 -106 Q155 -128 250 -134" stroke="#CFCAC0" stroke-width="3.6" fill="none" stroke-linecap="round"/>`);
    s.push(`<path d="M-98 -107 L-76 -111" stroke="#CFCAC0" stroke-width="3.6" stroke-linecap="round"/>`);
    // ridge pole
    s.push(`<path d="M0 -172 L150 -190" stroke="#CFCAC0" stroke-width="2.4" stroke-linecap="round" opacity=".8"/>`);
    // guy lines
    s.push(`<path d="M-82 -110 L-168 10 M232 -130 L318 -10" stroke="#EDE5D6" stroke-width="1" opacity=".7"/>`);
    s.push(`<path d="M-172 10 l8 0 M314 -10 l8 0" stroke="#5A4B3A" stroke-width="3"/>`);

    // awning
    s.push(`<g class="${o.extras ? 'prop prop-awning' : ''}" ${!o.extras && !o.awning ? 'style="display:none"' : ''}>
      <polygon points="0,-170 80,-110 12,-96 -72,-154" style="fill:var(--roof)"/>
      <polygon points="0,-170 -80,-110 -152,-96 -72,-154" style="fill:var(--roof-shade)"/>
      <path d="M-152 -96 L-72 -154 L12 -96" stroke="#000" stroke-opacity=".08" fill="none"/>
      <path d="M-152 -96 V34 M12 -96 V34" ${pole}/>
      <path d="M-152 -96 L-210 36 M12 -96 L60 36" stroke="#EDE5D6" stroke-width="1" opacity=".6"/>
    </g>`);

    if (o.extras) {
      // rug in front of the door
      s.push(`<g class="prop prop-rug">
        <polygon points="-120,16 70,16 40,52 -160,52" fill="#8E3B2A"/>
        <polygon points="-110,20 62,20 36,48 -150,48" fill="none" stroke="#E2C48E" stroke-width="2"/>
        <polygon points="-62,26 -12,26 -24,42 -78,42" fill="#2F4A5C"/>
        <path d="M-120 16 l-4 -4 M-90 16 l-3 -4 M-60 16 l-3 -4 M-30 16 l-3 -4 M0 16 l-2 -4 M30 16 l-2 -4 M60 16 l-2 -4" stroke="#E2C48E" stroke-width="1.4"/>
      </g>`);
      // lanterns on awning poles
      s.push(`<g class="prop prop-lantern">
        <path d="M-152 -88 v10 M12 -88 v10" stroke="#2A2622" stroke-width="1.5"/>
        <rect x="-158" y="-78" width="12" height="16" rx="2" fill="#2A2622"/><rect x="-156" y="-75" width="8" height="10" fill="#FFC56B"/>
        <rect x="6" y="-78" width="12" height="16" rx="2" fill="#2A2622"/><rect x="8" y="-75" width="8" height="10" fill="#FFC56B"/>
      </g>`);
      // string lights
      s.push(`<g class="prop prop-lights">
        <path d="M-152 -96 Q-250 -50 -340 -120" stroke="#2A2622" stroke-width="1.2" fill="none"/>
        <path d="M-340 -126 V34" stroke="#6B5640" stroke-width="4"/>
        ${[0.1, 0.25, 0.4, 0.55, 0.7, 0.85].map((t) => {
          const x = (1 - t) * (1 - t) * -152 + 2 * (1 - t) * t * -250 + t * t * -340;
          const y = (1 - t) * (1 - t) * -96 + 2 * (1 - t) * t * -50 + t * t * -120;
          return `<circle cx="${x.toFixed(1)}" cy="${(y + 4).toFixed(1)}" r="3.4" fill="#FFD48A"/>`;
        }).join('')}
      </g>`);
    }

    return s.join('');
  }

  /** glow layer for night scenes — same local coordinates */
  function tentGlowSVG() {
    const bulbs = [0.1, 0.25, 0.4, 0.55, 0.7, 0.85].map((t) => {
      const x = (1 - t) * (1 - t) * -152 + 2 * (1 - t) * t * -250 + t * t * -340;
      const y = (1 - t) * (1 - t) * -96 + 2 * (1 - t) * t * -50 + t * t * -120;
      return `<circle cx="${x.toFixed(1)}" cy="${(y + 4).toFixed(1)}" r="14"/>`;
    }).join('');
    return `
      <g class="glow glow-door"><ellipse cx="0" cy="-40" rx="46" ry="56"/></g>
      <g class="glow glow-lantern"><circle cx="-152" cy="-70" r="46"/><circle cx="12" cy="-70" r="46"/></g>
      <g class="glow glow-lights">${bulbs}</g>`;
  }

  global.USCampTent = { tentSVG, tentGlowSVG };
})(window);
