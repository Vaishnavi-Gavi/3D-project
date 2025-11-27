// components.js
AFRAME.registerComponent('ring-interaction', {
  schema: {
    disabled: { type: 'boolean', default: false }
  },

  init: function() {
    this.originalPosition = new THREE.Vector3();
    this.originalPosition.copy(this.el.object3D.position);
    this.originalScale = this.el.object3D.scale.clone();
    this.isFocused = false;
    this.isAnimating = false;

    this.el.addEventListener('click', this.onClick.bind(this));
  },

  onClick: function(evt) {
    if (this.isAnimating || this.isFocused || this.data.disabled) return;
    
    this.isAnimating = true;
    const closeButton = document.getElementById('close-button');
    
    // Store current scene state
    this.el.sceneEl.systems['ring-manager'].setFocusedRing(this.el);
    this.isFocused = true;
    
    // Animate to focus position
    this.el.setAttribute('animation', {
      property: 'position',
      to: { x: 0, y: 1.5, z: -2 },
      dur: 1000,
      easing: 'easeInOutQuad'
    });
    
    this.el.setAttribute('animation__scale', {
      property: 'scale',
      to: '1.5 1.5 1.5',
      dur: 1000,
      easing: 'easeInOutQuad'
    });
    
    // Show close button
    closeButton.style.display = 'block';
    closeButton.onclick = () => {
      this.returnToBox();
      closeButton.style.display = 'none';
    };
    
    // Enable rotation
    this.el.setAttribute('drag-rotate', 'enabled', true);
    
    // Disable other rings
    document.querySelectorAll('[ring-interaction]').forEach(ring => {
      if (ring !== this.el) {
        ring.setAttribute('ring-interaction', 'disabled', true);
      }
    });
    
    setTimeout(() => {
      this.isAnimating = false;
    }, 1000);
  },

  returnToBox: function() {
    if (this.isAnimating) return;
    this.isAnimating = true;
    
    // Animate back to original position
    this.el.setAttribute('animation', {
      property: 'position',
      to: {
        x: this.originalPosition.x,
        y: this.originalPosition.y,
        z: this.originalPosition.z
      },
      dur: 1000,
      easing: 'easeInOutQuad'
    });
    
    this.el.setAttribute('animation__scale', {
      property: 'scale',
      to: {
        x: this.originalScale.x,
        y: this.originalScale.y,
        z: this.originalScale.z
      },
      dur: 1000,
      easing: 'easeInOutQuad'
    });
    
    // Reset state
    this.isFocused = false;
    this.el.removeAttribute('drag-rotate');
    
    // Re-enable other rings after animation
    setTimeout(() => {
      this.isAnimating = false;
      document.querySelectorAll('[ring-interaction]').forEach(ring => {
        ring.setAttribute('ring-interaction', 'disabled', false);
      });
    }, 1000);
  }
});

// Drag rotation component
AFRAME.registerComponent('drag-rotate', {
  schema: {
    enabled: { default: false }
  },

  init: function() {
    this.isDragging = false;
    this.rotationY = 0;
    this.lastX = 0;
    
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    
    this.el.addEventListener('mousedown', this.onMouseDown);
    this.el.addEventListener('touchstart', this.onMouseDown);
  },

  update: function() {
    if (this.data.enabled) {
      this.el.setAttribute('cursor-listener', '');
    } else {
      this.el.removeAttribute('cursor-listener');
    }
  },

  onMouseDown: function(evt) {
    if (!this.data.enabled) return;
    
    this.isDragging = true;
    this.lastX = evt.clientX || evt.touches[0].clientX;
    
    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('mouseup', this.onMouseUp);
    document.addEventListener('touchmove', this.onMouseMove, { passive: false });
    document.addEventListener('touchend', this.onMouseUp);
  },

  onMouseMove: function(evt) {
    if (!this.isDragging) return;
    
    evt.preventDefault();
    const currentX = evt.clientX || evt.touches[0].clientX;
    const deltaX = currentX - this.lastX;
    this.lastX = currentX;
    
    this.rotationY += deltaX * 0.5;
    this.el.object3D.rotation.y = THREE.MathUtils.degToRad(this.rotationY);
  },

  onMouseUp: function() {
    this.isDragging = false;
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseup', this.onMouseUp);
    document.removeEventListener('touchmove', this.onMouseMove);
    document.removeEventListener('touchend', this.onMouseUp);
  },

  remove: function() {
    this.el.removeEventListener('mousedown', this.onMouseDown);
    this.el.removeEventListener('touchstart', this.onMouseDown);
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseup', this.onMouseUp);
    document.removeEventListener('touchmove', this.onMouseMove);
    document.removeEventListener('touchend', this.onMouseUp);
  }
});

// System to manage ring states
AFRAME.registerSystem('ring-manager', {
  init: function() {
    this.focusedRing = null;
  },

  setFocusedRing: function(ring) {
    if (this.focusedRing && this.focusedRing !== ring) {
      this.focusedRing.components['ring-interaction'].returnToBox();
    }
    this.focusedRing = ring;
  }
});