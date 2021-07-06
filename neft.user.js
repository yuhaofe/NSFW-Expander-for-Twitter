// ==UserScript==
// @name                NSFW Expander for Twitter
// @name:zh             Twitter 敏感内容自动展开
// @name:zh-CN          Twitter 敏感内容自动展开
// @namespace           https://github.com/flyhaozi
// @version             0.1.0
// @description         Expand NSFW contents and accounts on Twitter automatically without logging in
// @description:zh      自动展开 Twitter 上的敏感内容和主页，无须登录账号
// @description:zh-CN   自动展开 Twitter 上的敏感内容和主页，无须登录账号
// @author              flyhaozi
// @match               https://twitter.com/*
// @grant               none
// ==/UserScript==
 
(function () {
    'use strict';
 
    const config = { attributes: false, childList: true, subtree: false };
    const callback = function (mutationsList, observer) {
        for (const mutation of mutationsList) {
            for (const elm of mutation.addedNodes) {
                expandNSFW(elm);
            }
        }
    };
    const observer = new MutationObserver(callback);
    findAndObserveTweetsContainer();
 
    // redo on url change
    const pushState = history.pushState;
    history.pushState = function () {
        pushState.apply(history, arguments);
        setTimeout(findAndObserveTweetsContainer, 200);
    };
    window.addEventListener('popstate', function () {
        setTimeout(findAndObserveTweetsContainer, 200);
    });
 
    function findAndObserveTweetsContainer() {
        let container = null;
        let warning = null;
        const column = document.querySelector('#react-root main div[data-testid="primaryColumn"]');
        if (column) {
            container = column.querySelector('div[style*="relative"]');
            warning = column.querySelector('div[data-testid="emptyState"]');
        }
 
        if (warning) {
            const viewProfileButton = warning.querySelector('div[role="button"]');
            viewProfileButton.click();
        }
 
        if (container) {
            for (const elm of container.children) {
                expandNSFW(elm);
            }
            observer.observe(container, config);
        } else {
            setTimeout(findAndObserveTweetsContainer, 200);
        }
    }
 
    function expandNSFW(elm) {
        const contentUC = elm.querySelector('article a[href="/settings/content_you_see"]');
        if (contentUC) {
            const viewTweetButton = contentUC.parentElement.parentElement.parentElement.children[1].children[0];
            if (viewTweetButton) {
                viewTweetButton.click();
            }
        }
    }
})();