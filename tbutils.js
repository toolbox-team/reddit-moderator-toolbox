(function (TBUtils) {

    // We need these before we can do anything.
    TBUtils.modhash = $("form.logout input[name=uh]").val();
    TBUtils.logged = (TBUtils.modhash !== undefined) ? $('span.user a:first').html() : '';
    TBUtils.post_site = $('.redditname a:first').html();  

    //Private variables
    //NOTE: neither TBUtils.setting, nor $.log have been initialized.  Don't use either.
    var modMineURL = 'http://www.reddit.com/subreddits/mine/moderator.json?count=100',
        now = new Date().getTime(),
        lastgetLong = JSON.parse(localStorage['Toolbox.cache.lastgetlong'] || -1),
        lastgetShort = JSON.parse(localStorage['Toolbox.cache.lastgetshort'] || -1),
        shortLength = JSON.parse(localStorage['Toolbox.cache.shortlength'] || 15),
        longLength = JSON.parse(localStorage['Toolbox.cache.longlength'] || 45),
        cacheName = localStorage['Toolbox.cache.cachename'] || '',
        seenNotes = JSON.parse(localStorage['Toolbox.Utils.seennotes'] || '[]'),
        lastVersion = JSON.parse(localStorage['Toolbox.Utils.lastversion'] || 0),
        //noteLastShown = JSON.parse(localStorage['Toolbox.Utils.notelastshown'] || -1), //TODO: add
        newLogin = (cacheName != TBUtils.logged),
        getnewLong = (((now - lastgetLong) / (60 * 1000) > longLength) || newLogin),
        getnewShort = (((now - lastgetShort) / (60 * 1000) > shortLength) || newLogin),
        settings = JSON.parse(localStorage['Toolbox.Utils.settings'] || '[]')
        usebrowserstorage = false;

    var CHROME = 'chrome', FIREFOX = 'firefox', OPERA = 'opera', SAFARI = 'safari', UNKOWN_BROWSER = 'unknown';
        
    // Public variables
    TBUtils.version = 5;  //don't think we need this anymore.
    TBUtils.toolboxVersion = '2.1.0';
    TBUtils.shortVersion = 210; //don't forget to change this one!  This is used for the 'new version' notification.
    TBUtils.configSchema = 1,
    TBUtils.notesSchema = 4,
    TBUtils.minNotesSchema = 0,
    TBUtils.NO_WIKI_PAGE = 'NO_WIKI_PAGE';
    TBUtils.WIKI_PAGE_UNKNOWN = 'WIKI_PAGE_UNKNOWN';
    TBUtils.isModmail = location.pathname.match(/\/message\/(?:moderator)\/?/);
    TBUtils.isModmailUnread = location.pathname.match(/\/message\/(?:moderator\/unread)\/?/);
    TBUtils.isModpage = location.pathname.match(/\/about\/(?:reports|modqueue|spam|unmoderated)\/?/);
    TBUtils.isEditUserPage = location.pathname.match(/\/about\/(?:contributors|moderator|banned)\/?/);
    TBUtils.isModFakereddit = location.pathname.match(/^\/r\/mod/);
    TBUtils.isToolbarPage = location.pathname.match(/^\/tb\//);
    TBUtils.isUnreadPage = location.pathname.match(/\/message\/(?:unread)\/?/);
    TBUtils.isModLogPage = location.pathname.match(/\/about\/(?:log)\/?/);
    TBUtils.isExtension = true;
    TBUtils.log = [];
    TBUtils.debugMode = JSON.parse(localStorage['Toolbox.Utils.debugMode'] || 'false');
    TBUtils.betaMode = JSON.parse(localStorage['Toolbox.Utils.betaMode'] || 'false');
    TBUtils.browser = UNKOWN_BROWSER;
    TBUtils.firstRun = false;

    // Check our post site.  We might want to do some sort or regex fall back here, if it's needed.
    if (TBUtils.isModFakereddit || TBUtils.post_site === undefined || !TBUtils.post_site) {
        TBUtils.post_site = '';
    }
    
    // Icons 
    TBUtils.icon = 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAHaSURBVDjLlZO7a1NRHMfzfzhIKQ5OHR1ddRRBLA6lg4iT\
                d5PSas37YR56Y2JiHgg21uoFxSatCVFjbl5iNBBiMmUJgWwZhCB4pR9/V4QKfSQdDufF5/v7nu85xwJYprV0Oq0kk8luIpEw4vG48f/eVDiVSikCTobDIePxmGg0yokEBO4OBgNGoxH5fJ5wOHwygVgsZpjVW60WqqqWz\
                bVgMIjf78fn8xlTBcTy736/T7VaJRQKfQoEArqmafR6Pdxu9/ECkUjkglje63Q6NBoNisUihUKBcrlMpVLB6XR2D4df3VQnmRstsWzU63WazSZmX6vV0HWdUqmEw+GY2Gw25SC8dV1l1wrZNX5s3qLdbpPL5fB6vXumZal\
                q2O32rtVqVQ6GuGnCd+HbFnx9AZrC+MkSHo/np8vlmj/M7f4ks6yysyawgB8fwPv70HgKG8v8cp/7fFRO/+AllewqNJ/DhyBsi9A7J1QTkF4E69mXRws8u6ayvSJwRqoG4K2Md+ygxyF5FdbPaMfdlIXUZfiyAUWx/OY25O\
                4JHBP4CtyZ16a9EwuRi1CXs+5K1ew6lB9DXERX517P8tEsPDzfNIP6C5YeQewSrJyeCd4P0bnwXYISy3MCn5oZNtsf3pH46e7XBJcAAAAASUVORK5CYII=';
                
    TBUtils.iconclose = 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAJdSURBVDjLpZP7S1NhGMf9W7YfogSJboSEUVCY8zJ31trcps6z\
                TI9bLGJpjp1hmkGNxVz4Q6ildtXKXzJNbJRaRmrXoeWx8tJOTWptnrNryre5YCYuI3rh+8vL+/m8PA/PkwIg5X+y5mJWrxfOUBXm91QZM6UluUmthntHqplxUml2lciF6wrmdHriI0Wx3xw2hAediLwZRWRkCPzdDswaSvGq\
                kGCfq8VEUsEyPF1O8Qu3O7A09RbRvjuIttsRbT6HHzebsDjcB4/JgFFlNv9MnkmsEszodIIY7Oaut2OJcSF68Qx8dgv8tmqEL1gQaaARtp5A+N4NzB0lMXxon/uxbI8gIYjB9HytGYuusfiPIQcN71kjgnW6VeFOkgh3XcHL\
                vAwMSDPohOADdYQJdF1FtLMZPmslvhZJk2ahkgRvq4HHUoWHRDqTEDDl2mDkfheiDgt8pw340/EocuClCuFvboQzb0cwIZgki4KhzlaE6w0InipbVzBfqoK/qRH94i0rgokSFeO11iBkp8EdV8cfJo0yD75aE2ZNRvSJ0lZK\
                cBXLaUYmQrCzDT6tDN5SyRqYlWeDLZAg0H4JQ+Jt6M3atNLE10VSwQsN4Z6r0CBwqzXesHmV+BeoyAUri8EyMfi2FowXS5dhd7doo2DVII0V5BAjigP89GEVAtda8b2ehodU4rNaAW+dGfzlFkyo89GTlcrHYCLpKD+V7yee\
                HNzLjkp24Uu1Ed6G8/F8qjqGRzlbl2H2dzjpMg1KdwsHxOlmJ7GTeZC/nesXbeZ6c9OYnuxUc3fmBuFft/Ff8xMd0s65SXIb/gAAAABJRU5ErkJggg==';
                
    TBUtils.iconhide = 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAEXSURBVDjLY/j//z8DJZiBLgZkz37Ynjrz4ReyDEideb89afrD\
                f5ET7v4n2YCEqXf7qpY9/T9r76v/Xu03STMgasLteaVLHv+fufvl/6k7X/y3qrlCvAHBvTeXFC54ANbctv7p/95Nz/5rFZ0nzoCAzpuPsuc++D91x4v/jasf/y9aeP9/89rH/6VTTxJngGPDtc3xU+/879789H/5kgf/02fd\
                +V+17OF/yZhjxBmgVXCaRT3v7BqP1mv/a1Y+/J824/b/woX3/osHHSAtECVjjqy0Lb/wP2/+3f+Zs+/8F3XfS3o0inntXWSeffJ/0tRb/0Ucdv4nKyEJW25ZYBh/5L+w5fb/ZCdlQYMNs4WMt/wfuMyEDwMA0Irn/pDRT58A\
                AAAASUVORK5CYII=';
                
    TBUtils.iconshow = 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAEdSURBVDjLY/j//z8DJZiB6gY0rH7xpW7li3YKDHj1v2bli38l\
                ix61k2VA5fJn/9eeeP+/fcOL/wlT7/aRbEDegkf/Vxx/93/xobf/S5c8/u/ecm0eSQYkTX/4f+HBN/8nbX/xf+bul/8Tp9/9r1N0dgnRBgT33QZqfPW/YdXj/42rH//v2vjkv3fHtf9SScceEWWAc8u1/xO2Pv9fsvjB//Il\
                D4CGPPrvXH/5v2Tksc1EGWBaful/+/on/4sW3gfGxsP/9lUX/ksEH1gj6rqdhSgDlPPO/q9b8fB/5bIH/23LL/wXD9i7kqRAlEo6+b908f3/NiXn/4t57V1EcjRKRB75b1145r+o684FZCUkMb8D/0Uct88euMxEKgYA7Ojr\
                v4CgE7EAAAAASUVORK5CYII=';
                
    TBUtils.iconadd= 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAJvSURBVDjLpZPrS5NhGIf9W7YvBYOkhlkoqCklWChv2WyKik7b\
                lnNris72bi6dus0DLZ0TDxW1odtopDs4D8MDZuLU0kXq61CijSIIasOvv94VTUfLiB74fXngup7nvrnvJABJ/5PfLnTTdcwOj4RsdYmo5glBWP6iOtzwvIKSWstI0Wgx80SBblpKtE9KQs/We7EaWoT/8wbWP61gMmCH0lMD\
                vokT4j25TiQU/ITFkek9Ow6+7WH2gwsmahCPdwyw75uw9HEO2gUZSkfyI9zBPCJOoJ2SMmg46N61YO/rNoa39Xi41oFuXysMfh36/Fp0b7bAfWAH6RGi0HglWNCbzYgJaFjRv6zGuy+b9It96N3SQvNKiV9HvSaDfFEIxXIt\
                nPs23BzJQd6DDEVM0OKsoVwBG/1VMzpXVWhbkUM2K4oJBDYuGmbKIJ0qxsAbHfRLzbjcnUbFBIpx/qH3vQv9b3U03IQ/HfFkERTzfFj8w8jSpR7GBE123uFEYAzaDRIqX/2JAtJbDat/COkd7CNBva2cMvq0MGxp0PRSCPF8\
                BXjWG3FgNHc9XPT71Ojy3sMFdfJRCeKxEsVtKwFHwALZfCUk3tIfNR8XiJwc1LmL4dg141JPKtj3WUdNFJqLGFVPC4OkR4BxajTWsChY64wmCnMxsWPCHcutKBxMVp5mxA1S+aMComToaqTRUQknLTH62kHOVEE+VQnjahsc\
                NCy0cMBWsSI0TCQcZc5ALkEYckL5A5noWSBhfm2AecMAjbcRWV0pUTh0HE64TNf0mczcnnQyu/MilaFJCae1nw2fbz1DnVOxyGTlKeZft/Ff8x1BRssfACjTwQAAAABJRU5ErkJggg==';
                
    TBUtils.iconConsole = 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFke\
                XHJZTwAAAIiSURBVBgZpcE7SJZhFMDx/3neV/u8ZlhoVxAkESoyJYoa3BojDCFc25psaS8CWxoEhxAagiCpHCpqaa3AyiIISwjTtHIou3wX/b73nFOPIEG0\
                SL+fuDv/Q04Mjp052ttz6WvR69wBM9wMNcXNMTdcFXPHVVEzGqsrhamphXPjl/tH0p4jPcNVubrQkmM96gpFHQZG0mLFQ/FrnvUqVTzwW+rqXBxoZ71OD80Sp\
                e5GVM4UB9wcNTAcM0fN0MzRzFE3yuq0tTagpkQBdyIJQhAIQQgJJCKkIZAmKf7zBeV3Q1RJidqqlMgyJQpqShQAEUGCkAQhJIIECF5ieW6c\
                +uZ9VD7dJ60ORKZGFNycVSJEAQgihCAkiVD88IDa5i4at3ZRmHsI+RkiMyUKZsoaEQERogBofoFv7+7RsLkJ/XGHLZ2n+P72Bm4ZZkYUskqFVSKI\
                CJGIEH15c5Pm9uOwPMnEtevUN5X4MfOI77OPySoZUXA1ogQQQEQQoPB5Ei0s0bCpiK3MgBuaf0pb71nmn1yhimWiYGasESAA4sris6s07dqPFV/hVqK7\
                rwMrfySXm6ZxxyG6aiaI5MTg2FjLzm39poqpoars2fCUkwdztO6uQfMTuJd5fnuK7r5OJNkINcd4NHphpdpLB8Td+dvE8OH5vQPXtyfhPZ4tAc4fgaSmg\
                8XXL5m+e/5Wyj9kK+Xc5Ghfyc1xM9wMN8PNcTPcHMxw99ZfSC4lgw+6sSMAAAAASUVORK5CYII=';

    TBUtils.iconBox = 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAG9SURBVDjLpZO9apRREIafDVuIhMjGhPwJukashNjoNdgIqQQ\
                    bG8U7ECy0i4UXIMQLEKxtrCwsRMRKbBSCoBhQwRjwZ3e/M/O+FufbTYRYZWA45wznnXk4Z6Zjm8PYFIe0LsDDG/1pm03jy5gpAzbIxga3q2wMv2Q/uPXo8wZAZ/P6qVmbrd7iyd7cUh86HWhFMvvcpKBE4fv2B358+7Rx+/H23\
                    a7Nq+PL/d7c8ipf3r+kjH6jhDSkTAjCRoISZmbhNDMLq4S4c+/K8rmu8fzahYu8fvaEwc+dKm5FIZMJIVMSIsXu1ltmhw1nzq6x8/XjeteG+ZVF1q/dRKMhVqBInElG4igoApXxPlEJpo4t8eaF6drgEIPdd6j5g0KoqCYpSRSh\
                    kq0LlZps+ugJZOjWxxEuSQ6zVohETZIh1LTiNqYQGTVmtwQqiUZBjgKVICfVsj0Ll7GwpYvcI1AkOSyUYTkQN4twCjWB0jgryYTAjYhRkIPyH1zVilETOV19QlCSHAQ5bA7GTaEUDuFxZ9EmsCGLOLJyvv5AGmvvstVWlGt/7zNj\
                    Ovevrjy1uST90+8Hz4HBVYkrwfPOYcf5L9lR/9+EMK8xAAAAAElFTkSuQmCC';
                
    TBUtils.iconCommentRemove = 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAG2SURBVDjLrZNJKIRhGMdHxpTtwIUoRRxdlZvcJsuFc\
                    BAHFHGSSBKlbCUZOTgolLKXskyDshwsJWQLYx+DGcaSsWS+5+95Z5jQzJjirf/hfb9+v+d5l08GQPaXyP5NkFGnDuT0cF45cBENJ9KRYKRvdg9vFgmuxujSkZDscxR2AU/8OBaJCHdPhKsHgv6eoLslnJgIh9eEfYMErcEmr+hcEJKYr\
                    4KworYZ68dLBvV3hDOGj28IBx/wzqWELb1N0NC/IgQJDgXnDJ+aPmAjYe/KBm8yvK5zLrBvQbR/xFW1Rgm7DG9fSNhgeE0nBBaroLJ7UQhiHR6ikHwdopu1M8kq/nGI3s6u0fJ5ZR3qLbtIoyrARFoQpuLlGE70oZb0QM2vD4kl2guTGV\
                    3VmVgticXzWBNoWw1zbzGWC6NRk+o/7Qpuah/fFJ08DiX50RPDUCUBZQFAbTiMjXHoUyrIGRzBOeTkirlom1aGv53NbVUwJnndrfc+wJUeO3IAhl5KZTBxTvI9Maj0IrcErVkhcwt5UdCXhcNQ7oWDXA9MJctRn+I77/Zf15wdOtOvVEii\
                    7QGuzPCsWH8HCxz5pzmy7lQAAAAASUVORK5CYII=';
    
    TBUtils.iconCommentsRemove = 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAIwSURBVDjLhZHLaxNRGMUjaRDBjQtBxAdZFEQE/wEFUau\
                    rLm1FfEGzENwpturG6qIFrYUKXbUudOODNqIiTWqvFEwXKo1UUVRqS2NM0kmaZPKYPKbJ8XzTiUQxceDH3HvnO+e73xnH8X7fLjJInjbgEekiOwA4/sbBD0Ov5sIqY5SVXiO/Rpospw01HphXrOttZPBMxCkWJ3NltZItq3i2pOKZklrWi\
                    9Z5SMuKwf2GBtJVxJotiqWLKpIqqHCyYO3/Z/A8UyirBDtLcZTi6Y+RdxdHAsnTAy/NM0TerCuRlE2Y9El+YjCWoLBkViyxdL40OpNmLuBo0Gvk12AuYC5gLqB2XAw8A2NBFZzXVHm1YnHq1qQpYs4PjgbmAuYC5gLe0jrnWGLwzZqDi33k\
                    sSTunw3JvKZ0FbFmi5gLeDswF2v/h4Ftcm8yaIl9JMtcwFys4midOJQwEOX6ZyInBos18QYJk0yQVhJjLiiald/iTw+GMHN2N6YOuTB9YieCozfE4EvNYDO5Ttz2vn/Q+x5zC3EwEyw9GcaH7v0ovLiN6mcf8g8v4O35vRg+edTr+Ne/tU2O\
                    EV03SvB3uGFQjDvtQM8moM+N+M0D8B92LjQ0sE2+MhdMHXShOutF/ZO6toXnLdVm4o1yA1KYOLI+lrvbBVBU7HYgSZbOOeFvc4abGWwjXrLndefW3jeeVjPS44Z2xYXvnnVQ7S2rvjbn1aYj1BPo3H6ZHRfl2nz/ELGc/wJRo/MQHUFwBgAAAABJRU5ErkJggg==';
    
    // Get cached info.
    TBUtils.noteCache = (getnewShort) ? {} : JSON.parse(localStorage['Toolbox.cache.notecache'] || '{}');
    TBUtils.configCache = (getnewLong) ? {} : JSON.parse(localStorage['Toolbox.cache.configcache'] || '{}');
    TBUtils.noConfig = (getnewShort) ? [] : JSON.parse(localStorage['Toolbox.cache.noconfig'] || '[]');
    TBUtils.noNotes = (getnewShort) ? [] : JSON.parse(localStorage['Toolbox.cache.nonotes'] || '[]');
    TBUtils.mySubs = (getnewLong) ? [] : JSON.parse(localStorage['Toolbox.cache.moderatedsubs'] || '[]');
    
    // Update cache vars as needed.
    if (newLogin) {
        localStorage['Toolbox.cache.cachename'] = TBUtils.logged;
    }
    
    if (getnewLong) {
        localStorage['Toolbox.cache.lastgetlong'] = JSON.stringify(now);
    }
    
    if (getnewShort) {
        localStorage['Toolbox.cache.lastgetshort'] = JSON.stringify(now);
    }
    
    // Get our browser.  Hints: http://jsfiddle.net/9zxvE/383/
    if (typeof (InstallTrigger) !== "undefined") {
        TBUtils.browser = FIREFOX;
    } else if (typeof(chrome) !== "undefined") {
        TBUtils.browser = CHROME;
        
        if (navigator.userAgent.indexOf(' OPR/') >= 0) { // always check after Chrome
            TBUtils.browser = OPERA;
        }
    } else if (Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0) {
        TBUtils.browser = SAFARI;
    }
    
    // First run changes.
    if (TBUtils.shortVersion > lastVersion) {
        TBUtils.firstRun = true; // for use by other modules.
        localStorage['Toolbox.Utils.lastversion'] = JSON.stringify(TBUtils.shortVersion); //set last sersin to this version.

        //** This should be a per-release section of stuff we want to change in each update.  Like setting/converting data/etc.  It should always be removed before the next release. **//
        
        // Start: version changes.
        $.log('Running '+ TBUtils.toolboxVersion +' changes');

        localStorage['Toolbox.Utils.seennotes'] = JSON.stringify([]); //bug fix.
        // 2.1 TODO: convert Notifier.shortcuts2 to Notifier.shortcuts

        // End: version changes.

        // These two should be left for every new release. If there is a new beta feature people want, it should be opt-in, not left to old settings.
        localStorage['Toolbox.Utils.debugMode'] = JSON.stringify(false);
        localStorage['Toolbox.Utils.betaMode'] = JSON.stringify(false);
        TBUtils.debugMode = false;
        TBUtils.betaMode = false;
    }
    
    if (TBUtils.debugMode) {
        var consoleText = 'Toolbox version: ' + TBUtils.toolboxVersion +
                          ', TBUtils version: ' + TBUtils.version +
                          ', Browser: ' + TBUtils.browser +
                          ', Extension: ' + TBUtils.isExtension + 
                          ', Beta features: ' + TBUtils.betaMode +
                          '\n';
        
        TBUtils.log.push(consoleText);
    }
    
    TBUtils.usernotes = {
        ver: TBUtils.notesSchema,
        users: [] //typeof userNotes
    };
    
    TBUtils.note = {
        note: '',
        time: '',
        mod: '',
        link: '',
        type: ''
    };

    TBUtils.warningType = ['spamwatch', 'spamwarn', 'abusewarn', 'ban', 'permban', 'botban'];
    
    TBUtils.config = {
        ver: TBUtils.configSchema,
        domainTags: '',
        removalReasons: '',
        modMacros: '',
    };
    
    TBUtils.setting = function (module, setting, defaultVal, value) {
        $.log("TBUtils.setting() is deprecated, use TBUtils.getSetting and TBUtils.setSetting() instead.");

        if (value !== undefined) {
            return TBUtils.setSetting(module, setting, value);
        } else {
            return TBUtils.getSetting(module, setting, defaultVal);
        }
    };
    TBUtils.setSetting = function (module, setting, value) {
        var storageKey = 'Toolbox.' + module + '.' + setting;
        registerSetting(module, setting);

        if (usebrowserstorage && TBUtils.browser == CHROME) {
            var json = {};
            json[storageKey] = JSON.stringify(value);
            chrome.storage.local.set(json, function (result) {
                chrome.storage.local.get(storageKey, function (result) {
                    $.log(result[storageKey], true);
                    return result[storageKey];
                });
            });
        } else {
            localStorage[storageKey] = JSON.stringify(value);
            return TBUtils.getSetting(module, setting);
        }
    };
    TBUtils.getSetting = function (module, setting, defaultVal) {
        var storageKey = 'Toolbox.' + module + '.' + setting;
        registerSetting(module, setting);

        defaultVal = (defaultVal !== undefined) ? defaultVal : null;

        // Just another javascript sucks issue.
        if (usebrowserstorage && TBUtils.browser == CHROME) {
            chrome.storage.local.get(storageKey, function (result) {
                val = result[storageKey];
                $.log(storageKey, true);
                $.log(result[storageKey],true);
                if (val === undefined) {
                    $.log(defaultVal, true);
                    return defaultVal;
                } else {
                    try {
                        result = JSON.parse(val);
                    } catch (e) {
                        result = val;
                    }
                    return val;
                }
            });
        } else {

            if (localStorage[storageKey] === undefined) {
                return defaultVal;
            } else {
                var storageString = localStorage[storageKey];
                try {
                    result = JSON.parse(storageString);
                } catch (e) {
                    result = storageString;
                }
                return result;
            }
        }
    };
    
    TBUtils.getTypeInfo = function (warningType) {
        var typeInfo = {
            name: '',
            color: '',
            text: ''
        };
        
        switch (String(warningType)) { //not sure why it gets passed as an array.
        case 'spamwatch':
            typeInfo = { color: 'fuchsia', name: 'Watching', text: 'Spam Watch' };
            break;
        case 'spamwarn':
            typeInfo = { color: 'purple', name: 'Warned', text: 'Spam Warning' };
            break;
        case 'abusewarn':
            typeInfo = { color: 'orange', name: 'Warned', text: 'Abuse Warning' };
            break;
        case 'ban':
            typeInfo = { color: 'red', name: 'Banned', text: 'Ban' };
            break;
        case 'permban':
            typeInfo = { color: 'darkred', name: 'Perma-banned', text: 'Permanent Ban' };
            break;
        case 'botban':
            typeInfo = { color: 'black', name: 'Bot Banned', text: 'Shadow Ban' };
            break;
        default:
            typeInfo = { color: '', name: '', text: 'none' };
        }
        
        return typeInfo;
    };

    TBUtils.pageOverlay = function (text, createOrDestroy) {
        if (createOrDestroy !== undefined) {

            // Create the overlay
            if (createOrDestroy) {
                var html = '\
            <div class="mod-toolbox tb-page-overlay">\
            <div class="mod-toolbox tb-overlay-label"></div></div>\
            ';

                $(html).appendTo('body').show();
                $('body').css('overflow', 'hidden');
            }

                // Destory the overlay
            else {
                $('.tb-page-overlay').remove();
                $('body').css('overflow', 'auto');
            }
        }

        // Regardless, update the text.  It doen't matter if you pass text for destory.
        $('.tb-overlay-label').text(text);
    };
    
    TBUtils.alert = function (message, callback) {
        var $noteDiv = $('<div id="tb-notification-alert"><span>' + message + '</span></div>');
        $noteDiv.append('<img src="http://creesch.github.io/reddit-declutter/close.png" class="note-close" title="Close" />'); 
        $noteDiv.appendTo('body');
        
        $noteDiv.click(function (e) {
            $noteDiv.remove();
            if (e.target.className === 'note-close') {
                callback(false);
                return;
            } 
            callback(true);
        });
    };
    
    TBUtils.showNote = function (note) {
        if (!note.id || !note.text) return;
        
        function show(){
            if ($.inArray(note.id, seenNotes) === -1) {
                TBUtils.getSetting('Utils', 'notelastshown', '', now);  // is this used?
                
                TBUtils.alert(note.text, function (resp) {
                    seenNotes.push(note.id);
                    TBUtils.setSetting('Utils', 'seennotes', seenNotes);
                    if (note.link && note.link.match(/^(https?\:|\/)/i) && resp) window.open(note.link);
                });
            }
        }
        
        
        //platform check.
        switch (note.platform) {
        case 'firefox':
            if (TBUtils.browser == FIREFOX && TBUtils.isExtension) show();
            break;
        case 'chrome':
            if (TBUtils.browser == CHROME && TBUtils.isExtension) show();
            break;
        case 'opera':
            if (TBUtils.browser == OPERA && TBUtils.isExtension) show();
            break;
        case 'safari':
            if (TBUtils.browser == SAFARI && TBUtils.isExtension) show();
            break;
        case 'script':
            if (!TBUtils.isExtension) show();
            break;
        case 'all':
            show();
            break;
        default:
            show();
        }
        
    };
    
    TBUtils.notification = function (title, body, url, timeout) {
        if (timeout === undefined) timeout = 15000;
        
        var toolboxnotificationenabled = true;
        
        // check if notifications are enabled. When they are not we simply abort the function. 
        if (toolboxnotificationenabled === false) {
            //console.log('notifications disabled, stopping function');
            return;
        }
        
        // fallback notifications if the browser does not support notifications or the users does not allow them. 
        // Adapted from Sticky v1.0 by Daniel Raftery
        // http://thrivingkings.com/sticky
        
        // Using it without an object
        $.sticky = function (note, options, callback) {
            return $.fn.sticky(note, options, callback);
        };
        
        $.fn.sticky = function (note, options, callback) {
            // Default settings
            var position = 'bottom-right'; // top-left, top-right, bottom-left, or bottom-right 
            
            var settings = {
                'speed': 'fast', // animations: fast, slow, or integer
                'duplicates': true, // true or false
                'autoclose': timeout // integer or false
            };
            
            // Passing in the object instead of specifying a note
            if (!note) {
                note = this.html();
            }
            
            if (options) {
                $.extend(settings, options);
            }
            
            // Variables
            var display = true,
                duplicate = 'no',
                uniqID = Math.floor(Math.random() * 99999);
            
            // Handling duplicate notes and IDs
            $('.sticky-note').each(function () {
                if ($(this).html() == note && $(this).is(':visible')) {
                    duplicate = 'yes';
                    if (!settings.duplicates) {
                        display = false;
                    }
                }
                if ($(this).attr('id') == uniqID) {
                    uniqID = Math.floor(Math.random() * 9999999);
                }
            });
            
            // Make sure the sticky queue exists
            if (!$('body').find('.sticky-queue').html()) {
                $('body').append('<div class="sticky-queue ' + position + '"></div>');
            }
            
            // Can it be displayed?
            if (display) {
                // Building and inserting sticky note
                $('.sticky-queue').prepend('<div class="sticky border-' + position + '" id="' + uniqID + '"></div>');
                $('#' + uniqID).append('<img src="http://creesch.github.io/reddit-declutter/close.png" class="sticky-close" rel="' + uniqID + '" title="Close" />');
                $('#' + uniqID).append('<div class="sticky-note" rel="' + uniqID + '">' + note + '</div>');
                
                // Smoother animation
                var height = $('#' + uniqID).height();
                $('#' + uniqID).css('height', height);
                
                $('#' + uniqID).slideDown(settings.speed);
                display = true;
            }
            
            // Listeners
            $('.sticky').ready(function () {
                // If 'autoclose' is enabled, set a timer to close the sticky
                if (settings.autoclose) {
                    $('#' + uniqID).delay(settings.autoclose).fadeOut(settings.speed);
                }
            });
            // Closing a sticky
            $('.sticky-close').click(function () {
                $('#' + $(this).attr('rel')).dequeue().fadeOut(settings.speed);
            });
            
            // Callback data
            var response = {
                'id': uniqID,
                'duplicate': duplicate,
                'displayed': display,
                'position': position
            };
            
            // Callback function?
            if (callback) {
                callback(response);
            } else {
                return (response);
            }
        };
        
        if (!window.Notification && !window.webkitNotifications) {
            // fallback on a javascript notification 
            //console.log('boring old rickety browser, falling back on jquery based notifications');
            $.sticky('<strong>' + title + '</strong><br><p><a href="' + url + '">' + body + '<a></p>');
            
        } else if (window.Notification && navigator.userAgent.indexOf("Firefox") !== -1) {
            // Do some stuff with window notification for firefox versions that support notifications
            
            // Let's check if the user has granted us permission and if not ask it. 
            window.Notification.requestPermission(function (perm) {
                if (perm == 'granted') {
                    // if everything checks out we can finally show the notification
                    // create the notification    
                    new window.Notification(title, {
                        dir: "auto",
                        body: body,
                        icon: "http://creesch.github.io/reddit-declutter/reddit-icon.png",
                        onshow: function () {
                            if (timeout) setTimeout(this.close(), timeout);
                        },
                        onclick: function () {
                            // Open the page
                            window.open(url);
                            // Remove notification
                            this.cancel();
                        }
                    });
                }
            });
        } else if (window.webkitNotifications) {
            // use the webkit variant for chrome based browsers
            
            if (window.webkitNotifications.checkPermission() === 0) {
                // if everything checks out we can finally show the notification
                
                // create the notification    
                var toolboxnotification = window.webkitNotifications.createNotification('http://creesch.github.io/reddit-declutter/reddit-icon.png', title, body);
                
                // Auto-hide after a while
                toolboxnotification.ondisplay = function (event) {
                    if (timeout) {
                        setTimeout(function () {
                            event.currentTarget.cancel();
                        }, timeout);
                    }
                };
                
                // Define what happens when the notification is clicked. 
                toolboxnotification.onclick = function () {
                    // Open the page
                    window.open(url);
                    // Remove notification
                    this.cancel();
                };
                // Remove notification
                toolboxnotification.show();
                
            } else if (window.webkitNotifications.checkPermission() == 2) {
                // fallback on a javascript notification if permission is not given. 
                //console.log('User will not let us use notifications, fall back on internal version');
                $.sticky('<strong>' + title + '</strong><br><p><a href="' + url + '">' + body + '<a></p>');
                
            } else {
                // Ask for permission. 
                var message = 'Toolbox would like to use native desktop notifications. Click here to allow or deny this, when denied it will use build in notifications <br>Note: notifications can be disabled in preferences.';
                TBUtils.alert(message, function () {
                    window.webkitNotifications.requestPermission();
                    // We could build in a function to show the notifcation that prompted this whole function, but since it is likely a one time occurence I thought it would be a bit over the top.
                });
            }
        }
    };
    
    TBUtils.getModSubs = function (callback) {
        
        // If it has been more than ten minutes, refresh mod cache.
        if (TBUtils.mySubs.length < 1) {
            TBUtils.mySubs = []; //reset list.
            getSubs(modMineURL);
        } else {
            TBUtils.mySubs = TBUtils.saneSort(TBUtils.mySubs);
            
            // Go!
            callback();
        }
        
        function getSubs(URL) {
            $.getJSON(URL, function (json) {
                getSubsResult(json.data.children, json.data.after);
            });
        }
        
        // Callback because reddits/mod/mine is paginated.
        function getSubsResult(subs, after) {
            $(subs).each(function () {
                var sub = this.data.display_name.trim();
                if ($.inArray(sub, TBUtils.mySubs) === -1)
                    TBUtils.mySubs.push(sub);
            });
            
            if (after) {
                var URL = modMineURL + '&after=' + after;
                getSubs(URL);
            } else {
                TBUtils.mySubs = TBUtils.saneSort(TBUtils.mySubs);
                
                // Update the cache.
                localStorage['Toolbox.cache.moderatedsubs'] = JSON.stringify(TBUtils.mySubs);
                
                // Go!
                callback();
            }
        }
    };

    // Because normal .sort() is case sensitive.
    TBUtils.saneSort = function (arr) {
        return arr.sort(function (a, b) {
            if (a.toLowerCase() < b.toLowerCase()) return -1;
            if (a.toLowerCase() > b.toLowerCase()) return 1;
            return 0;
        });
    };

    TBUtils.getThingInfo = function (sender, modCheck) {
        // If we were passed in a .thing, we may have to walk down the tree to
        // find the associated .entry
        var entry = $($(sender).closest('.entry')[0] || $(sender).find('.entry')[0] || sender),
            thing = $($(sender).closest('.thing')[0] || sender),
            user = $(entry).find('.author:first').text() || $(thing).find('.author:first').text(),
            subreddit = TBUtils.post_site || $(entry).find('.subreddit').text() || $(thing).find('.subreddit').text(),
            permalink = $(entry).find('a.bylink').attr('href') || $(entry).find('.buttons:first .first a').attr('href') || $(thing).find('a.bylink').attr('href') || $(thing).find('.buttons:first .first a').attr('href'),
            domain = ($(entry).find('span.domain:first').text() || $(thing).find('span.domain:first').text()).replace('(', '').replace(')', ''),
            id = $(entry).attr('data-fullname') || $(thing).attr('data-fullname'),

            // These need some fall backs, but only removal reasons use them for now.
            title = thing.find('a.title').length ? thing.find('a.title').text() : '',
            kind = thing.hasClass('link') ? 'submission' : 'comment',
            postlink = thing.find('a.title').attr('href');
        
        if (TBUtils.isEditUserPage && !user) {
            user = $(sender).closest('.user').find('a:first').text() || $(entry).closest('.user').find('a:first').text() || $(thing).closest('.user').find('a:first').text();
        }
        
        
        // If we still don't have a sub, we're in mod mail, or PMs.
        if (TBUtils.isModmail || $(sender).closest('.message-parent')[0] !== undefined) {
            subreddit = (subreddit) ? subreddit : ($(entry).find('.head a:last').text() || $(thing).find('.head a:last').text());

            //This is a weird palce to go about this, and the conditions are strange,
            //but if we're going to assume we're us, we better make damned well sure that is likely the case.
            // if ($(entry).find('.remove-button').text() === '') {
            // The previous check would mistakenly catch removed modmail messages as the user's messages.
            // This check should be safe, since the only time we get no username in modmail is the user's own message. -dakta
            // The '.message-parent' check fixes reddit.com/message/messages/, wich contains mod mail and PMs.
            if (user === '') {
                user = TBUtils.logged;
                
                if (!subreddit || subreddit.indexOf('/r/') < 1) {
                    // Find a better way, I double dog dare ya!
                    subreddit = $(thing).closest('.message-parent').find('.correspondent.reddit.rounded a').text()
                }
            }
        }
        
        // A recent reddit change makes subreddit names sometimes start with "/r/".
        // Mod mail subreddit names additionally end with "/".
        // reddit pls, need consistency
        subreddit = subreddit.replace('/r/', '').replace('/', '').replace('[-]', '').replace('[+]', '').trim();

        // Not a mod, reset current sub.
        if (modCheck && $.inArray(subreddit, TBUtils.mySubs) === -1) {
            subreddit = '';
        }

        if (user == '[deleted]') {
            user = '';
        }

        var approved_text = $(entry).find('.approval-checkmark').attr('title') || $(thing).find('.approval-checkmark').attr('title') || '';
        approved_by = approved_text.match(/by\s(.+?)\s/) || '';
        
        var info = {
            subreddit: subreddit,
            user: user,
            permalink: permalink,
            domain: domain,
            id: id,
            approved_by: approved_by,
            title: title,
            kind: kind,
            postlink: postlink
        };
        //$.log(info);
        return info;
    };
    
    // Prevent page lock while parsing things.  (stolen from RES)
    TBUtils.forEachChunked = function (array, chunkSize, delay, call, complete) {
        if (array === null) return;
        if (chunkSize === null || chunkSize < 1) return;
        if (delay === null || delay < 0) return;
        if (call === null) return;
        var counter = 0;
        //var length = array.length;
        
        function doChunk() {
            for (var end = Math.min(array.length, counter + chunkSize); counter < end; counter++) {
                var ret = call(array[counter], counter, array);
                if (ret === false) return;
            }
            if (counter < array.length) {
                window.setTimeout(doChunk, delay);
            } else {
                if (complete) complete();
            }
        }
        window.setTimeout(doChunk, delay);
    };
    
    // Reddit API stuff
    TBUtils.postToWiki = function (page, subreddit, data, isJSON, updateAM, callback) {
        
        if (isJSON) {
            // Not indenting saves precious bytes.
            data = JSON.stringify(data, undefined, TBUtils.debugMode ? 2 : undefined);
        }
        
        $.post('/r/' + subreddit + '/api/wiki/edit', {
            content: data,
            page: page,
            reason: 'updated via toolbox config',
            uh: TBUtils.modhash
        })
        
        .error(function (err) {
            callback(false, err.responseText);
        })
        
        .success(function () {
            // Callback regardless of what happens next.  We wrote to the page.
            callback(true);
            
            if (updateAM) {
                $.post('/api/compose', {
                    to: 'automoderator',
                    uh: TBUtils.modhash,
                    subject: subreddit,
                    text: 'update'
                })
                    .success(function () {
                        alert('sucessfully sent update PM to automoderator');
                    })
                    .error(function () {
                        alert('error sending update PM to automoderator');
                        window.location = 'http://www.reddit.com/message/compose/?to=AutoModerator&subject=' + subreddit + '&message=update';
                    });
            }
            
            setTimeout(function () {
                
                // Set page access to 'mod only'.
                $.post('/r/' + subreddit + '/wiki/settings/' + page, {
                    permlevel: 2,
                    uh: TBUtils.modhash
                })
                
                // Super extra double-secret secure, just to be safe.
                .error(function (err) {
                    alert('error setting wiki page to mod only access');
                    window.location = 'http://www.reddit.com/r/' + subreddit + '/wiki/settings/' + page;
                });
                
            }, 500);
        });
    };

    // reddit HTML encodes all of their JSON responses, we need to HTMLdecode
    // them before parsing.
    TBUtils.unescapeJSON = function(val) {
        if(typeof(val) == "string") {
            val = val.replace(/&quot;/g, '"')
                .replace(/&gt;/g, ">").replace(/&lt;/g, "<")
                .replace(/&amp;/g, "&");
        }
        return val;
    }

    TBUtils.readFromWiki = function (subreddit, page, isJSON, callback) {
        // We need to demangle the JSON ourselves, so we have to go about it this way :(
        $.ajax('http://www.reddit.com/r/' + subreddit + '/wiki/' + page + '.json', {
            dataType: "json",
            dataFilter: function(data, type) {
                //TODO: right now a lot of functions implicitly rely on reddit
                //returning escaped JSON to operate safely. add this back in once
                //everything's been audited.
                
                //return TBUtils.unescapeJSON(data);
                return data;
            }
        })
        .done(function (json) {
            var wikiData = json.data.content_md;

            if (!wikiData) {
                callback(TBUtils.NO_WIKI_PAGE);
                return;
            }
            
            if (isJSON) {
                wikiData = JSON.parse(wikiData);
                if (wikiData) {
                    callback(wikiData);
                } else {
                    callback(TBUtils.NO_WIKI_PAGE);
                }
                return;
            }
            
            // We have valid data, but it's not JSON.
            callback(wikiData);
            
        })
        .fail(function (jqXHR, textStatus, e) {
            if (!jqXHR.responseText) {
                callback(TBUtils.WIKI_PAGE_UNKNOWN);
                return;
            }
            
            var reason = JSON.parse(jqXHR.responseText).reason || '';
            if (reason == 'PAGE_NOT_CREATED' || reason == 'WIKI_DISABLED') {
                callback(TBUtils.NO_WIKI_PAGE);
            } else {
                // we don't know why it failed, we should not try to write to it.
                callback(TBUtils.WIKI_PAGE_UNKNOWN);
            }
        });
    };

    TBUtils.redditLogin = function (uname, pass, remeber, callback) {
        $.post('/api/login', {
            api_type: 'json',
            passwd: pass,
            user: uname,
            rem: remeber
        })
        .success(function () {
            if (typeof callback !== "undefined")
                callback(true);
        })
        .error(function (error) {
            $.log(error, true);
            if (typeof callback !== "undefined")
                callback(false, error);
        });
    };

    TBUtils.getBanState = function (subreddit, user, callback) {
        $.get("http://www.reddit.com/r/" + subreddit + "/about/banned/.json", { user: user }, function (data) {
            var banned = data.data.children;

            // If it's over or under exactly one item they are not banned or that is not their full name.
            if (banned.length !== 1) {
                return callback(false);
            }

            callback(true, banned[0].note, banned[0].date, banned[0].name);
        });
    };

    TBUtils.flairPost = function(postLink, subreddit, text, css, callback) {
        $.post('/api/flair', {
            api_type: 'json',
            link: postLink,
            text: text,
            css_class: css,
            r: subreddit,
            uh: TBUtils.modhash
        })
        .success(function() {
            if(typeof callback !== "undefined")
                callback(true);
        })
        .error(function(error) {
            if(typeof callback !== "undefined")
                callback(false, error);
        });
    };
    
    TBUtils.distinguishThing = function(id, callback) {
        $.post('/api/distinguish/yes', {
            id: id,
            uh: TBUtils.modhash
        })
        .success(function() {
            if(typeof callback !== "undefined")
                callback(true);
        })
        .error(function(error) {
            if(typeof callback !== "undefined")
                callback(false, error);
        });
    };
    
    TBUtils.approveThing = function(id, callback) {
        $.post('/api/approve', {
            id: id,
            uh: TBUtils.modhash
        })
        .success(function() {
            if(typeof callback !== "undefined")
                callback(true);
        })
        .error(function(error) {
            if(typeof callback !== "undefined")
                callback(false, error);
        });
    };
    
    TBUtils.postComment = function(parent, text, callback) {
        $.post('/api/comment', {
            parent: parent,
            uh: TBUtils.modhash,
            text: text,
            api_type: 'json'
        })
        .success(function(response) {
            if(typeof callback !== "undefined")
                callback(true, response);
            return;
        })
        .error(function(error) {
            if(typeof callback !== "undefined")
                callback(false, error);
            return;
        });
    };
    
    TBUtils.postLink = function(link, title, subreddit, callback) {
        $.post('/api/submit', {
            kind: 'link',
            resubmit: 'true',
            url: link,
            uh: TBUtils.modhash,
            title: title,
            sr: subreddit,
            api_type: 'json'
        })
        .success(function(response) {
            if(typeof callback !== "undefined")
                callback(true, response);
        })
        .error(function(error) {
            if(typeof callback !== "undefined")
                callback(false, error);
        });
    };
    
    TBUtils.sendPM = function(to, subject, text, callback) {
        $.post('/api/compose', {
            to: to,
            uh: TBUtils.modhash,
            subject: subject,
            text: text
        })
        .success(function() {
            if(typeof callback !== "undefined")
                callback(true);
        })
        .error(function(error) {
            if(typeof callback !== "undefined")
                callback(false, error.responseText);
        });
    };
    
    TBUtils.banUser = function(user, subreddit, reason, callback) {
        $.post('/api/friend', {
            uh: TBUtils.modhash,
            type: 'banned',
            name: user,
            r: subreddit,
            note: (reason == null) ? '' : reason,
            api_type: 'json'
        })
        .done(function(data) {
            if(typeof callback !== "undefined")
                callback();
        });
    };
    
    // Utility methods
    
    TBUtils.removeQuotes = function(string) {
        return string.replace(/['"]/g, '');
    }
    
    // Added back for MMP's live mod mail. 
    TBUtils.compressHTML = function (src) {
        return src.replace(/(\n+|\s+)?&lt;/g, '<').replace(/&gt;(\n+|\s+)?/g, '>').replace(/&amp;/g, '&').replace(/\n/g, '').replace(/child" >  False/, 'child">');
    };

    TBUtils.addToSiteTaable = function (URL, callback) {
        if (!URL || !callback) callback(null);

        $.get(URL, function (resp) {
            if (!resp) callback(null);

            resp = resp.replace(/<script(.|\s)*?\/script>/g, '');
            var $sitetable = $(resp).find('#siteTable');
            $sitetable.find('.nextprev').remove();

            if ($sitetable) {
                callback($sitetable);
            } else {
                callback(null);
            }

        });
    }

    // easy way to simulate the php html encode and decode functions
    TBUtils.htmlEncode = function (value) {
        //create a in-memory div, set it's inner text(which jQuery automatically encodes)
        //then grab the encoded contents back out.  The div never exists on the page.
        return $('<div/>').text(value).html();
    };

    TBUtils.htmlDecode = function (value) {
        return $('<div/>').html(value).text();
    };

    TBUtils.clearCache = function () {
        $.log('TBUtils.clearCache()');

        TBUtils.noteCache = {};
        TBUtils.configCache = {};
        TBUtils.noConfig = [];
        TBUtils.noNotes = [];
        TBUtils.mySubs = [];

        //window.location.reload(); //casues way too many issues with callbacks and timouts.
    };

    TBUtils.getReasonsFromCSS = function (sub, callback) {

        // If not, build a new one, getting the XML from the stylesheet
        $.get('http://www.reddit.com/r/' + sub + '/about/stylesheet.json').success(function (response) {
            if (!response.data) {
                callback(false);
                return;
            }

            // See if this subreddit is configured for leaving reasons using <removalreasons2>
            var match = response.data.stylesheet.replace(/\n+|\s+/g, ' ')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .match(/<removereasons2>.+<\/removereasons2>/i);
                
            // Try falling back to <removalreasons>
            if (!match) {
                match = response.data.stylesheet.replace(/\n+|\s+/g, ' ')
                    .replace(/&lt;/g, '<')
                    .replace(/&gt;/g, '>')
                    .match(/<removereasons>.+<\/removereasons>/i);
            }
            
            // Neither can be found.    
            if (!match) {
                callback(false);
                return;
            }
            
            // Create valid XML from parsed string and convert it to a JSON object.
            var XML = $(match[0]);
            var reasons = [];
            
            XML.find('reason').each(function () {
                var reason = {
                    text: escape(this.innerHTML)
                };
                reasons.push(reason);
            });
            
            var oldReasons = {
                pmsubject: XML.find('pmsubject').text() || '',
                logreason: XML.find('logreason').text() || '',
                header: escape(XML.find('header').text() || ''),
                footer: escape(XML.find('footer').text() || ''),
                logsub: XML.find('logsub').text() || '',
                logtitle: XML.find('logtitle').text() || '',
                bantitle: XML.find('bantitle').text() || '',
                getfrom: XML.find('getfrom').text() || '',
                reasons: reasons
            };
            
            callback(oldReasons);
        }).error(function () {
            callback(false);
        });
    };

    // Private functions
    function registerSetting(module, setting) {
        // First parse out any of the ones we never want to save.
        if (module === 'cache') return;

        var keyName = module + '.' + setting;

        if ($.inArray(keyName, settings) === -1) {
            settings.push(keyName);

            localStorage['Toolbox.Utils.settings'] = JSON.stringify(TBUtils.saneSort(settings));
        }
    }

    // NER, load more comments, and mod frame support.
    $('div.content').on('DOMNodeInserted', function (e) {
        if (e.target.className != 'sitetable linklisting' && e.target.parentNode.className !== 'morecomments' && !$(e.target).hasClass('flowwit')) return;
        $.log("TBNewThings firing" + ($(e.target).hasClass('flowwit')) ? ' (flowitt)' : '');
        
        // Wait a sec for stuff to laod.
        setTimeout(function () {
            var event = new CustomEvent("TBNewThings");
            window.dispatchEvent(event);
        }, 1000);
    });

    window.onbeforeunload = function () {
        
        // Cache data.
        localStorage['Toolbox.cache.configcache'] = JSON.stringify(TBUtils.configCache);
        localStorage['Toolbox.cache.notecache'] = JSON.stringify(TBUtils.noteCache);
        localStorage['Toolbox.cache.noconfig'] = JSON.stringify(TBUtils.noConfig);
        localStorage['Toolbox.cache.nonotes'] = JSON.stringify(TBUtils.noNotes);
        localStorage['Toolbox.cache.moderatedsubs'] = JSON.stringify(TBUtils.mySubs);
        
    };


    // get toolbox news
    (function getNotes() {
        TBUtils.readFromWiki('toolbox', 'tbnotes', true, function (resp) {
            if (!resp || resp === TBUtils.WIKI_PAGE_UNKNOWN || resp === TBUtils.NO_WIKI_PAGE || resp.length < 1) return;
            if (resp.stableVerson > TBUtils.shortVersion && TBUtils.browser == 'firefox' && TBUtils.isExtension) {
                TBUtils.alert("There is a new version of Toolbox for Firefox!  Click here to update.", function (clicked) {
                    if (clicked) window.open("http://creesch.github.io/reddit-declutter/reddit_mod_tb.xpi");
                });
                return; //don't spam the user with notes until they have the current version.
            }
            $(resp.notes).each(function () {
                TBUtils.showNote(this);
            });
        });
        
        //check dev sub, if debugMode
        if (!TBUtils.debugMode) return; 
        TBUtils.readFromWiki('tb_dev', 'tbnotes', true, function (resp) {
            if (!resp || resp === TBUtils.WIKI_PAGE_UNKNOWN || resp === TBUtils.NO_WIKI_PAGE || resp.length < 1) return;
            if (resp.devVersion > TBUtils.shortVersion && TBUtils.isExtension) {
                TBUtils.alert("There is a new development version of Toolbox!  Click here to update.", function (clicked) {
                    if (clicked) window.open("https://github.com/creesch/reddit-moderator-toolbox");
                });
                //return; //do spam?  I donno.
            }
            $(resp.notes).each(function () {
                TBUtils.showNote(this);
            });
        });
    })();
    
}(TBUtils = window.TBUtils || {}));
