// Accessibility handler for animations

export class AccessibilityHandler {
  private static instance: AccessibilityHandler;
  private reducedMotionEnabled: boolean = false;
  private highContrastEnabled: boolean = false;
  private screenReaderEnabled: boolean = false;
  private focusVisible: boolean = true;

  constructor() {
    this.init();
  }

  /**
   * Gets singleton instance
   */
  static getInstance(): AccessibilityHandler {
    if (!AccessibilityHandler.instance) {
      AccessibilityHandler.instance = new AccessibilityHandler();
    }
    return AccessibilityHandler.instance;
  }

  /**
   * Initializes accessibility detection
   */
  private init(): void {
    this.detectReducedMotion();
    this.detectHighContrast();
    this.detectScreenReader();
    this.setupFocusVisible();
    this.setupMediaQueryListeners();
  }

  /**
   * Checks if reduced motion is preferred
   */
  isReducedMotionPreferred(): boolean {
    return this.reducedMotionEnabled;
  }

  /**
   * Checks if high contrast is enabled
   */
  isHighContrastEnabled(): boolean {
    return this.highContrastEnabled;
  }

  /**
   * Checks if screen reader is likely being used
   */
  isScreenReaderEnabled(): boolean {
    return this.screenReaderEnabled;
  }

  /**
   * Respects motion preferences and disables animations if needed
   */
  respectMotionPreferences(): void {
    if (this.reducedMotionEnabled) {
      this.disableAnimations();
      this.addReducedMotionStyles();
      this.createStaticAlternatives();
    }
  }

  /**
   * Creates static alternatives for animated content
   */
  createStaticAlternatives(): void {
    // Replace animated cards with static versions
    const animatedCards = document.querySelectorAll('[data-animation="card"]');
    animatedCards.forEach(card => {
      this.createStaticCard(card as HTMLElement);
    });

    // Replace animated counters with instant display
    const animatedCounters = document.querySelectorAll('[data-animation="counter"]');
    animatedCounters.forEach(counter => {
      this.createStaticCounter(counter as HTMLElement);
    });

    // Replace animated charts with static versions
    const animatedCharts = document.querySelectorAll('[data-animation="chart"]');
    animatedCharts.forEach(chart => {
      this.createStaticChart(chart as HTMLElement);
    });

    // Replace hero animations with static hero
    const heroSections = document.querySelectorAll('[data-animation="hero"]');
    heroSections.forEach(hero => {
      this.createStaticHero(hero as HTMLElement);
    });
  }

  /**
   * Creates static version of animated card
   */
  private createStaticCard(card: HTMLElement): void {
    card.classList.add('static-card');
    card.style.transform = 'none';
    card.style.transition = 'none';
    
    // Add descriptive text for screen readers
    const description = document.createElement('span');
    description.className = 'sr-only';
    description.textContent = card.getAttribute('data-card-description') || 'Interactive card element';
    card.appendChild(description);
  }

  /**
   * Creates static version of animated counter
   */
  private createStaticCounter(counter: HTMLElement): void {
    const targetValue = counter.getAttribute('data-target-value');
    if (targetValue) {
      counter.textContent = targetValue;
    }
    counter.classList.add('static-counter');
  }

  /**
   * Creates static version of animated chart
   */
  private createStaticChart(chart: HTMLElement): void {
    chart.classList.add('static-chart');
    
    // Add data table alternative
    const chartData = chart.getAttribute('data-chart-data');
    if (chartData) {
      try {
        const data = JSON.parse(chartData);
        const table = this.createDataTable(data);
        chart.appendChild(table);
      } catch (e) {
        console.warn('Could not parse chart data for static alternative');
      }
    }
  }

  /**
   * Creates static version of hero section
   */
  private createStaticHero(hero: HTMLElement): void {
    hero.classList.add('static-hero');
    
    // Remove any auto-playing animations
    const autoplayElements = hero.querySelectorAll('[data-autoplay]');
    autoplayElements.forEach(element => {
      element.removeAttribute('data-autoplay');
    });
    
    // Show final state of animations
    const animatedElements = hero.querySelectorAll('[data-final-state]');
    animatedElements.forEach(element => {
      const finalState = element.getAttribute('data-final-state');
      if (finalState) {
        (element as HTMLElement).style.cssText = finalState;
      }
    });
  }

