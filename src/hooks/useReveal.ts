'use client';
import { useEffect } from 'react';

export const useReveal = () => {
  useEffect(() => {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          revealObserver.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.05,
      rootMargin: '0px 0px -30px 0px'
    });

    const observeElements = () => {
      const revealElements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale');
      revealElements.forEach(el => {
        if (!el.classList.contains('revealed') && !el.hasAttribute('data-observed')) {
          const delay = (el as HTMLElement).dataset.revealDelay;
          if (delay) {
            (el as HTMLElement).style.transitionDelay = `${delay}ms`;
          }
          el.setAttribute('data-observed', 'true');
          revealObserver.observe(el);
        }
      });
    };

    observeElements();

    const mutationObserver = new MutationObserver(() => {
      observeElements();
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true
    });

    return () => {
      revealObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, []);
};
