// ==UserScript==
// @name         ChatGPT Temporary Chat Tab Protection
// @namespace    http://tampermonkey.net/
// @version      3.0
// @description  Prevent accidental reload/closing of temporary ChatGPT chats
// @match        https://chatgpt.com/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function () {
    'use strict';

    let unloadAttached = false;
    let lastPath = location.pathname;


    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    function triggerUrlChange() {
        const newPath = location.pathname;
        if (newPath !== lastPath) {
            lastPath = newPath;
            checkAndApplyGuard();
        }
    }

    history.pushState = function () {
        originalPushState.apply(this, arguments);
        triggerUrlChange();
    };

    history.replaceState = function () {
        originalReplaceState.apply(this, arguments);
        triggerUrlChange();
    };

    window.addEventListener('popstate', () => {
        triggerUrlChange();
    });

    const observer = new MutationObserver(() => {
        triggerUrlChange();
    });

    window.addEventListener('load', () => {
        observer.observe(document.body, { childList: true, subtree: true });
        checkAndApplyGuard();
    });

    function isTemporaryChat() {
        const path = location.pathname;
        const isSaved = path.startsWith('/c/');
        const isTemp =
            path === '/' ||
            path === '/chat' ||
            path === '/chat/' ||
            path === '/chat/new' ||
            path === '/#';

        return !isSaved && isTemp;
    }

    function attachUnloadGuard() {
        if (!unloadAttached) {
            window.addEventListener('beforeunload', beforeUnloadHandler);
            unloadAttached = true;
        }
    }

    function detachUnloadGuard() {
        if (unloadAttached) {
            window.removeEventListener('beforeunload', beforeUnloadHandler);
            unloadAttached = false;
        }
    }

    function beforeUnloadHandler(e) {
        if (isTemporaryChat()) {
            e.preventDefault();
            e.returnValue = '';
            return '';
        }
    }

    function checkAndApplyGuard() {
        if (isTemporaryChat()) {
            attachUnloadGuard();
        } else {
            detachUnloadGuard();
        }
    }

})();
