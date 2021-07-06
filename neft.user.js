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
// @require             https://cdn.jsdelivr.net/npm/lodash@4.17.21/lodash.min.js
// @match               https://twitter.com/*
// @grant               none
// ==/UserScript==

(function () {
    'use strict';
    const rules = [
        {   // User Profile
            regex: /^https:\/\/twitter\.com\/i\/api\/graphql\/.+\/UserByScreenNameWithoutResults/i,
            paths: [
                ['data.user.legacy.profile_interstitial_type', '']
            ]
        },
        {   // User Timeline
            regex: /^https:\/\/twitter\.com\/i\/api\/graphql\/.+\/User(Tweets|Media)/i,
            paths: [
                ['data.user.result.timeline.timeline.instructions[0].entries', [
                    ['content.itemContent.tweet_results.result.legacy.possibly_sensitive', false],
                    ['content.itemContent.tweet_results.result.legacy.retweeted_status_result.result.legacy.possibly_sensitive', false],
                    ['content.itemContent.tweet_results.result.core.user.legacy.profile_interstitial_type', '']
                ]],
                ['data.user.result.timeline.timeline.instructions[1].entry.content.itemContent.tweet_results.result.legacy.possibly_sensitive', false],
                ['data.user.result.timeline.timeline.instructions[1].entry.content.itemContent.tweet_results.result.core.user.legacy.profile_interstitial_type', '']
            ],
        },
        {   // Tweet Timeline
            regex: /^https:\/\/twitter\.com\/i\/api\/\d+\/timeline\/conversation\/\d+.json/i,
            paths: [
                ['globalObjects.tweets', [
                    ['possibly_sensitive', false]
                ]],
            ],
        },
        {   // Search Timeline
            regex: /^https:\/\/twitter\.com\/i\/api\/\d+\/search\/adaptive.json/i,
            paths: [
                ['globalObjects.tweets', [
                    ['possibly_sensitive', false]
                ]],
            ],
        }
    ];

    const originalOpen = window.XMLHttpRequest.prototype.open;
    window.XMLHttpRequest.prototype.open = function (...args) {
        const url = args[1];
        for (const rule of rules) {
            if (rule.regex.test(url)) {
                this.addEventListener('readystatechange', function (e) {
                    if (this.readyState === 4) {
                        modifyResponse.call(this, e.target.responseText, rule);
                    }
                });
                break;
            }
        }
        return originalOpen.apply(this, args);
    };

    function modifyResponse(originalText, rule) {
        let modifiedText = originalText;
        const originalObj = JSON.parse(originalText);
        if (originalObj) {
            let modifiedObj = originalObj;
            const modifyValueByPaths = function (obj, paths) {
                for (let [path, value] of paths) {
                    if (Array.isArray(value)) {
                        const arr = _.get(obj, path);
                        _.forOwn(arr, function (v, key) {
                            modifyValueByPaths(arr[key], value);
                        });
                        _.set(obj, path, arr);
                    } else {
                        _.set(obj, path, value);
                    }
                }
            }
            modifyValueByPaths(modifiedObj, rule.paths);
            modifiedText = JSON.stringify(modifiedObj);
        }
        Object.defineProperty(this, 'response', { writable: true });
        Object.defineProperty(this, 'responseText', { writable: true });
        this.response = this.responseText = modifiedText;
    }
})();