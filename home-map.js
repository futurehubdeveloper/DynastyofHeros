(() => {
  'use strict';

  function initializeMap() {
    const section = document.getElementById('pagan-map');
    if (!section) return;

    const portraitVersion = '?v=20261125-dedicated-portraits';
    const locations = {
      'royal-city': {
        kind: 'The kingdom’s heart',
        name: 'The Royal City',
        description: 'Within the city walls, palace courtyards and winding streets set the scene for the first playable chapter. Plan your movements and guide the family through the palace escape.',
        linkText: 'Play the palace escape',
        href: 'play-demo.html',
        character: 'King Saw',
        characterId: 'anawrahta',
        portrait: 'assets/portraits/anawrahta.webp'
      },
      'temple-plains': {
        kind: 'Paths of learning',
        name: 'The Temple Plains',
        description: 'Quiet paths wind between brick temples and shaded courtyards. This corner of our illustrated world invites a slower pace, with space for learning, reflection, and stories shared along the way.',
        linkText: 'Explore the story',
        href: '#story',
        character: 'Head Sayadaw',
        characterId: 'head-sayadaw',
        portrait: 'assets/portraits/head-sayadaw.webp'
      },
      'river-crossing': {
        kind: 'A passage across the water',
        name: 'The River Crossing',
        description: 'Boats rest beside wooded banks where a crossing continues the journey through the kingdom. Discover Nga Oo, the legendary swimmer in the Dynasty of Heroes cast.',
        linkText: 'Meet Nga Oo',
        href: 'characters.html#nyaung-u-hpi',
        character: 'Nga Oo',
        characterId: 'nyaung-u-hpi',
        portrait: 'assets/portraits/nyaung-u-hpi.webp' + portraitVersion
      },
      'forest-village': {
        kind: 'A home among the hills',
        name: 'The Forest Village',
        description: 'Homes gather in a clearing deep among wooded hills. Trails connect the village with the monastery and the wider kingdom, while dense forest keeps daily life away from the palace crowds.',
        linkText: 'Meet the people',
        href: 'characters.html',
        character: 'Mae Pan',
        characterId: 'mae-pan',
        portrait: 'assets/portraits/mae-pan.webp'
      },
      'forest-monastery': {
        kind: 'A quiet retreat in the forest',
        name: 'The Forest Monastery',
        description: 'Sheltered by deep forest and wooded hills, the monastery gives retired monks a quiet place to live. The palace remains within reach, beyond the woodland and winding hill paths.',
        linkText: 'Enter the story',
        href: '#story',
        character: 'Retired Old Sayadaw',
        characterId: 'old-sayadaw',
        portrait: 'assets/portraits/old-sayadaw.webp' + portraitVersion
      },
      'mountain-path': {
        kind: 'Through the wooded heights',
        name: 'The Mountain Path',
        description: 'Narrow trails climb through dense trees and mountain folds, linking the secluded forest settlements to the lands beyond. Meet Nga Nyo, the hunter and scout in the Dynasty of Heroes cast.',
        linkText: 'Meet Nga Nyo',
        href: 'characters.html#nga-nyo',
        character: 'Nga Nyo',
        characterId: 'nga-nyo',
        portrait: 'assets/portraits/nga-nyo.webp' + portraitVersion
      }
    };

    const controls = Array.from(section.querySelectorAll('[data-map-location]'));
    const fields = {
      name: document.getElementById('map-location-name'),
      kind: document.getElementById('map-location-kind'),
      description: document.getElementById('map-location-description'),
      link: document.getElementById('map-location-link'),
      people: document.getElementById('map-location-people'),
      portrait: document.getElementById('map-location-portrait'),
      character: document.getElementById('map-location-character'),
      status: document.getElementById('map-location-status')
    };

    function selectLocation(key, announce = true) {
      const location = locations[key];
      if (!location) return;

      controls.forEach(control => {
        control.setAttribute('aria-pressed', String(control.dataset.mapLocation === key));
      });
      if (fields.name) fields.name.textContent = location.name;
      if (fields.kind) fields.kind.textContent = location.kind;
      if (fields.description) fields.description.textContent = location.description;
      if (fields.link) {
        fields.link.textContent = location.linkText;
        fields.link.setAttribute('href', location.href);
      }
      if (fields.people) {
        fields.people.textContent = 'View character';
        fields.people.setAttribute('href', 'characters.html#' + location.characterId);
        fields.people.setAttribute('aria-label', 'View ' + location.character + '’s character profile');
      }
      if (fields.portrait) {
        fields.portrait.setAttribute('src', location.portrait);
        fields.portrait.setAttribute('alt', location.character + ', from the Dynasty of Heroes cast');
      }
      if (fields.character) fields.character.textContent = location.character;
      if (announce && fields.status) {
        fields.status.textContent = location.name + ' selected. ' + location.description;
      }
    }

    controls.forEach(control => {
      control.addEventListener('click', () => selectLocation(control.dataset.mapLocation));
    });
    selectLocation('forest-monastery', false);
    section.classList.add('is-ready');

    const explorer = document.getElementById('pagan-map-explorer');
    const expandButton = document.getElementById('map-expand');
    if (!explorer || !expandButton) return;

    let expanded = false;
    let returnFocus = null;
    let inertSiblings = [];
    const originalAttributes = {
      role: explorer.getAttribute('role'),
      modal: explorer.getAttribute('aria-modal'),
      label: explorer.getAttribute('aria-labelledby')
    };

    function restoreAttribute(name, value) {
      if (value === null) explorer.removeAttribute(name);
      else explorer.setAttribute(name, value);
    }

    function setBackgroundInert() {
      let current = explorer;
      while (current.parentElement && current !== document.body) {
        Array.from(current.parentElement.children).forEach(sibling => {
          if (sibling === current || sibling.hasAttribute('inert')) return;
          sibling.setAttribute('inert', '');
          inertSiblings.push(sibling);
        });
        current = current.parentElement;
      }
    }

    function focusableElements() {
      return Array.from(explorer.querySelectorAll(
        'a[href], button, input, select, textarea, [tabindex]'
      )).filter(element => (
        !element.disabled &&
        element.tabIndex >= 0 &&
        !element.closest('[inert], [hidden]') &&
        element.getClientRects().length > 0 &&
        getComputedStyle(element).visibility !== 'hidden'
      ));
    }

    function setExpanded(next) {
      if (expanded === next) return;
      expanded = next;
      explorer.classList.toggle('is-expanded', next);
      document.body.classList.toggle('has-expanded-map', next);
      expandButton.setAttribute('aria-expanded', String(next));
      expandButton.textContent = next ? 'Close map' : 'Expand map';

      if (next) {
        returnFocus = document.activeElement;
        explorer.setAttribute('role', 'dialog');
        explorer.setAttribute('aria-modal', 'true');
        explorer.setAttribute('aria-labelledby', 'pagan-map-title');
        setBackgroundInert();
        expandButton.focus({ preventScroll: true });
      } else {
        restoreAttribute('role', originalAttributes.role);
        restoreAttribute('aria-modal', originalAttributes.modal);
        restoreAttribute('aria-labelledby', originalAttributes.label);
        inertSiblings.forEach(sibling => sibling.removeAttribute('inert'));
        inertSiblings = [];
        const target = returnFocus && returnFocus.isConnected ? returnFocus : expandButton;
        target.focus({ preventScroll: true });
        returnFocus = null;
      }
    }

    expandButton.setAttribute('aria-expanded', 'false');
    expandButton.addEventListener('click', () => setExpanded(!expanded));

    // Close the overlay before following an in-page destination outside it.
    explorer.addEventListener('click', event => {
      const anchor = event.target.closest('a[href^="#"]');
      if (expanded && anchor && explorer.contains(anchor)) setExpanded(false);
    });

    document.addEventListener('keydown', event => {
      if (!expanded) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        setExpanded(false);
        return;
      }
      if (event.key !== 'Tab') return;

      const elements = focusableElements();
      const first = elements[0] || expandButton;
      const last = elements[elements.length - 1] || expandButton;
      const active = document.activeElement;
      if (event.shiftKey && (active === first || !explorer.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || !explorer.contains(active))) {
        event.preventDefault();
        first.focus();
      }
    });

    document.addEventListener('focusin', event => {
      if (expanded && !explorer.contains(event.target)) expandButton.focus({ preventScroll: true });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeMap, { once: true });
  } else {
    initializeMap();
  }
})();