  /**
   * Creates accessible data table from chart data
   */
  private createDataTable(data: any[]): HTMLTableElement {
    const table = document.createElement('table');
    table.className = 'sr-only chart-data-table';
    table.setAttribute('role', 'table');
    table.setAttribute('aria-label', 'Chart data in table format');

    const thead = document.createElement('thead');
    const tbody = document.createElement('tbody');

    if (data.length > 0) {
      // Create header row
      const headerRow = document.createElement('tr');
      Object.keys(data[0]).forEach(key => {
        const th = document.createElement('th');
        th.textContent = key;
        th.setAttribute('scope', 'col');
        headerRow.appendChild(th);
      });
      thead.appendChild(headerRow);

      // Create data rows
      data.forEach(item => {
        const row = document.createElement('tr');
        Object.values(item).forEach(value => {
          const td = document.createElement('td');
          td.textContent = String(value);
          row.appendChild(td);
        });
        tbody.appendChild(row);
      });
    }

    table.appendChild(thead);
    table.appendChild(tbody);
    return table;
  }

  /**
   * Ensures keyboard navigation works properly
   */
  ensureKeyboardNavigation(): void {
    // Add focus indicators to all interactive elements
    const interactiveElements = document.querySelectorAll(
      'button, a, input, select, textarea, [tabindex]:not([tabindex="-1"]), [role="button"], [data-interactive]'
    );

    interactiveElements.forEach(element => {
      this.addFocusIndicator(element as HTMLElement);
      this.addKeyboardHandlers(element as HTMLElement);
    });

    // Add skip links
    this.addSkipLinks();
    
    // Ensure proper tab order
    this.ensureTabOrder();
    
    // Add keyboard shortcuts
    this.addKeyboardShortcuts();
  }

  /**
   * Adds keyboard event handlers to interactive elements
   */
  private addKeyboardHandlers(element: HTMLElement): void {
    // Handle Enter and Space for button-like elements
    if (element.getAttribute('role') === 'button' || element.hasAttribute('data-interactive')) {
      element.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          element.click();
        }
      });
    }

    // Handle arrow keys for card navigation
    if (element.classList.contains('card') || element.hasAttribute('data-card')) {
      element.addEventListener('keydown', (e) => {
        this.handleCardNavigation(e, element);
      });
    }
  }

  /**
   * Handles keyboard navigation between cards
   */
  private handleCardNavigation(e: KeyboardEvent, currentCard: HTMLElement): void {
    const cards = Array.from(document.querySelectorAll('.card, [data-card]')) as HTMLElement[];
    const currentIndex = cards.indexOf(currentCard);

    let nextIndex = currentIndex;

    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        nextIndex = (currentIndex + 1) % cards.length;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        nextIndex = (currentIndex - 1 + cards.length) % cards.length;
        break;
      case 'Home':
        nextIndex = 0;
        break;
      case 'End':
        nextIndex = cards.length - 1;
        break;
      default:
        return;
    }

    if (nextIndex !== currentIndex) {
      const nextCard = cards[nextIndex];
      if (nextCard) {
        e.preventDefault();
        nextCard.focus();
      }
    }
  }

  /**
   * Ensures proper tab order for the page
   */
  private ensureTabOrder(): void {
    const interactiveElements = document.querySelectorAll(
      'button, a, input, select, textarea, [tabindex]:not([tabindex="-1"]), [role="button"], [data-interactive]'
    ) as NodeListOf<HTMLElement>;

    // Group elements by section
    const sections = ['header', 'main', 'aside', 'footer'];
    let tabIndex = 1;

    sections.forEach(sectionName => {
      const section = document.querySelector(sectionName) || document.querySelector(`[role="${sectionName}"]`);
      if (section) {
        const sectionElements = Array.from(section.querySelectorAll(
          'button, a, input, select, textarea, [role="button"], [data-interactive]'
        )) as HTMLElement[];

        sectionElements.forEach(element => {
          if (!element.hasAttribute('tabindex') || element.getAttribute('tabindex') === '0') {
            element.setAttribute('tabindex', tabIndex.toString());
            tabIndex++;
          }
        });
      }
    });
  }

  /**
   * Adds keyboard shortcuts for common actions
   */
  private addKeyboardShortcuts(): void {
    document.addEventListener('keydown', (e) => {
      // Skip to main content (Alt + M)
      if (e.altKey && e.key === 'm') {
        e.preventDefault();
        const mainContent = document.querySelector('#main-content, main, [role="main"]') as HTMLElement;
        if (mainContent) {
          mainContent.focus();
          if (mainContent.scrollIntoView) {
            mainContent.scrollIntoView({ behavior: 'smooth' });
          }
        }
      }

      // Toggle animations (Alt + A)
      if (e.altKey && e.key === 'a') {
        e.preventDefault();
        this.toggleAnimations();
      }

      // Show keyboard shortcuts help (Alt + ?)
      if (e.altKey && e.key === '?') {
        e.preventDefault();
        this.showKeyboardShortcuts();
      }
    });
  }

  /**
   * Toggles animations on/off
   */
  private toggleAnimations(): void {
    this.reducedMotionEnabled = !this.reducedMotionEnabled;
    
    if (this.reducedMotionEnabled) {
      this.disableAnimations();
      this.addReducedMotionStyles();
      this.createStaticAlternatives();
    } else {
      this.enableAnimations();
      this.removeReducedMotionStyles();
    }

    // Announce change to screen readers
    this.announceToScreenReader(
      `Animations ${this.reducedMotionEnabled ? 'disabled' : 'enabled'}`
    );
  }

  /**
   * Shows keyboard shortcuts help
   */
  private showKeyboardShortcuts(): void {
    const shortcuts = [
      'Alt + M: Skip to main content',
      'Alt + A: Toggle animations',
      'Alt + ?: Show this help',
      'Arrow keys: Navigate between cards',
      'Enter/Space: Activate buttons',
      'Tab: Navigate forward',
      'Shift + Tab: Navigate backward'
    ];

    const helpText = shortcuts.join('\n');
    this.announceToScreenReader(`Keyboard shortcuts: ${helpText}`);
    
    // Also show visual help for sighted users
    this.showVisualShortcutsHelp(shortcuts);
  }

  /**
   * Shows visual keyboard shortcuts help
   */
  private showVisualShortcutsHelp(shortcuts: string[]): void {
    const existing = document.querySelector('.keyboard-shortcuts-help');
    if (existing) {
      existing.remove();
      return;
    }

    const helpDialog = document.createElement('div');
    helpDialog.className = 'keyboard-shortcuts-help';
    helpDialog.setAttribute('role', 'dialog');
    helpDialog.setAttribute('aria-labelledby', 'shortcuts-title');
    helpDialog.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      border: 2px solid #333;
      border-radius: 8px;
      padding: 20px;
      max-width: 400px;
      z-index: 10000;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    `;

    const title = document.createElement('h2');
    title.id = 'shortcuts-title';
    title.textContent = 'Keyboard Shortcuts';
    title.style.marginTop = '0';

    const list = document.createElement('ul');
    shortcuts.forEach(shortcut => {
      const item = document.createElement('li');
      item.textContent = shortcut;
      item.style.marginBottom = '8px';
      list.appendChild(item);
    });

    const closeButton = document.createElement('button');
    closeButton.textContent = 'Close (Escape)';
    closeButton.style.cssText = `
      margin-top: 16px;
      padding: 8px 16px;
      background: #007cba;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    `;

    closeButton.addEventListener('click', () => helpDialog.remove());

    helpDialog.appendChild(title);
    helpDialog.appendChild(list);
    helpDialog.appendChild(closeButton);
    document.body.appendChild(helpDialog);

    // Handle escape key
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        helpDialog.remove();
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);

    closeButton.focus();
  }

  /**
   * Enables animations
   */
  private enableAnimations(): void {
    const existingStyle = document.querySelector('style[data-reduced-motion]');
    if (existingStyle) {
      existingStyle.remove();
    }
  }

  /**
   * Removes reduced motion styles
   */
  private removeReducedMotionStyles(): void {
    document.body.classList.remove('reduced-motion');
  }

  /**
   * Announces message to screen readers
   */
  private announceToScreenReader(message: string): void {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }

  /**
   * Provides alternative content for animations
   */
  provideAlternativeContent(): void {
    const animatedElements = document.querySelectorAll('[data-animation-id], [data-animation], .card, .animation-element');
    
    animatedElements.forEach(element => {
      this.addAlternativeText(element as HTMLElement);
      this.addAriaLabels(element as HTMLElement);
      this.addScreenReaderDescriptions(element as HTMLElement);
    });

    // Add landmark roles and headings structure
    this.ensureProperHeadingStructure();
    this.addLandmarkRoles();
  }

  /**
   * Adds comprehensive screen reader descriptions
   */
  addScreenReaderDescriptions(element: HTMLElement): void {
    const animationType = element.getAttribute('data-animation') || 'generic';
    const isInteractive = element.hasAttribute('data-interactive') || 
                          element.getAttribute('role') === 'button' ||
                          element.tagName.toLowerCase() === 'button';

    // Add appropriate role if missing
    if (!element.getAttribute('role')) {
      if (isInteractive) {
        element.setAttribute('role', 'button');
      } else if (element.classList.contains('card')) {
        element.setAttribute('role', 'article');
      } else {
        element.setAttribute('role', 'img');
      }
    }

    // Add aria-label if missing
    if (!element.getAttribute('aria-label') && !element.getAttribute('aria-labelledby')) {
      const label = this.generateAriaLabel(element, animationType, isInteractive);
      element.setAttribute('aria-label', label);
    }

    // Add aria-describedby for complex animations
    if (!element.getAttribute('aria-describedby')) {
      const descId = this.createDescriptionElement(element, animationType);
      element.setAttribute('aria-describedby', descId);
    }

    // Add keyboard interaction hints
    if (isInteractive) {
      this.addKeyboardInstructions(element);
    }
  }

  /**
   * Generates appropriate ARIA label based on element type and animation
   */
  private generateAriaLabel(element: HTMLElement, animationType: string, isInteractive: boolean): string {
    const baseLabels = {
      card: 'Interactive card',
      counter: 'Animated counter',
      chart: 'Data visualization',
      hero: 'Hero section',
      shuffle: 'Card shuffle animation',
      flip: 'Card flip animation',
      generic: 'Animated element'
    };

    let label = baseLabels[animationType as keyof typeof baseLabels] || baseLabels.generic;
    
    // Add interaction hint
    if (isInteractive) {
      label += ', press Enter or Space to activate';
    }

    // Add content if available
    const textContent = element.textContent?.trim();
    if (textContent && textContent.length < 100) {
      label += `: ${textContent}`;
    }

    return label;
  }

  /**
   * Creates description element for complex animations
   */
  private createDescriptionElement(element: HTMLElement, animationType: string): string {
    const descId = `desc-${Math.random().toString(36).substr(2, 9)}`;
    
    const descriptions = {
      card: 'This card contains interactive content that can be activated with keyboard navigation',
      counter: 'This counter animates from zero to its target value when it comes into view',
      chart: 'This chart displays data with animated transitions. A data table alternative is available',
      hero: 'This hero section contains animated elements showcasing the application features',
      shuffle: 'This animation demonstrates card shuffling mechanics used in the game',
      flip: 'This animation shows a card flipping to reveal information on both sides',
      generic: 'This element contains animated content for visual enhancement'
    };

    const description = document.createElement('div');
    description.id = descId;
    description.className = 'sr-only';
    description.textContent = descriptions[animationType as keyof typeof descriptions] || descriptions.generic;
    
    element.appendChild(description);
    return descId;
  }

  /**
   * Adds keyboard interaction instructions
   */
  private addKeyboardInstructions(element: HTMLElement): void {
    const instructionsId = `instructions-${Math.random().toString(36).substr(2, 9)}`;
    
    const instructions = document.createElement('div');
    instructions.id = instructionsId;
    instructions.className = 'sr-only';
    instructions.textContent = 'Use Enter or Space to activate, arrow keys to navigate between similar elements';
    
    element.appendChild(instructions);
    
    // Add to aria-describedby
    const existingDesc = element.getAttribute('aria-describedby');
    const newDesc = existingDesc ? `${existingDesc} ${instructionsId}` : instructionsId;
    element.setAttribute('aria-describedby', newDesc);
  }

  /**
   * Ensures proper heading structure for screen readers
   */
  private ensureProperHeadingStructure(): void {
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const sections = document.querySelectorAll('section, article, aside, nav');

    // Ensure main heading exists
    if (!document.querySelector('h1')) {
      const mainHeading = document.createElement('h1');
      mainHeading.className = 'sr-only';
      mainHeading.textContent = 'TechQS - Digital Card Game Platform';
      document.body.insertBefore(mainHeading, document.body.firstChild);
    }

    // Add section headings where missing
    sections.forEach((section, index) => {
      if (!section.querySelector('h1, h2, h3, h4, h5, h6')) {
        const heading = document.createElement('h2');
        heading.className = 'sr-only';
        heading.textContent = section.getAttribute('aria-label') || `Section ${index + 1}`;
        section.insertBefore(heading, section.firstChild);
      }
    });
  }

  /**
   * Adds landmark roles to page sections
   */
  private addLandmarkRoles(): void {
    // Add main landmark
    const main = document.querySelector('main');
    if (main && !main.getAttribute('role')) {
      main.setAttribute('role', 'main');
    }

    // Add navigation landmarks
    const navs = document.querySelectorAll('nav');
    navs.forEach(nav => {
      if (!nav.getAttribute('role')) {
        nav.setAttribute('role', 'navigation');
      }
      if (!nav.getAttribute('aria-label')) {
        nav.setAttribute('aria-label', 'Main navigation');
      }
    });

    // Add banner and contentinfo roles
    const header = document.querySelector('header');
    if (header && !header.getAttribute('role')) {
      header.setAttribute('role', 'banner');
    }

    const footer = document.querySelector('footer');
    if (footer && !footer.getAttribute('role')) {
      footer.setAttribute('role', 'contentinfo');
    }

    // Add complementary role to sidebars
    const asides = document.querySelectorAll('aside');
    asides.forEach(aside => {
      if (!aside.getAttribute('role')) {
        aside.setAttribute('role', 'complementary');
      }
    });
  }

  /**
   * Creates accessible animation descriptions
   */
  createAnimationDescription(
    element: HTMLElement,
    animationType: string,
    description?: string
  ): void {
    const defaultDescriptions = {
      shuffle: 'Cards are being shuffled with a mixing motion',
      deal: 'Cards are being dealt one by one from the deck',
      flip: 'Card is flipping to reveal its other side',
      hover: 'Card is lifting slightly with a hover effect',
      stack: 'Cards are being arranged in a neat stack'
    };

    const finalDescription = description || defaultDescriptions[animationType as keyof typeof defaultDescriptions] || 'Animation in progress';
    
    // Add aria-live region for screen readers
    const liveRegion = document.createElement('div');
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    liveRegion.textContent = finalDescription;
    
    element.appendChild(liveRegion);
    
    // Remove after animation completes
    setTimeout(() => {
      if (liveRegion.parentNode) {
        liveRegion.parentNode.removeChild(liveRegion);
      }
    }, 3000);
  }

  /**
   * Detects reduced motion preference
   */
  private detectReducedMotion(): void {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.reducedMotionEnabled = mediaQuery.matches;
  }

  /**
   * Detects high contrast preference
   */
  private detectHighContrast(): void {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    this.highContrastEnabled = mediaQuery.matches;
  }

  /**
   * Detects potential screen reader usage
   */
  private detectScreenReader(): void {
    // Check for common screen reader indicators
    this.screenReaderEnabled = 
      navigator.userAgent.includes('NVDA') ||
      navigator.userAgent.includes('JAWS') ||
      navigator.userAgent.includes('VoiceOver') ||
      window.speechSynthesis !== undefined;
  }

  /**
   * Sets up focus-visible polyfill behavior
   */
  private setupFocusVisible(): void {
    let hadKeyboardEvent = true;
    const keyboardThrottleTimeout = 100;

    const pointerEvents = ['mousedown', 'pointerdown', 'touchstart'];
    const keyboardEvents = ['keydown'];

    // Mark keyboard usage
    keyboardEvents.forEach(event => {
      document.addEventListener(event, () => {
        hadKeyboardEvent = true;
      }, true);
    });

    // Mark pointer usage
    pointerEvents.forEach(event => {
      document.addEventListener(event, () => {
        hadKeyboardEvent = false;
      }, true);
    });

    // Apply focus-visible class based on input method
    document.addEventListener('focusin', (e) => {
      if (hadKeyboardEvent || (e.target as HTMLElement).matches(':focus-visible')) {
        (e.target as HTMLElement).classList.add('focus-visible');
      }
    }, true);

    document.addEventListener('focusout', (e) => {
      (e.target as HTMLElement).classList.remove('focus-visible');
    }, true);
  }

  /**
   * Sets up media query listeners for accessibility changes
   */
  private setupMediaQueryListeners(): void {
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const highContrastQuery = window.matchMedia('(prefers-contrast: high)');

    reducedMotionQuery.addEventListener('change', (e) => {
      this.reducedMotionEnabled = e.matches;
      if (e.matches) {
        this.disableAnimations();
      }
    });

    highContrastQuery.addEventListener('change', (e) => {
      this.highContrastEnabled = e.matches;
      if (e.matches) {
        this.adjustForHighContrast();
      }
    });
  }

  /**
   * Disables all animations on the page
   */
  private disableAnimations(): void {
    const existingStyle = document.querySelector('style[data-reduced-motion]');
    if (existingStyle) return;

    const style = document.createElement('style');
    style.setAttribute('data-reduced-motion', 'true');
    style.textContent = `
      *, *::before, *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
        scroll-behavior: auto !important;
      }
      
      .animate-fade-in,
      .animate-slide-in-up,
      .animate-slide-in-left,
      .animate-slide-in-right {
        animation: none !important;
        opacity: 1 !important;
        transform: none !important;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Adds reduced motion styles
   */
  private addReducedMotionStyles(): void {
    document.body.classList.add('reduced-motion');
  }

  /**
   * Adjusts interface for high contrast
   */
  private adjustForHighContrast(): void {
    document.body.classList.add('high-contrast');
  }

  /**
   * Adds focus indicator to an element
   */
  private addFocusIndicator(element: HTMLElement): void {
    element.addEventListener('focus', () => {
      if (element.classList.contains('focus-visible')) {
        element.style.outline = '2px solid #0066cc';
        element.style.outlineOffset = '2px';
      }
    });

    element.addEventListener('blur', () => {
      element.style.outline = '';
      element.style.outlineOffset = '';
    });
  }

  /**
   * Adds skip links for keyboard navigation
   */
  private addSkipLinks(): void {
    // Check if skip links already exist
    if (document.querySelector('.skip-links')) {
      return;
    }

    const skipLinksContainer = document.createElement('div');
    skipLinksContainer.className = 'skip-links';
    skipLinksContainer.setAttribute('role', 'navigation');
    skipLinksContainer.setAttribute('aria-label', 'Skip links');

    const skipLinks = [
      { href: '#main-content', text: 'Skip to main content' },
      { href: '#navigation', text: 'Skip to navigation' },
      { href: '#footer', text: 'Skip to footer' }
    ];

    skipLinks.forEach(link => {
      const skipLink = document.createElement('a');
      skipLink.href = link.href;
      skipLink.textContent = link.text;
      skipLink.className = 'skip-link';
      
      skipLink.addEventListener('click', (e) => {
        const target = document.querySelector(link.href);
        if (target) {
          e.preventDefault();
          (target as HTMLElement).focus();
          if ((target as HTMLElement).scrollIntoView) {
            (target as HTMLElement).scrollIntoView({ behavior: 'smooth' });
          }
        }
      });

      skipLinksContainer.appendChild(skipLink);
    });

    document.body.insertBefore(skipLinksContainer, document.body.firstChild);
  }

  /**
   * Adds alternative text for animated elements
   */
  private addAlternativeText(element: HTMLElement): void {
    if (!element.getAttribute('alt') && !element.getAttribute('aria-label')) {
      element.setAttribute('aria-label', 'Interactive animated element');
    }
  }

  /**
   * Adds ARIA labels for animated content
   */
  private addAriaLabels(element: HTMLElement): void {
    if (!element.getAttribute('role')) {
      element.setAttribute('role', 'img');
    }
    
    if (!element.getAttribute('aria-describedby')) {
      const descId = `desc-${Math.random().toString(36).substr(2, 9)}`;
      const description = document.createElement('div');
      description.id = descId;
      description.className = 'sr-only';
      description.textContent = 'Animated content for visual enhancement';
      
      element.setAttribute('aria-describedby', descId);
      element.appendChild(description);
    }
  }
}