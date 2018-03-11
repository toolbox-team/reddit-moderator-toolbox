/** @namespace  TBui */
(function (TBui) {
    const $body = $('body');
    TBui.longLoadArray = [];
    TBui.longLoadArrayNonPersistent = [];

    // new profiles have some weird css going on. This remedies the weirdness...
    window.addEventListener('TBNewPage', function (event) {
        if(event.detail.pageType === 'userProfile') {
            $body.addClass('mod-toolbox-profile');
        } else {
            $body.removeClass('mod-toolbox-profile');
        }

    });

    // We don't want brack-buttons to propagate to parent elements as that often triggers the reddit lightbox
    $body.on('click', '.tb-bracket-button', function(event) {
        event.stopPropagation();
    });

    const subredditColorSalt = TBStorage.getSetting('QueueTools', 'subredditColorSalt', 'PJSalt');



    // Icons NOTE: string line length is ALWAYS 152 chars
    TBui.iconWrench = `iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAHaSURBVDjLlZO7a1NRHMfzfzhIKQ5OHR1d
                    dRRBLA6lg4iTd5PSas37YR56Y2JiHgg21uoFxSatCVFjbl5iNBBiMmUJgWwZhCB4pR9/V4QKfSQdDufF5/v7nu85xwJYprV0Oq0kk8luIpEw4vG48f/eVDiVSikCTobDIePxmGg0yokEBO4OBgNGoxH5
                    fJ5wOHwygVgsZpjVW60WqqqWzbVgMIjf78fn8xlTBcTy736/T7VaJRQKfQoEArqmafR6Pdxu9/ECkUjkglje63Q6NBoNisUihUKBcrlMpVLB6XR2D4df3VQnmRstsWzU63WazSZmX6vV0HWdUqmEw+GY
                    2Gw25SC8dV1l1wrZNX5s3qLdbpPL5fB6vXumZalq2O32rtVqVQ6GuGnCd+HbFnx9AZrC+MkSHo/np8vlmj/M7f4ks6yysyawgB8fwPv70HgKG8v8cp/7fFRO/+AllewqNJ/DhyBsi9A7J1QTkF4E69mX
                    Rws8u6ayvSJwRqoG4K2Md+ygxyF5FdbPaMfdlIXUZfiyAUWx/OY25O4JHBP4CtyZ16a9EwuRi1CXs+5K1ew6lB9DXERX517P8tEsPDzfNIP6C5YeQewSrJyeCd4P0bnwXYISy3MCn5oZNtsf3pH46e7X
                    BJcAAAAASUVORK5CYII=`;

    TBui.iconDelete = `iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAJdSURBVDjLpZP7S1NhGMf9W7YfogSJboSE
                    UVCY8zJ31trcps6zTI9bLGJpjp1hmkGNxVz4Q6ildtXKXzJNbJRaRmrXoeWx8tJOTWptnrNryre5YCYuI3rh+8vL+/m8PA/PkwIg5X+y5mJWrxfOUBXm91QZM6UluUmthntHqplxUml2lciF6wrmdHri
                    I0Wx3xw2hAediLwZRWRkCPzdDswaSvGqkGCfq8VEUsEyPF1O8Qu3O7A09RbRvjuIttsRbT6HHzebsDjcB4/JgFFlNv9MnkmsEszodIIY7Oaut2OJcSF68Qx8dgv8tmqEL1gQaaARtp5A+N4NzB0lMXxo
                    n/uxbI8gIYjB9HytGYuusfiPIQcN71kjgnW6VeFOkgh3XcHLvAwMSDPohOADdYQJdF1FtLMZPmslvhZJk2ahkgRvq4HHUoWHRDqTEDDl2mDkfheiDgt8pw340/EocuClCuFvboQzb0cwIZgki4KhzlaE
                    6w0InipbVzBfqoK/qRH94i0rgokSFeO11iBkp8EdV8cfJo0yD75aE2ZNRvSJ0lZKcBXLaUYmQrCzDT6tDN5SyRqYlWeDLZAg0H4JQ+Jt6M3atNLE10VSwQsN4Z6r0CBwqzXesHmV+BeoyAUri8EyMfi2
                    FowXS5dhd7doo2DVII0V5BAjigP89GEVAtda8b2ehodU4rNaAW+dGfzlFkyo89GTlcrHYCLpKD+V7yeeHNzLjkp24Uu1Ed6G8/F8qjqGRzlbl2H2dzjpMg1KdwsHxOlmJ7GTeZC/nesXbeZ6c9OYnuxU
                    c3fmBuFft/Ff8xMd0s65SXIb/gAAAABJRU5ErkJggg==`;

    TBui.iconClose = `iVBORw0KGgoAAAANSUhEUgAAAA4AAAAOCAYAAAAfSC3RAAAA1klEQVQoz6WSOw6CQBCG90gWXsjKxph4HZAEsgUSHlsAAa6ilzDGgopxP5Ix2K7FJH/+x+wMjBERoxXH8d5aey2K4l6W5ZMCw6FtvV+Q
                    pumlrut313UyDIOM47gWGA4Nz08QomkaadtW+r5fA9M0rQWGQ8OjYRNF0c53mxH8aLc8z8/OuYWXKDAcGh68ZAzzMwpdveFEtyzLDt6AScBwaHjwkjF++cem+6zGJEmOlDZCUx8ZU1XVS3eC9K8sGtAG
                    cGi6M5nwYPCowR8n+HcEH8BfJxdy5B8L5i9vzgm5WAAAAABJRU5ErkJggg==`;

    TBui.iconHide = `iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAEeSURBVHjaYvz//z8DJYAR3YD0WWdxqQUp
                    PDAzzdgRVRRoADJOmX4Km9j/M0///wfR6HJM6Nb8+fMHhZ845fj/DD9TrHIgwIIu8PfvX4azzyDsiauP/M8PtWH48w8hhw4wXPD7928w3bNsP1jzd6Clv/9BMVQOrwtAzuxYtPt/RZwrw8ef+L2H1QCg
                    Lf9rk70YXn3FjAZsLsDqhVO33zD8BHoXHRNrAOP6HQcYHjx9zfAT6GJkTJQBIH/GRoQwbtqxl+HRs1cMv4A2wzC2MMDqBVCIx0RFMG7atpPh8bOXeGOBCVs6AMU7CMfGxjJu2bad4cmzF2A+UekA3ZkJ
                    CQmMW7ZsYXj+/DlWL2BkJpP0WXgz05mZaY54DSAVAAQYAJIy51a9uUPIAAAAAElFTkSuQmCC`;

    TBui.iconShow = `iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAEiSURBVHjaYvz//z8DJYAFXSB91tn9QMoB
                    iBmxaZiZZowqAHIBMk6Zfur/maf//4NoLHIY6pnQbfjz5w+YzvAzZUiccvw/NjlkgGHA379/Gf78YwDjnCBLhriJR/6ffcbAAMIgOYIG/P79m+E3UDMIfwdamB9qw9CzbP9/mBzBQAQ58xeSRSB2SZQj
                    Q8ei3f+xBSxWF/wE2oyMX31lYKiIcwXJ/SfoArABmF5lOHX7DXFegLkAGTx/+Zph256DDER5ARYGMPzo2SuGTTv2MsRGhDBii0YWXLEAAi9evGTYvnMXQ2J8LCM4ZojxAiwdvHjxgmHHjh0MCQkJjH/+
                    IeSI8sLz588ZtmzZAtZMKCUyoudGk/RZeDPTmZlp+A0gFQAEGAAg59gynHEu1AAAAABJRU5ErkJggg==`;

    TBui.iconAdd = `iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAJvSURBVDjLpZPrS5NhGIf9W7YvBYOkhlko
                    qCklWChv2WyKik7blnNris72bi6dus0DLZ0TDxW1odtopDs4D8MDZuLU0kXq61CijSIIasOvv94VTUfLiB74fXngup7nvrnvJABJ/5PfLnTTdcwOj4RsdYmo5glBWP6iOtzwvIKSWstI0Wgx80SBblpK
                    tE9KQs/We7EaWoT/8wbWP61gMmCH0lMDvokT4j25TiQU/ITFkek9Ow6+7WH2gwsmahCPdwyw75uw9HEO2gUZSkfyI9zBPCJOoJ2SMmg46N61YO/rNoa39Xi41oFuXysMfh36/Fp0b7bAfWAH6RGi0Hgl
                    WNCbzYgJaFjRv6zGuy+b9It96N3SQvNKiV9HvSaDfFEIxXItnPs23BzJQd6DDEVM0OKsoVwBG/1VMzpXVWhbkUM2K4oJBDYuGmbKIJ0qxsAbHfRLzbjcnUbFBIpx/qH3vQv9b3U03IQ/HfFkERTzfFj8
                    w8jSpR7GBE123uFEYAzaDRIqX/2JAtJbDat/COkd7CNBva2cMvq0MGxp0PRSCPF8BXjWG3FgNHc9XPT71Ojy3sMFdfJRCeKxEsVtKwFHwALZfCUk3tIfNR8XiJwc1LmL4dg141JPKtj3WUdNFJqLGFVP
                    C4OkR4BxajTWsChY64wmCnMxsWPCHcutKBxMVp5mxA1S+aMComToaqTRUQknLTH62kHOVEE+VQnjahscNCy0cMBWsSI0TCQcZc5ALkEYckL5A5noWSBhfm2AecMAjbcRWV0pUTh0HE64TNf0mczcnnQy
                    u/MilaFJCae1nw2fbz1DnVOxyGTlKeZft/Ff8x1BRssfACjTwQAAAABJRU5ErkJggg==`;

    TBui.iconConsole = `iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAIiSURBVBgZpcE7SJZhFMDx/3neV/u8Zlho
                        VxAkESoyJYoa3BojDCFc25psaS8CWxoEhxAagiCpHCpqaa3AyiIISwjTtHIou3wX/b73nFOPIEG0SL+fuDv/Q04Mjp052ttz6WvR69wBM9wMNcXNMTdcFXPHVVEzGqsrhamphXPjl/tH0p4jPcNVubrQ
                        kmM96gpFHQZG0mLFQ/FrnvUqVTzwW+rqXBxoZ71OD80Spe5GVM4UB9wcNTAcM0fN0MzRzFE3yuq0tTagpkQBdyIJQhAIQQgJJCKkIZAmKf7zBeV3Q1RJidqqlMgyJQpqShQAEUGCkAQhJIIECF5ieW6c
                        +uZ9VD7dJ60ORKZGFNycVSJEAQgihCAkiVD88IDa5i4at3ZRmHsI+RkiMyUKZsoaEQERogBofoFv7+7RsLkJ/XGHLZ2n+P72Bm4ZZkYUskqFVSKICJGIEH15c5Pm9uOwPMnEtevUN5X4MfOI77OPySoZ
                        UXA1ogQQQEQQoPB5Ei0s0bCpiK3MgBuaf0pb71nmn1yhimWiYGasESAA4sris6s07dqPFV/hVqK7rwMrfySXm6ZxxyG6aiaI5MTg2FjLzm39poqpoars2fCUkwdztO6uQfMTuJd5fnuK7r5OJNkINcd4
                        NHphpdpLB8Td+dvE8OH5vQPXtyfhPZ4tAc4fgaSmg8XXL5m+e/5Wyj9kK+Xc5Ghfyc1xM9wMN8PNcTPcHMxw99ZfSC4lgw+6sSMAAAAASUVORK5CYII=`;

    TBui.iconBox = `iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAG9SURBVDjLpZO9apRREIafDVuIhMjGhPwJ
                    ukashNjoNdgIqQQbG8U7ECy0i4UXIMQLEKxtrCwsRMRKbBSCoBhQwRjwZ3e/M/O+FufbTYRYZWA45wznnXk4Z6Zjm8PYFIe0LsDDG/1pm03jy5gpAzbIxga3q2wMv2Q/uPXo8wZAZ/P6qVmbrd7iyd7c
                    Uh86HWhFMvvcpKBE4fv2B358+7Rx+/H23a7Nq+PL/d7c8ipf3r+kjH6jhDSkTAjCRoISZmbhNDMLq4S4c+/K8rmu8fzahYu8fvaEwc+dKm5FIZMJIVMSIsXu1ltmhw1nzq6x8/XjeteG+ZVF1q/dRKMh
                    VqBInElG4igoApXxPlEJpo4t8eaF6drgEIPdd6j5g0KoqCYpSRShkq0LlZps+ugJZOjWxxEuSQ6zVohETZIh1LTiNqYQGTVmtwQqiUZBjgKVICfVsj0Ll7GwpYvcI1AkOSyUYTkQN4twCjWB0jgryYTA
                    jYhRkIPyH1zVilETOV19QlCSHAQ5bA7GTaEUDuFxZ9EmsCGLOLJyvv5AGmvvstVWlGt/7zNjOvevrjy1uST90+8Hz4HBVYkrwfPOYcf5L9lR/9+EMK8xAAAAAElFTkSuQmCC`;

    TBui.iconCommentRemove = `iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAG2SURBVDjLrZNJKIRhGMdHxpTtwIUoRRxd
                            lZvcJsuFcBAHFHGSSBKlbCUZOTgolLKXskyDshwsJWQLYx+DGcaSsWS+5+95Z5jQzJjirf/hfb9+v+d5l08GQPaXyP5NkFGnDuT0cF45cBENJ9KRYKRvdg9vFgmuxujSkZDscxR2AU/8OBaJCHdPhKsH
                            gv6eoLslnJgIh9eEfYMErcEmr+hcEJKYr4KworYZ68dLBvV3hDOGj28IBx/wzqWELb1N0NC/IgQJDgXnDJ+aPmAjYe/KBm8yvK5zLrBvQbR/xFW1Rgm7DG9fSNhgeE0nBBaroLJ7UQhiHR6ikHwdopu1
                            M8kq/nGI3s6u0fJ5ZR3qLbtIoyrARFoQpuLlGE70oZb0QM2vD4kl2guTGV3VmVgticXzWBNoWw1zbzGWC6NRk+o/7Qpuah/fFJ08DiX50RPDUCUBZQFAbTiMjXHoUyrIGRzBOeTkirlom1aGv53NbVUw
                            Jnndrfc+wJUeO3IAhl5KZTBxTvI9Maj0IrcErVkhcwt5UdCXhcNQ7oWDXA9MJctRn+I77/Zf15wdOtOvVEii7QGuzPCsWH8HCxz5pzmy7lQAAAAASUVORK5CYII=`;

    TBui.iconCommentsRemove = `iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAIwSURBVDjLhZHLaxNRGMUjaRDBjQtBxAdZ
                            FEQE/wEFUaurLm1FfEGzENwpturG6qIFrYUKXbUudOODNqIiTWqvFEwXKo1UUVRqS2NM0kmaZPKYPKbJ8XzTiUQxceDH3HvnO+e73xnH8X7fLjJInjbgEekiOwA4/sbBD0Ov5sIqY5SVXiO/Rpospw01
                            HphXrOttZPBMxCkWJ3NltZItq3i2pOKZklrWi9Z5SMuKwf2GBtJVxJotiqWLKpIqqHCyYO3/Z/A8UyirBDtLcZTi6Y+RdxdHAsnTAy/NM0TerCuRlE2Y9El+YjCWoLBkViyxdL40OpNmLuBo0Gvk12Au
                            YC5gLqB2XAw8A2NBFZzXVHm1YnHq1qQpYs4PjgbmAuYC5gLe0jrnWGLwzZqDi33ksSTunw3JvKZ0FbFmi5gLeDswF2v/h4Ftcm8yaIl9JMtcwFys4midOJQwEOX6ZyInBos18QYJk0yQVhJjLiiald/i
                            Tw+GMHN2N6YOuTB9YieCozfE4EvNYDO5Ttz2vn/Q+x5zC3EwEyw9GcaH7v0ovLiN6mcf8g8v4O35vRg+edTr+Ne/tU2OEV03SvB3uGFQjDvtQM8moM+N+M0D8B92LjQ0sE2+MhdMHXShOutF/ZO6toXn
                            LdVm4o1yA1KYOLI+lrvbBVBU7HYgSZbOOeFvc4abGWwjXrLndefW3jeeVjPS44Z2xYXvnnVQ7S2rvjbn1aYj1BPo3H6ZHRfl2nz/ELGc/wJRo/MQHUFwBgAAAABJRU5ErkJggg==`;


    TBui.iconCommentsEdit = `iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAIWSURBVDjLjZNPSBRRHMf32rVTdFOsDkJE
                            hODNLGqXukgJpmiEURBGdEnbskNktrhCRQuaLEEikUhlbK5EiZmxjbWwfxvL0dHdtdlCx3VtZxyaed/eG5qwZct98DnM4/f9vN/M+40NgK1Y5p7tPTY9UIeZ4Q6EvIcQ9pQ3FR1O+kvqpbFWZCI+YG0R
                            K5EhBNz2dFHhxIvSWjl+TdOSzyGNd0GJPoE+P4nogzPqpuGUv8wux64ahjIJZbYFy1Pnwfc3I9LXuDR1t2bnf8PC0xKHHL0MQw0gJ5yEmmhA9pMTYm9VOth9cA+rsdV1jm6lDFA0Cizabl6H9KH1d7gJ
                            6kI9VmNXIHiqs5/dFfusQ5hg+PGbL/ipG7CWxPvAv7wEQ5mAKjZjPdGIDO2E9xwmgS7Hjo1dMoFuEIKMQvAtS8C9eoT4iBNh/22kuFrkxAYsh9ow661Bp9fHuqv4S9DiGTdPTa8SfM0QDLoOANl5TN8/
                            jjHndrzrceCt2w71uwDXYJAJjhQULNJwQia4cXY3tMA9aNwdcB37MXRuF4Ih3qwpKLBegbUvLhGcqN6GW6fK8dp1FBP9F/AxvoBwSjcF7Q/fM0FlvsD8iEyycbFuQknDFLPl40QWnqFsyRdY16hbV+gd
                            jf8Rraytm890P0opy5+VggNECwVJzllBldL+r2ErFO7uHYmx4A/Kxc1GPT9cSpmjnC72L/0FRS76cD+dhSEAAAAASUVORK5CYII=`;


    TBui.iconGripper = `iVBORw0KGgoAAAANSUhEUgAAAAYAAAAOCAIAAACD/fpyAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAdSURBVChTY/iPAXAL1c3bD0QQNm4hZDBkzPr/
                        HwBeT+1tHhuGywAAAABJRU5ErkJggg==`;

    TBui.iconGear = `iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAoJJREFUeNqkU01oE1EQnk02iTFQE7QihUKRkKTF1iU9+FdQCoWYgAcP
                    egkIeiiIWiHgwUvpQXs1Ggo99OYlFwUhWAhYhZJWUmhMxJbYYk1LFDcmJraSv911vjQbevPgg9kZ5vu+eW9n3hM0TaP/WSI+gUCADAYDmUwmEgSBUNRoNJ5jaKjNSyuKsqRjjUaDVFWlWCy2X0BfDJ5n
                    d5r9KxZI0Wh0BuRgMHibcznGrrD/wD6hawwHxBdcLte12dnZGYfDcYOFhkJBpnL5F3Y0IAcMHHB1nYAj+Xw+xHeZ8FSWf1BPTw+trqY2JElyAkilUhsej8dZKhWpu/s4jY+P3+P0s/n5+f0TVCoVqlar
                    L0Oh0KTZbCZZlmlgoN+pqgrBEO/u/iZg4IALTecX+BQX6/X69Xw+v8e7bYqiSMvLy+t+f2AGhhg5YOCAC43+7+T1eh+srCS1hYU32tJSQkun09rg4NA0TwLTIMTIAQMHXGigbU2hVqsZq9UaNZsKKYrK
                    oxRZKDYwKizEyAEDB1xoOk3kzo6xP4PExMT9WyMjl/q2t7+npqYevkBucvLx1d7eE9Li4tutcPjJXEsoCO+z2WxcP0GcC3zmDt8ZHj7bVyyWyO32SLHYOwl4ufyTdna+ELCuriN2nlSEC2x1mshdRZGb
                    kchcSJaLfCOtFI+//prLbRIMMXLAwAEXmk4T+ZLALo+Ojj1PJtc1t7s/bLfbHyUSGQ2GGDlg4IALTesd6Y8JY7JarX6bzTZtsVhOwq+tfdMymZx2MAcOuPrmrSYKaDHRUbZjbIcA8sM6xQ9sADFP4xNf
                    54/t21tnk9kKrG3qBdCLw20T//GCFbY9tj+sVf8KMAACOoVxz9PPRwAAAABJRU5ErkJggg==`;

    TBui.topIcon = `iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAEGSURBVDjLpZM/LwRRFMXPspmEaGc1shHR
                    aiXsJ5GIRixbCr6SikxIlqgJM5UohIiGdofovHf/PZVmYwZvTntPfjnn3txWCAFNNFE33L/ZKXYv+1dRgL3r7bu0PbucJp3e4GLjtsrXGq9wkA8SU7tPk87i/MwCzAyP5QNeytcnJl46XMuoNoGKDoVl
                    TkQhJpAgmJqcBjnqkqPTXxN8qz9cD6vdHtQMxXOBt49y5XjzLB/3tau6kWewKiwoRu8jZFvn+U++GgCBlWFBQY4qr1ANcAQxgQaFjwH4TwYrQ5skYBOYKbzjiASOwCrNd2BBwZ4jAcowGJgkAuAZ2dEJ
                    hAUqij//wn/1BesSumImTttSAAAAAElFTkSuQmCC`;

    TBui.bottomIcon = `iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAENSURBVDjLpZM/SwNREMTnxBRpFYmcta
                       KCfwrBSCrRLuL3iEW6+EEUG8XvIVjYWNgJdhFjIXamv3s7u/ssrtO7hFy2fcOPmd03SYwR88xi1cPgpRdjjDB1mBquju+TMt1CFcDd0V7q4GilAwpnd2A0qCvcHRSdHUBqAYgOyaUGIBQAc4fkNSJII
                       GgGj4ZQx4EEAY3waPUiSC5FhLoOQkbQCJvioPQfnN2ctpuNJugKNUWYsMR/gO71yYPk8tRaboGmoCvS1RQ7/c1sq7f+OBUQcjkPGb9+xmOoF6ckCQb9pmj3rz6pKtPB5e5rmq7tmxk+hqO34e1or0yXTG
                       rj9sXGs1Ib73efh1WaZN46/wI8JLfHaN24FwAAAABJRU5ErkJggg==`;

    TBui.logo64 = `iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAACXBIWXMAAAsRAAALEQF/ZF+R
                    AAAAGHRFWHRTb2Z0d2FyZQBwYWludC5uZXQgNC4wLjVlhTJlAAAD1ElEQVR4Xu1ZS0hUURg+WY0tNFy0qCiCGpoaC8fXqBEZPWfRsgdRtCgkKBfRIqpFmZugAisLd9YiQsw2thGtsDYVQURBSRQ9FxER
                    FaRm5vT9+h853DmT3uE4Vzzng++e4/863/nvY+44wsFh6qG8vHx9aWnpLfBVSUnJG4xPi4uLz8A+l0MmF8rKyjZA5FmI3QLOY7NvoM5i1LkPJnVE7V/gCYTmjGRMEkDUdUXoX/zdg/EaxhqctRjmMzk0
                    LYqKigoR94VrjMWbSJk2khkwotFoCIK+ewR6+Q28jYbUg5sxn8Ppw4hEIvmwveNYyVbEbqd48BBITVX9pzg9WEDYJikK817wqyJSS8QMgs8xb8a9vRvjZcXfRzW5/CgSiUQufFdkHGL+4JZZyO7gACFN
                    iqimcDici7ECfx8G2zH/LP3jZC2X1iEH9ahxMraO7YEhByI+SUE4mwm2q5gO0SvBGsS0YHwr472E7yedac7TAnH7lPhONgcDCKhUxPwYS7wEGhVG/C7kNWN8rdR4zCFpgbi4Et/N5mAAAaelGLCFzb6A
                    vNWyBur1sDktELdRib/H5mAAAS+lGDyQdrDZF3A1zJc1wCFwGbu0QHyDjMf6bWzOPmKxWFQKAfvj8fhsdvkGNvJQ2VQXTNoXHTR5BWJ+y1hwD7uyDwg9rgjpYHNGQDO3KrWoCZ3gEnYT6GFLMaMvSvB/
                    oE8c9mcfEPBIisFluZ/NGQP1bsh6vEF6V3iC+R3wo+oDh+Bbx6nZBy73BSRCiqH7mF0Zo7q6ehZqtXPNtMTG+zDu5LRgABEHFFEP2GwEqFeL+u+V+pLU8A56DnBocICQLkXYUTYbA66GGdjoKnAvmnEQ
                    a2zDVbaI3cEC39oKIGpANgDClrPLDmDz9AYnz/4LNtuDpVVVbYWVlckoGKmoCPzLiDgvxN2LQnRni/V5eQP1+flJ4rlQ6FmjJiZbpL0LTPrBpKXsdw2gg8doE10DXAPo4DHaxIwacPWCEHU6ks8TOxE0
                    ub7/BlwSYg2/QqSAfLockzS8/nADemkyXuLFZS2vlwLy6XJM0vD6vaJViJAfnvzP72rk0+WYpOn1OdVi0H3TgEvHBws4NQXk88ROBI2tP/w8wdNzEPeC7gGhJeJTfneTIJ8uxyRNrk979/0pQJ3j9VJA
                    Pl2OSRpe3//HoPUNMPw57JuG13dvgpk0YCrRNcA1gA4eo010DXANoIPHaBNdA1wD6OAx2kTXANcAOniMNtE1wDWADh6jTXQNcA2gg8doE10DfP8wMpVIe6cr4EijEMdsJO2d/6Pu4GAnhPgH06SDEG5p
                    qnUAAAAASUVORK5CYII=`;

    TBui.iconBot = `iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAACz0lEQVQ4T3VTXUhTYRh+zzbdNHZ0E5sjdLOiLnTahQaCFGiIwSK9iIGhGQjOM3GgN0MENYTJYGKiG91kPxe5qxkJk0jQ7EKwvHAarMTM
                    tvYD+2XqnHPr/Q4Jm60PDt95v/f7nvM8z/ccCs4NrVY7I5FIng4ODn5Lb+n1ernX69VNTk6q09ep8wAjIyOcvb09o0wm04+OjvpIX6PR3OJyuU1isfgJ9uP/BZiYmLgUDAYtqVTqSjKZFOKhMM5crGl8
                    D+LBHyKRSNXf3+86A8lgYDAYOuRy+UuFQgFutwdKS0tBIBDAzs4OFBTQ7Ly7u/tIp9O9ygowPm7oKSoSmQKBAJSVlYHP5wOhkMa9KQiFQsDhcCAWizEIYM4KYDQaew4PD01VVVXQ2HgHTKYZODqKQW+v
                    BhwOB9hsNigsLGQGBgayA0xNTfXQNG3yeDzA4/EA9UJ+/gXY3/8J6APKKICTkxOmr6/vXwCz2VzpcrneV1YqpHV1dSxloVDIMo1Go4DAsLa2Bltbdjf61NTV1bVFeqyJeLfX/X7/SnPzXcnq6kc4PT0F
                    dD3jhgmDRCIBDQ2NsLho80ql0tsMwzio6enpa0h5Wam8JyXuz829gerqG2iijNBlqefk5MDBQRTm563Q3a0Gu90OCwvv3Bi4GmpoaGgVDauvra2B7e2vpAEtLS1QXn6ZBSCD+BEOh2F29jkolUqoqKiA
                    9fXPsLT04RM1PDzsV6lU4ng8DlarNcLn82kMDxwfH2dIwHUgD/qRaG1t5eXm5oLFYglQY2Nj9filtxRFEe3a4uLi1+3tHZBMpmBlZRmczl+QXm9sfHmGjB78lXafNRHzLUCXKdR6FRubbW0PWQBiqMvl
                    hPTa7f7NINsXkUgkhediGVHGf0HB5fI2Ozs70TwgGpGBE9JrBMyeA8IEg8TH69zPy8u7SGqMbQgZxdPrkhLZTbX68fczg/4A1KNbXBApXrkAAAAASUVORK5CYII=`;

    TBui.iconRefresh = `iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAI/SURBVDjLjZPbS9NhHMYH+zNidtCSQrqw
                        QtY5y2QtT2QGrTZf13TkoYFlzsWa/tzcoR3cSc2xYUlGJfzAaIRltY0N12H5I+jaOxG8De+evhtdOP1hu3hv3sPzPO/z4SsBIPnfuvG8cbBlWiEVO5OUItA0VS8oxi9EdhXo+6yV3V3UGHRvVXHNfNv6
                        zRfNuBZVoiFcB/3LdnQ8U+Gk+bhPVKB3qUOuf6/muaQR/qwDkZ9BRFdCmMr5EPz6BN7lMYylLGgNNaKqt3K0SKDnQ7us690t3rNsxeyvaUz+8OJpzo/QNzd8WTtcaQ7WlBmPvxhx1V2Pg7oDziIBimww
                        f3qAGWESkVwQ7owNujk1ztvk+cg4NnAUTT4FrrjqUKHdF9jxBfXr1rgjaSk4OlMcLrnOrJ7latxbL1V2lgvlbG9MtMTrMw1r1PImtfyn1n5q47TlBLf90n5NmalMtUdKZoyQMkLKlIGLjMyYhFpmlz3n
                        GEVmFJlRZNaf7pIaEndM24XIjCOzjX9mm2S2JsqdkMYIqbB1j5C6yWzVk7YRFTsGFu7l+4nveExIA9aMCcOJh6DIoMigyOh+o4UryRWQOtIjaJtoziM1FD0mpE4uZcTc72gBaUyYKEI6khgqINXO3saR
                        7kM8IZUVCRDS0Ucf+xFbCReQhr97MZ51wpWxYnhpCD3zOrT4lTisr+AJqVx0Fiiyr4/vhP4VyyMFIUWNqRrV96vWKXKckBoIqWzXYcoPDrUslDJoopuEVEpIB0sR+AuErIiZ6OqMKAAAAABJRU5ErkJg`;

    TBui.iconUsernotes = `iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAJtSURBVDjLpZPNS5RRFMZ/7zgzWmqTFpOb
                        MiuyKDOFCoJaCUKKUFAUBRKtWrSpoP8gwk1BixbpppURtIigqAjKkgSp0KJP86NGbaYZpxmd9773ve89LTTKj1bdxblw4Pmd53Kf44gI/3PCADJyT0z+ByIaMT4S+IjRiPGQwANfERiFGBd8RezQDWc+
                        IDBEth9dRBcBB+YKIDB169hiB142wTIRxLqzXQdELOAg/CE4oWLEd5d4gjFYPYnJ94H1ENGzt9VgFWIVYl2iqw9i/cISgMADDGIViD8n+lusEFvATfaTLq4ie+eizPx4gqMS7WEAM52etTxvsou1ag7i
                        onPDeD+XU1V3glhNA9nhWt4/6OwIA9hAoT71YLzPEGgQQ6BylFTHEVtA58agpIHK+C4yQ++IOpryFVWUrVoXCwMEbhqTS1C28zhgsXqU/KubSFDAn/kGxTuI1TTjTXQTXe4w+vo9vtJp5U7vDQE4IvjJ
                        AaYenScofILAx4qPl/+KhLcS29iCGr+OE5kiUlZOSWHou5+baNp15vbH0O//Lt/djp9NkX16GSs+mfQ42m4htqkNlbhGKOKjc+tJPn6OzhdaG88+fA0QAsAonKIQpY2nELOSsftd2JV7iG9rQU92UhQV
                        vFw1qWf9RFJ9bD7X178gB4qp+1cQoxhLZihrbMNInInBq1TEo6jMWjJPewinX2K1mpcDZ+Ey3epoksOnu/jQfZ7xkV6K19VjkqnximhRc92FF28Wxj20sPHh86TRb+9SU7+P0tJaEv2D08rVB5YSL+ng
                        yP5Kt3HDmvDurTVIxOt1k6mTrZcGvvxrnX8BwNty8Brb9FgAAAAASUVORK5CYII=`;

    TBui.iconNuke = `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAYAAABWdVznAAAB8UlEQVR42lXP20uTYQCA8ed9v81tzLkmeMCPnDHNC+0geMCV1Fx2I5lgybxK0xCMNdQIHDMiLBJv6rKMA
                     kMUsYN4FxKa2bLMMLCN1BlEKRLURQ0q2ldzu+n3Dzw80K8JefEnCRpuV7bNX0fepZPkut12G2hw7bqgVwMtxn9chbr2W63m4aE2Zu+dY/6Oz3L/Qq2uC5Ia/whI2p0p+nPTeTzaztyXmzz7NszckI83
                     HS7CPbViEECXrQninA7pq85nCWHWdmWkvN+6y9TXcV5UFOo3wax1HSXcUiW7iXPkZlkbSo2TFoOMgtRA/PA4CXkqWZFS9xsUbYdZRJsPGyaKHJlWyu2orgI2ECJi0LMGYiNwnLfeGpZBftbpCJn0rJ+
                     pZvNUFSqpKajOPCKDp5lausLMWTfzbYfEatO/gvcIwZkepke9TPvr+egqQkVaVGtjqZyY8fNydYCFR528korxl1T00ZEOnn+4wcLiVYLdx5RxW5opjW17zufcblEmVwYIVhYoW8mXmDOfT6/7ePrkMo
                     v77KKXBI24kp086GsgmJVuWk9JtX43WGxRNcMcGfERrC3hIUC5A4jFYK+BbfvtSqC9xjTmKeNdaxWhzjrjWHWJEgBoOiBJOkGccW2ZuLLi+BNq80HUiuIcK4DZGCahXv4FY4eX45ww+AQAAAAASUVORK
                     5CYII=`;

    TBui.iconSort = `iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAABmJLR0QAAAAAAAD5Q7t/AAAAC
                    XBIWXMAAAsSAAALEgHS3X78AAABwUlEQVQ4y6WTTUvUURTGH6cZYcJVMU6IWQtFg4aEoIyxQKVNQjtXUquyaVGLMr9GUe0mog8QEVI0EOFGzVai0MIsDWkTIy2de8/bbTH8//NOYGd1OM/ld59z7j3Af0ZX
                    lMx/LoQQAlQMKopnky+7mg8/XL3zRcX4yZXieFRLRImZYexYHpcyeTBxy00PVuY2MsnshUx3b75QurEe1ZNRoqwQE5gZmAR1zrpN7Wsm1Tt4quc0zAzOudGbr2e2mDgXA5ilCggGchQDVPS9ivZLQmM9feQo
                    yNEAEy/WAL4KUDOQq7Xw+HLxKgDcfjcb+ntOQs2w+/snyNHEm1sf1mIAeQarwoLC1zlop5f/lPF2rrTWMAPyBFaGBW1o4V96DeCo2kInBx30GOArDFaGdnDQSU8CwPTzqbF0Kg02gZnCO27roJ2euPZ0skSOl
                    rLHs2AVsAn6TvTh7L3hykhh8GPswFGs1ztIeEfXfYX3yvv7EKs+JTODvfxikunmGYgJ2NccJD8tLBOA4fOPcusHB5VRVcX3rR+b34o751qGqAxD409tWJgzd4eWhSW1/WL3YvMMcvdHgrBCWKCi2Hm117Js
                    h4q/ZJNiXWodqQgAAAAASUVORK5CYII=`;

    TBui.iconLink = `iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAQAAAC1+jfqAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAADpSURBVCjPY/jPgB8y0EmBHXdWaeu7ef9r
                    HuaY50jU3J33v/VdVqkdN1SBEZtP18T/L/7f/X/wf+O96kM3f9z9f+T/xP8+XUZsYAWGfsUfrr6L2Ob9J/X/pP+V/1P/e/+J2LbiYfEHQz+ICV1N3yen+3PZf977/9z/Q//X/rf/7M81Ob3pu1EXWIFu
                    Zvr7aSVBOx1/uf0PBEK3/46/gnZOK0l/r5sJVqCp6Xu99/2qt+v+T/9f+L8CSK77v+pt73vf65qaYAVqzPYGXvdTvmR/z/4ZHhfunP0p+3vKF6/79gZqzPQLSYoUAABKPQ+kpVV/igAAAABJRU5ErkJg
                    gg==`;
    // Do we ever care about loading image assets from disk? Here's how:
    // switch (TBUtils.browser) {
    //     case TBUtils.browsers.CHROME:
    //     case TBUtils.browsers.OPERA: // yep, same name and everything
    //         TBui.iconNuke = chrome.extension.getURL('images/nuke.png')
    //         break;
    //     case TBUtils.browsers.FIREFOX:
    //         TBui.iconNuke = self.data.nukeIcon;
    //         break;
    //     case TBUtils.browsers.UNKOWN_BROWSER:
    //     default:
    //         TBui.iconNuke = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAYAAABWdVznAAAB8UlEQVR42lXP20uTYQCA8ed9v81tzLkmeMCPnDHNC+0geMCV1Fx2I5lgybxK0xCMNdQIHDMiLBJv6rKMA
    //                          kMUsYN4FxKa2bLMMLCN1BlEKRLURQ0q2ldzu+n3Dzw80K8JefEnCRpuV7bNX0fepZPkut12G2hw7bqgVwMtxn9chbr2W63m4aE2Zu+dY/6Oz3L/Qq2uC5Ia/whI2p0p+nPTeTzaztyXmzz7NszckI83
    //                          HS7CPbViEECXrQninA7pq85nCWHWdmWkvN+6y9TXcV5UFOo3wax1HSXcUiW7iXPkZlkbSo2TFoOMgtRA/PA4CXkqWZFS9xsUbYdZRJsPGyaKHJlWyu2orgI2ECJi0LMGYiNwnLfeGpZBftbpCJn0rJ+
    //                          pZvNUFSqpKajOPCKDp5lausLMWTfzbYfEatO/gvcIwZkepke9TPvr+egqQkVaVGtjqZyY8fNydYCFR528korxl1T00ZEOnn+4wcLiVYLdx5RxW5opjW17zufcblEmVwYIVhYoW8mXmDOfT6/7ePrkMo
    //                          v77KKXBI24kp086GsgmJVuWk9JtX43WGxRNcMcGfERrC3hIUC5A4jFYK+BbfvtSqC9xjTmKeNdaxWhzjrjWHWJEgBoOiBJOkGccW2ZuLLi+BNq80HUiuIcK4DZGCahXv4FY4eX45ww+AQAAAAASUVORK
    //                          5CYII=";
    //         break;
    // }

    TBui.standardColors = {
        'red': '#FF0000',
        'softred': '#ED4337',
        'green': '#347235',
        'lightgreen': '#00F51E',
        'blue': '#0082FF',
        'magenta': '#DC00C8',
        'cyan': '#00F0F0',
        'yellow': '#EAC117',
        'softyellow': '#FFFC7F',
        'black': '#000000'
    };

    TBui.FEEDBACK_NEUTRAL = 'neutral';
    TBui.FEEDBACK_POSITIVE = 'positive';
    TBui.FEEDBACK_NEGATIVE = 'negative';

    TBui.DISPLAY_CENTER = 'center';
    TBui.DISPLAY_BOTTOM = 'bottom';
    TBui.DISPLAY_CURSOR = 'cursor';

    TBui.button = function button(text, classes) {
        return `<a href="javascript:;" class="tb-general-button ${classes}">${text}</a>`;
    };

    TBui.actionButton = function button(text, classes) {
        return `<a href="javascript:;" class="tb-action-button ${classes}">${text}</a>`;
    };

    // Popup HTML generator
    TBui.popup = function popup(title, tabs, meta, css_class, opts) {
        const defaults = {
            draggable: true
        };

        const options = $.extend(defaults, opts);

        meta = (typeof meta !== 'undefined') ? meta : null;
        css_class = (typeof css_class !== 'undefined') ? css_class : '';

        // tabs = [{id:"", title:"", tooltip:"", help_text:"", help_url:"", content:"", footer:""}];
        let $popup = $('<div>').addClass(`tb-popup${css_class ? ` ${css_class}` : ''}`);
        if (meta) {
            $popup.append($('<div>').addClass('meta').css('display', 'none').append(meta));
        }
        $popup.append($('<div>').addClass('tb-popup-header').append(
            $('<div>').addClass('tb-popup-title').append(title)
        ).append(
            $('<div>').addClass('buttons').append(
                $('<a>').addClass('close').attr('href', 'javascript:;').text('✕')
            )
        )
        );
        if (tabs.length == 1) {
            $popup.append($('<div>').addClass('tb-popup-content').append(tabs[0].content));
            $popup.append($('<div>').addClass('tb-popup-footer').append(tabs[0].footer));
        }
        else if (tabs.length > 1) {
            let $tabs = $('<div>').addClass('tb-popup-tabs');
            $popup.append($tabs);

            for (let i = 0; i < tabs.length; i++) {
                let tab = tabs[i];
                if (tab.id === 'undefined' || !tab.id) {
                    tab.id = tab.title.trim().toLowerCase().replace(/\s/g, '_');
                }

                // Create tab button
                let $button = $('<a>').addClass(tab.id).text(tab.title);
                if (tab.tooltip) {
                    $button.attr('title', tab.tooltip);
                }

                $button.click({tab: tab}, function (e) {
                    let tab = e.data.tab;

                    // hide others
                    $tabs.find('a').removeClass('active');
                    $popup.find('.tb-popup-tab').hide();

                    // show current
                    $popup.find(`.tb-popup-tab.${tab.id}`).show();
                    $(this).addClass('active');

                    e.preventDefault();
                });

                // default first tab is active tab
                if (i == 0) {
                    $button.addClass('active');
                }

                $button.appendTo($tabs);


                let $tab = $('<div>').addClass(`tb-popup-tab ${tab.id}`);
                $tab.append($('<div>').addClass('tb-popup-content').append(tab.content));
                $tab.append($('<div>').addClass('tb-popup-footer').append(tab.footer));

                // default first tab is visible; hide others
                if (i == 0) {
                    $tab.show();
                } else {
                    $tab.hide();
                }

                $tab.appendTo($popup);
            }
        }

        if(options.draggable)
            $popup.drag($popup.find('.tb-popup-title'));

        return $popup;
    };

    TBui.drawPosition = function drawPosition(event) {
        let positions = {
            leftPosition: '',
            topPosition : ''
        };

        const $overlay = $(event.target).closest('.tb-page-overlay');

        if (document.documentElement.clientWidth - event.pageX < 400) {
            positions.leftPosition = event.pageX - 600;
        } else {
            positions.leftPosition = event.pageX - 50;
        }

        if (document.documentElement.clientHeight - event.pageY < 200 && location.host === 'mod.reddit.com') {
            let topPosition = event.pageY - 600;

            if (topPosition < 0) {
                positions.topPosition = 5;
            } else {
                positions.topPosition = event.pageY - 600;
            }
        } else {
            positions.topPosition = event.pageY - 50;
        }

        if($overlay.length) {
            const scrollTop = $overlay.scrollTop();
            positions.topPosition = positions.topPosition + scrollTop;
        }


        return positions;
    };

    TBui.switchOverlayTab = function switchOverlayTab(overlayClass, tabName) {
        const $overlay = $body.find(`.${overlayClass}`);

        let $tab = $overlay.find(`[data-module="${tabName}"]`);

        $overlay.find('.tb-window-tabs a').removeClass('active');
        $tab.addClass('active');

        $('.tb-window-wrapper .tb-window-tab').hide();
        $(`.tb-window-wrapper .tb-window-tab.${tabName}`).show();
    };
    // Window Overlay HTML generator
    TBui.overlay = function overlay(title, tabs, buttons, css_class, single_footer, details) {
        buttons = (typeof buttons !== 'undefined') ? buttons : '';
        css_class = (typeof css_class !== 'undefined') ? css_class : '';
        single_footer = (typeof single_footer !== 'undefined') ? single_footer : false;

        // tabs = [{id:"", title:"", tooltip:"", help_page:"", content:"", footer:""}];
        let $overlay = $(`
<div class="tb-page-overlay ${css_class ? ` ${css_class}` : ``}">
    <div class="tb-window-wrapper">
        <div class="tb-window-header">
            <div class="tb-window-title">${title}</div>
            <div class="buttons">
                ${buttons}<a class="close" href="javascript:;">✕</a>
            </div>
        </div>
    </div>
</div>`);

        if(details) {

            $.each(details, function(key, value) {
                $overlay.attr(`data-${key}`, value);
            });
        }

        // we need a way to handle closing the overlay with a default, but also with use-specific cleanup code to run
        // NOTE: Click handler binds should be attached to the parent element of the relevant object, not $(body).
        // $overlay.on('click', '.buttons .close', function () {});

        if (tabs.length == 1) {
            $overlay.find('.tb-window-wrapper').append($('<div class="tb-window-content"></div>').append(tabs[0].content));
            $overlay.find('.tb-window-wrapper').append($('<div class="tb-window-footer"></div>').append( (single_footer ? single_footer : tabs[0].footer) ));
        } else if (tabs.length > 1) {
            $overlay.find('.tb-window-wrapper').append($('<div class="tb-window-tabs"></div>'));
            $overlay.find('.tb-window-wrapper').append($('<div class="tb-window-tabs-wrapper"></div>'));

            for (let i = 0; i < tabs.length; i++) {
                let tab = tabs[i];

                tab.disabled = (typeof tab.disabled === 'boolean') ? tab.disabled : false;
                tab.help_page = (typeof tab.help_page !== 'undefined') ? tab.help_page : '';

                if (!TB.utils.advancedMode && tab.advanced) continue;

                if (tab.id === 'undefined' || !tab.id) {
                    tab.id = tab.title.trim().toLowerCase();
                    tab.id = tab.id.replace(/\s/g, '_');
                }

                let $button = $(`<a${tab.tooltip ? ` title="${tab.tooltip}"` : ''} ${tab.id ? ` data-module="${tab.id}"` : ''} class="${tab.id}" >${tab.title} </a>`);

                $button.data('help_page', tab.help_page);

                if (tab.disabled) {
                    $button.addClass('tb-module-disabled');
                    $button.attr('title', 'This module is not active, you can activate it in the "Toggle Modules" tab.');
                }

                // click handler for tabs
                $button.click({tab: tab}, function (e) {
                    let tab = e.data.tab;

                    // hide others
                    $overlay.find('.tb-window-tabs a').removeClass('active');
                    $overlay.find('.tb-window-tab').hide();


                    // show current
                    $overlay.find(`.tb-window-tab.${tab.id}`).show();

                    // Only hide and show the footer if we have multiple options for it.
                    if (!single_footer) {
                        $overlay.find('.tb-window-footer').hide();
                        $overlay.find(`.tb-window-footer.${tab.id}`).show();
                    }


                    $(this).addClass('active');

                    e.preventDefault();
                });

                $button.appendTo($overlay.find('.tb-window-tabs'));

                let $tab = $(`<div class="tb-window-tab ${tab.id}"></div>`);
                // $tab.append($('<div class="tb-window-content">' + tab.content + '</div>'));
                $tab.append($('<div class="tb-window-content"></div>').append(tab.content));
                // individual tab footers (as used in .tb-config)
                if (!single_footer) {

                    $overlay.find('.tb-window-wrapper').append($(`<div class="tb-window-footer ${tab.id}"></div>`).append(tab.footer));

                    let $footer = $overlay.find(`.tb-window-footer.${tab.id}`);
                    if (i == 0) {
                        $footer.show();
                    } else {
                        $footer.hide();
                    }
                }

                // default first tab is active = visible; hide others
                if (i == 0) {
                    $button.addClass('active');

                    $tab.show();
                } else {

                    $tab.hide();
                }

                $tab.appendTo($overlay.find('.tb-window-wrapper .tb-window-tabs-wrapper'));
            }
        }

        // single footer for all tabs (as used in .tb-settings)
        if (single_footer) {
            $overlay.find('.tb-window-wrapper').append($('<div class="tb-window-footer"></div>').append(single_footer));
        }

        return $overlay;
    };

    TBui.selectSingular = function selectSingular(choices, selected) {
        let $selector = $(`
        <div class="select-single">
            <select class="selector tb-action-button"></select>
        </div>`),
            $selector_list = $selector.find('.selector');

        //Add values to select

        $.each(choices, function (i , keyValue) {
            const value = keyValue.toLowerCase().replace(/\s/g, '_');
            $selector_list.append($('<option>').attr('value', value).text(keyValue));
        });

        //Set selected value
        $selector_list.val(selected).prop('selected', true);

        return $selector;
    };

    TBui.selectMultiple = function selectMultiple(available, selected) {
        available = (available instanceof Array) ? available : [];
        selected = (selected instanceof Array) ? selected : [];

        let $select_multiple = $(`
        <div class="select-multiple">
            <select class="selected-list left tb-action-button"></select>&nbsp;<button class="remove-item right tb-action-button">remove</button>&nbsp;
            <select class="available-list left tb-action-button"></select>&nbsp;<button class="add-item right tb-action-button">add</button>&nbsp;
            <div style="clear:both"></div>
        </div>`),
            $selected_list = $select_multiple.find('.selected-list'),
            $available_list = $select_multiple.find('.available-list');

        $select_multiple.on('click', '.remove-item', function (e) {
            let $select_multiple = $(e.delegateTarget);
            $select_multiple.find('.selected-list option:selected').remove();
        });

        $select_multiple.on('click', '.add-item', function (e) {
            let $select_multiple = $(e.delegateTarget);
            let $add_item = $select_multiple.find('.available-list option:selected');

            // Don't add the sub twice.
            let exists = false;
            $selected_list.find('option').each(function () {
                if (this.value === $add_item.val()) {
                    exists = true;
                    return false;
                }
            });

            if (!exists) {
                $selected_list.append($add_item.clone()).val($add_item.val());
            }
        });

        $.each(available, function (i, value) {
            $available_list.append($('<option>').attr('value', value).text(value));
        });

        $.each(selected, function (i, value) {
            $selected_list.append($('<option>').attr('value', value).text(value));
        });

        return $select_multiple;
    };

    TBui.mapInput = function (labels, items) {
        let keyLabel = labels[0],
            valueLabel = labels[1];

        let $mapInput = $(`<div>
            <table class="tb-map-input-table">
                <thead><tr>
                    <td>${keyLabel}</td>
                    <td>${valueLabel}</td>
                    <td class="tb-map-input-td-remove">remove</td>
                </tr></thead>
                <tbody></tbody>
            </table>
            <a class="tb-map-input-add tb-icons tb-icons-positive" href="javascript:void(0)">add_box</a></div>`);

        let emptyRow = `
            <tr class="tb-map-input-tr">
                <td><input type="text" class="tb-input" name="key"></td>
                <td><input type="text" class="tb-input" name="value"></td>
                <td class="tb-map-input-td-remove">
                    <a class="tb-map-input-td-remove" href="javascript:void(0)"></a>
                </td>
            </tr>`;

        // remove item
        $mapInput.on('click', '.tb-map-input-remove', function () {
            $(this).closest('.tb-map-input-tr').remove();
        });

        // add empty item
        $mapInput.on('click', '.tb-map-input-add', function () {
            $(emptyRow).appendTo($mapInput.find('.tb-map-input-table tbody'));
        });

        // populate items
        if ($.isEmptyObject(items)) {
            $(emptyRow).appendTo($mapInput.find('.tb-map-input-table tbody'));
        } else {
            $.each(items, function (key, value) {
                let $item = $(`
                <tr class="tb-map-input-tr">
                    <td><input type="text" class="tb-input" value="${TBUtils.htmlEncode(unescape(key))}" name="key"></td>
                    <td><input type="text" class="tb-input" value="${TBUtils.htmlEncode(unescape(value))}" name="value"></td>
                    <td class="tb-map-input-td-remove">
                        <a class="tb-map-input-remove tb-icons tb-icons-negative tb-icons-align-middle" href="javascript:void(0)">delete</a>
                    </td>
                </tr>`);
                $item.appendTo($mapInput.find('.tb-map-input-table tbody'));
            });
        }

        return $mapInput;
    };

    TBui.textFeedback = function (feedbackText, feedbackKind, displayDuration, displayLocation) {
        if (!displayLocation) displayLocation = TBui.DISPLAY_CENTER;

        // Without text we can't give feedback, the feedbackKind is required to avoid problems in the future.
        if (feedbackKind !== undefined && feedbackKind !== undefined) {

            // If there is still a previous feedback element on the page we remove it.
            $body.find('#tb-feedback-window').remove();

            // build up the html, not that the class used is directly passed from the function allowing for easy addition of other kinds.
            let feedbackElement = `<div id="tb-feedback-window" class="${feedbackKind}"><span class="tb-feedback-text">${feedbackText}</span></div>`;

            // Add the element to the page.
            $body.append(feedbackElement);

            //center it nicely, yes this needs to be done like this if you want to make sure it is in the middle of the page where the user is currently looking.
            let $feedbackWindow = $body.find('#tb-feedback-window');

            switch (displayLocation) {
            case TBui.DISPLAY_CENTER:{
                const feedbackLeftMargin = ($feedbackWindow.outerWidth() / 2),
                    feedbackTopMargin = ($feedbackWindow.outerHeight() / 2);

                $feedbackWindow.css({
                    'margin-left': `-${feedbackLeftMargin}px`,
                    'margin-top': `-${feedbackTopMargin}px`
                });
            }
                break;
            case TBui.DISPLAY_BOTTOM:{
                $feedbackWindow.css({
                    'left': '5px',
                    'bottom': '40px',
                    'top': 'auto',
                    'position': 'fixed'
                });
            }
                break;
            case TBui.DISPLAY_CURSOR: {

                $(document).mousemove(function (e) {
                    const posX = e.pageX,
                        posY = e.pageY;

                    $feedbackWindow.css({
                        left: posX - $feedbackWindow.width() + 155,
                        top: posY - $feedbackWindow.height() - 15,
                        'position': 'fixed'
                    });
                });
            }
                break;
            }

            // And fade out nicely after 3 seconds.
            $feedbackWindow.delay(displayDuration ? displayDuration : 3000).fadeOut();
        }
    };

    // Our awesome long load spinner that ended up not being a spinner at all. It will attend the user to ongoing background operations with a warning when leaving the page.
    TBui.longLoadSpinner = function (createOrDestroy, feedbackText, feedbackKind, feedbackDuration, displayLocation) {
        if (createOrDestroy !== undefined) {

            // if requested and the element is not present yet
            if (createOrDestroy && TBui.longLoadArray.length == 0) {

                $('head').append(`<style id="tb-long-load-style">
                .mod-toolbox-rd #tb-bottombar, .mod-toolbox-rd #tb-bottombar-hidden {
                    bottom: 10px !important
                }
                </style>`);

                $body.append(`<div id="tb-loading-stuff"><span class="tb-loading-content"><img src="https://toolbox-team.github.io/reddit-moderator-toolbox/hosted_images/long_load_spinner.gif" alt="loading"> <span class="tb-loading-text">${TBUtils.RandomFeedback}</span></span></div>`);
                $body.append('<div id="tb-loading"></div>');

                let $randomFeedbackWindow = $('body').find('#tb-loading-stuff');
                let randomFeedbackLeftMargin = ($randomFeedbackWindow.outerWidth() / 2),
                    randomFeedbackTopMargin = ($randomFeedbackWindow.outerHeight() / 2);

                $randomFeedbackWindow.css({
                    'margin-left': `-${randomFeedbackLeftMargin}px`,
                    'margin-top': `-${randomFeedbackTopMargin}px`
                });

                TBui.longLoadArray.push('load');

                // if requested and the element is already present
            } else if (createOrDestroy && TBui.longLoadArray.length > 0) {
                TBui.longLoadArray.push('load');

                // if done and the only instance
            } else if (!createOrDestroy && TBui.longLoadArray.length == 1) {
                $('head').find('#tb-long-load-style').remove();
                $('body').find('#tb-loading').remove();
                $('body').find('#tb-loading-stuff').remove();
                TBui.longLoadArray.pop();

                // if done but other process still running
            } else if (!createOrDestroy && TBui.longLoadArray.length > 1) {
                TBui.longLoadArray.pop();

            }

            // Support for text feedback removing the need to fire two function calls from a module.
            if (feedbackText !== undefined && feedbackKind !== undefined) {
                TBui.textFeedback(feedbackText, feedbackKind, feedbackDuration, displayLocation);
            }
        }
    };

    // Our awesome long load spinner that ended up not being a spinner at all. It will attend the user to ongoing background operations, this variant will NOT warn when you leave the page.
    TBui.longLoadNonPersistent = function (createOrDestroy, feedbackText, feedbackKind, feedbackDuration, displayLocation) {
        if (createOrDestroy !== undefined) {

            // if requested and the element is not present yet
            if (createOrDestroy && TBui.longLoadArrayNonPersistent.length == 0) {

                $('head').append(`<style id="tb-long-load-style-non-persistent">
                .mod-toolbox-rd #tb-bottombar, .mod-toolbox-rd #tb-bottombar-hidden {
                    bottom: 10px !important
                }
                </style>`);


                $('.footer-parent').append('<div id="tb-loading-non-persistent"></div>');


                TBui.longLoadArrayNonPersistent.push('load');

                // if requested and the element is already present
            } else if (createOrDestroy && TBui.longLoadArrayNonPersistent.length > 0) {
                TBui.longLoadArrayNonPersistent.push('load');

                // if done and the only instance
            } else if (!createOrDestroy && TBui.longLoadArrayNonPersistent.length == 1) {
                $('head').find('#tb-long-load-style-non-persistent').remove();
                $('body').find('#tb-loading-non-persistent').remove();
                TBui.longLoadArrayNonPersistent.pop();

                // if done but other process still running
            } else if (!createOrDestroy && TBui.longLoadArrayNonPersistent.length > 1) {
                TBui.longLoadArrayNonPersistent.pop();

            }

            // Support for text feedback removing the need to fire two function calls from a module.
            if (feedbackText !== undefined && feedbackKind !== undefined) {
                TBui.textFeedback(feedbackText, feedbackKind, feedbackDuration, displayLocation);
            }
        }
    };

    TBui.beforeunload = function () {
        if (TBui.longLoadArray.length > 0) {
            return 'toolbox is still busy!';
        }
    };


    /**
     * Add or remove a menu element to the context aware menu. Makes the menu shows if it was empty before adding, hides menu if it is empty after removing.
     * @function contextTrigger
     * @memberof TBui
     * @param {string} triggerId This will be part of the id given to the element.
     * @param {object} options
     * @param {boolean} options.addTrigger Indicates of the menu item needs to be added or removed.
     * @param {string} options.triggerText Text displayed in menu. Not needed when addTrigger is false.
     * @param {string} options.triggerIcon The material icon that needs to be displayed before the menu item. Defaults to 'label'
     * @param {string} options.title Title to be used in title attribute. If no title is given the triggerText will be used.
     * @param {object} options.dataAttributes Any data attribute that might be needed. Object keys will be used as the attribute name and value as value.
     */
    let contextTimeout;
    TBui.contextTrigger = function contextTrigger(triggerId, options) {

        const addTrigger = options.addTrigger;
        // These elements we will need in the future.
        let $tbContextMenu = $body.find('#tb-context-menu');
        if (!$tbContextMenu.length) {
            // Toolbox context action menu.
            $tbContextMenu = $(`
            <div id="tb-context-menu">
                <div id="tb-context-menu-wrap">
                    <div id="tb-context-header"> Toolbox context menu </div>
                    <table id="tb-context-menu-list">
                    </table >
                </div>
                <i class="tb-icons tb-context-arrow" href="javascript:void(0)">keyboard_arrow_right</i>
            </div>
            `).appendTo($body);
        }
        const $tbContextMenuList = $body.find('#tb-context-menu-list');
        // We are adding a menu item.
        if(addTrigger) {
            const triggerText = options.triggerText;
            let triggerIcon = 'label';
            if(options.triggerIcon) {
                triggerIcon = options.triggerIcon;
            }

            let title = options.triggerText;
            if (options.title) {
                title = options.triggerText;
            }

            // Check if there are currently items in the menu.
            const currentLength = $tbContextMenuList.find('tr').length;

            // Build the new menu item.
            const $newMenuItem = $(`<tr id="${triggerId}"><td href="javascript:void(0)" title="${title}"><i class="tb-icons">${triggerIcon}</i><span>${triggerText}<span></td></tr>`);

            // Add data attributes if needed.
            if(options.dataAttributes) {
                $.each(options.dataAttributes, function(name, value) {
                    $newMenuItem.attr(`data-${name}`, value);
                });
            }

            let $checkExists = $tbContextMenuList.find(`#${triggerId}`);

            // Check if an item with the same id is already in the menu. If so we will replace it.
            if($checkExists.length) {
                $checkExists.replaceWith($newMenuItem);
            } else {
                // Add the item to the menu.
                $tbContextMenuList.append($newMenuItem);

                // We are going a bit annoying here to draw attention to the fact that there is a new item in the menu.
                // The alternative would be to always show the entire menu.
                $tbContextMenu.trigger('mouseover');
                clearTimeout(contextTimeout);
                contextTimeout = setTimeout(function() {
                    $tbContextMenu.trigger('mouseleave');
                }, 1000);
            }

            // If the menu was empty it was hidden and we need to show it.
            if(!currentLength.length > 0) {
                $tbContextMenu.addClass('show-tb-context');
            }

            const $contextMenuWrap = $tbContextMenu.find('#tb-context-menu-wrap');
            $tbContextMenu.mouseenter(function() {
                $contextMenuWrap.fadeIn(200);
            }).mouseleave(function() {
                $contextMenuWrap.fadeOut(200);

            });


        // We are removing a menu item.
        } else {
            // Remove the menu item.
            $tbContextMenuList.find(`#${triggerId}`).remove();
            // Check the new menu length
            const newLength = $tbContextMenuList.find('tr').length;
            // If there is nothing to show anymore we hide the menu.
            if(newLength < 1) {
                $tbContextMenu.removeClass('show-tb-context');
            }

        }
    };

    /**
     * Will send out events similar to the reddit jsAPI events for the elements given.
     * Only support 'comment' for now and will only send the commentAuthor event.
     * @function tbRedditEvent
     * @memberof TBui
     * @param {object} $elements jquery object containing the e
     * @param {string} types comma seperated list of type of elements the events need to be send for.
     */
    TBui.tbRedditEvent = function tbRedditEvent($elements, types) {
        const typesArray = types.split(',');
        if(typesArray.includes('comment')) {
            const $comments = $elements.find('.tb-comment');
            TBUtils.forEachChunkedDynamic($comments, function(value) {
                const $element = $(value);
                const $jsApiPlaceholderComment= $element.find('> .tb-comment-entry > .tb-jsapi-comment-container');
                const jsApiPlaceholderComment = $jsApiPlaceholderComment[0];
                const $jsApiPlaceholderAuthor = $element.find('> .tb-comment-entry > .tb-tagline .tb-jsapi-author-container');
                const jsApiPlaceholderAuthor = $jsApiPlaceholderAuthor[0];
                const commentAuthor = $element.attr('data-comment-author'),
                    postID = $element.attr('data-comment-post-id'),
                    commentID = $element.attr('data-comment-id'),
                    subredditName = $element.attr('data-subreddit'),
                    subredditType = $element.attr('data-subreddit-type');

                // Comment
                if(!$jsApiPlaceholderComment.hasClass('.tb-frontend-container')) {
                    const detailObject = {
                        'type': 'TBcomment',
                        'data': {
                            'author': commentAuthor,
                            'post': {
                                'id': postID
                            },
                            'id': commentID,
                            'subreddit': {
                                'name': subredditName,
                                'type': subredditType
                            }
                        }
                    };
                    const tbRedditEventComment = new CustomEvent('tbReddit', {detail: detailObject});
                    jsApiPlaceholderComment.dispatchEvent(tbRedditEventComment);
                }
                // Author
                // We don't want to send events for things already handled.
                if(!$jsApiPlaceholderAuthor.hasClass('.tb-frontend-container')) {

                    const detailObject = {
                        'type': 'TBcommentAuthor',
                        'data': {
                            'author': commentAuthor,
                            'post': {
                                'id': postID
                            },
                            'comment': {
                                'id': commentID
                            },
                            'subreddit': {
                                'name': subredditName,
                                'type': subredditType
                            }
                        }
                    };
                    const tbRedditEventAuthor = new CustomEvent('tbReddit', {detail: detailObject});
                    jsApiPlaceholderAuthor.dispatchEvent(tbRedditEventAuthor);
                }

            }, {framerate: 40});
        }
        if(typesArray.includes('submission')) {
            const $submissions = $elements.find('.tb-submission');
            TBUtils.forEachChunkedDynamic($submissions, function(value) {
                const $element = $(value);
                const $jsApiPlaceholderSubmission= $element.find('.tb-jsapi-submission-container');
                const jsApiPlaceholderSubmission = $jsApiPlaceholderSubmission[0];
                const $jsApiPlaceholderAuthor = $element.find('.tb-jsapi-author-container');
                const jsApiPlaceholderAuthor= $jsApiPlaceholderAuthor[0];

                const submissionAuthor = $element.attr('data-submission-author'),
                    postID = $element.attr('data-post-id'),
                    subredditName = $element.attr('data-subreddit'),
                    subredditType = $element.attr('data-subreddit-type');

                if(!$jsApiPlaceholderSubmission.hasClass('.tb-frontend-container')) {

                    const detailObject = {
                        'type': 'TBpost',
                        'data': {
                            'author': submissionAuthor,
                            'id': postID,
                            'subreddit': {
                                'name': subredditName,
                                'type': subredditType
                            }
                        }
                    };

                    const tbRedditEventSubmission = new CustomEvent('tbReddit', {detail: detailObject});
                    jsApiPlaceholderSubmission.dispatchEvent(tbRedditEventSubmission);
                }
                // We don't want to send events for things already handled.
                if(!$jsApiPlaceholderAuthor.hasClass('.tb-frontend-container')) {

                    const detailObject = {
                        'type': 'postAuthor',
                        'data': {
                            'author': submissionAuthor,
                            'post': {
                                'id': postID
                            },
                            'subreddit': {
                                'name': subredditName,
                                'type': subredditType
                            }
                        }
                    };

                    const tbRedditEventAuthor = new CustomEvent('tbReddit', {detail: detailObject});
                    jsApiPlaceholderAuthor.dispatchEvent(tbRedditEventAuthor);
                }

            }, {framerate: 40});
        }

    };

    /**
     * Will build a submission entry given a reddit API submission object.
     * @function makeSubmissionEntry
     * @memberof TBui
     * @param {object} submission reddit API submission object.
     * @param {object} submissionOptions object denoting what needs to be included.
     * @returns {object} jquery object with the build submission.
     */

    TBui.makeSubmissionEntry = function makeSubmissionEntry(submission, submissionOptions) {
        // Misc
        const canModsubmission = submission.data.can_mod_post,

            // submission basis (author, body, time)
            submissionAuthor = submission.data.author,
            submissionSelfTextHTML = submission.data.selftext_html, // html string
            submissionCreatedUTC = submission.data.created_utc, // unix epoch
            submissionPermalink = submission.data.permalink,
            submissionSubreddit = submission.data.subreddit,
            submissionSubredditType = submission.data.subreddit_type,
            submissionName = submission.data.name,
            submissionUrl = submission.data.url,
            submissionTitle = submission.data.title,
            submissionThumbnail = submission.data.thumbnail,
            submissionDomain = submission.data.domain,


            // submission details
            submissionScore = submission.data.score, // integer
            submissionLikes = submission.data.likes, // boolean or null
            submissionIsSelf = submission.data.is_self,
            submissionEdited = submission.data.edited,
            submissionGilded = submission.data.gilded,
            submissionPinned = submission.data.pinned,
            submissionLocked = submission.data.locked,
            submissionOver18 = submission.data.over_18,
            submissionNumComments = submission.data.num_comments,
            submissionUserReports = submission.data.user_reports, // array with reports by users

            // submission details - mod related
            submissionDistinguished = submission.data.distinguished, // string containing "moderator" or "admin"
            submissionModReports = submission.data.mod_reports, // array with reports by mods

            // Author details
            submissionIsSubmitter = submission.data.is_submitter, // boolean - is OP

            // submission status - mod action
            submissionApproved = submission.data.approved, // boolean
            submissionApprovedAtUTC = submission.data.approved_at_utc, // unix epoch
            submissionApprovedBy = submission.data.approved_by, // unix epoch
            submissionSpam = submission.data.spam, // boolean
            submissionRemoved = submission.data.removed, // boolean
            submissionBannedAtUTC = submission.data.banned_at_utc, // unix epoch
            submissionBannedBy = submission.data.banned_by, // Mod that removed the submission
            submissionIgnoreReports = submission.data.ignore_reports, // boolean
            submissionBanNote = submission.data.ban_note;

        // Format the submission datetime nicely
        const submissionReadableCreatedUTC = TBUtils.timeConverterRead(submissionCreatedUTC),
            createdTimeAgo = TBUtils.timeConverterISO(submissionCreatedUTC);

        // vote status
        let voteState = 'neutral';
        if(submissionLikes !== null && !submissionLikes) {
            voteState = 'disliked';
        } else if(submissionLikes) {
            voteState = 'liked';
        }
        // Let's figure out what the current state is of the submission (approved, removed, spammed or neutral)
        let submissionStatus,
            submissionStatusUTC,
            submissionStatusReadableUTC,
            submissionStatusBy,
            submissionActionByOn;

        if(submissionSpam) {
            submissionStatus = 'spammed';
            submissionStatusUTC = submissionBannedAtUTC;
            submissionStatusReadableUTC = TBUtils.timeConverterRead(submissionStatusUTC);
            submissionStatusBy = submissionBannedBy;
            submissionActionByOn = `by ${submissionStatusBy} on ${submissionStatusReadableUTC}`;

        } else if (submissionRemoved) {
            submissionStatus = 'removed';
            submissionStatusUTC = submissionBannedAtUTC;
            submissionStatusReadableUTC = TBUtils.timeConverterRead(submissionStatusUTC);
            submissionStatusBy = submissionBannedBy;
            submissionActionByOn = `by ${submissionStatusBy} on ${submissionStatusReadableUTC}`;
        } else if (submissionApproved) {
            submissionStatus = 'approved';
            submissionStatusUTC = submissionApprovedAtUTC;
            submissionStatusReadableUTC = TBUtils.timeConverterRead(submissionStatusUTC);
            submissionStatusBy = submissionApprovedBy;
            submissionActionByOn = `by ${submissionStatusBy} on ${submissionStatusReadableUTC}`;
        } else if (submissionBanNote && !submissionSpam && !submissionRemoved && !submissionApproved) {
            submissionStatus = 'filtered';
            submissionStatusUTC = submissionBannedAtUTC;
            submissionStatusReadableUTC = TBUtils.timeConverterRead(submissionStatusUTC);
            submissionStatusBy = submissionBannedBy;
            submissionActionByOn = `${submissionStatusBy ? `by ${submissionStatusBy}` : ``} on ${submissionStatusReadableUTC} [${submissionBanNote}]`;
        } else {
            submissionStatus = 'neutral';
        }

        // Let's figure out what sort of attributes we need to give the OP if any.
        let authorStatus = 'tb-regular';
        let authorAttributes = [];
        if(submissionIsSubmitter) {
            authorStatus = 'tb-submitter';
            authorAttributes.push(`<a class="tb-submitter" title="submitter" href="${submissionPermalink}">S</a>`);
        }
        if (submissionDistinguished) {
            authorStatus = `tb-${submissionDistinguished}`;
            if(submissionDistinguished === 'admin') {
                authorAttributes.push(`<span class="tb-admin" title="reddit admin, speaking officially">A</span>`);
            } else if(submissionDistinguished === 'moderator') {
                authorAttributes.push(`<a class="tb-moderator" title="moderator of /r/${submissionSubreddit}, speaking officially" href="/r/${submissionSubreddit}/about/moderators">M</a>`);
            } else {
                authorAttributes.push(`<a class="tb-unknown" title="Unknown distinguish type ${submissionDistinguished}">${submissionDistinguished}</a>`);
            }
        }


        let commentsButtonText = 'comment';
        if(submissionNumComments === 1) {
            commentsButtonText = '1 comment';
        } else if(submissionNumComments > 1) {
            commentsButtonText = `${submissionNumComments} comments`;
        }


        // Indicate if a submission has been edited or not.
        let editedHtml;
        if (submissionEdited) {
            const submissionReadableEdited = TBUtils.timeConverterRead(submissionEdited),
                editedTimeAgo = TBUtils.timeConverterISO(submissionEdited);
            editedHtml=  `<span class="tb-submission-edited">*last edited <time title="${submissionReadableEdited}" datetime="${editedTimeAgo}" class="tb-live-timestamp timeago">${editedTimeAgo}</time></span>`;
        }

        let $buildsubmission = $(`
            <div class="tb-submission tb-thing ${submissionStatus} ${submissionPinned ? 'pinned' : ''}" data-submission-author="${submissionAuthor}" data-post-id="${submissionName}" data-subreddit="${submissionSubreddit}" data-subreddit-type="${submissionSubredditType}">
                <div class="tb-submission-score ${voteState}">${submissionScore}</div>
                <a class="tb-submission-thumbnail ${submissionOver18 ? 'nsfw' : ''}" href="${submissionUrl}">
                    ${submissionThumbnail.startsWith('http') ? `<img src="${submissionThumbnail}" width="70">` : `<div class="tb-noImage-thumbnail">${submissionThumbnail}</div>`}
                </a>
                <div class="tb-submission-entry">
                    <div class="tb-submission-title">
                        <a class="tb-title" href="${submissionUrl}">${submissionTitle}</a>
                        <span class="tb-domain">
                            (<a href="/domain/${submissionDomain}">${submissionDomain}</a>)
                        </span>
                    </div>
                    ${submissionIsSelf && submissionSelfTextHTML ? '<div class="tb-self-expando-button">+</div>': ``}
                    <div class="tb-tagline">
                        submitted <time title="${submissionReadableCreatedUTC}" datetime="${createdTimeAgo}" class="tb-live-timestamp timeago">${createdTimeAgo}</time> ${submissionEdited ? editedHtml : ''} by <a href="https://www.reddit.com/user/${submissionAuthor}" class="tb-submission-author ${authorStatus}">${submissionAuthor}</a><span class="tb-userattrs">${authorAttributes}</span>
                        <span class="tb-jsapi-author-container"></span> to <a href="/r/${submissionSubreddit}">/r/${submissionSubreddit}</a>
                        ${submissionPinned ? `- <span class="tb-pinned-tagline" title="pinned to this user's profile">pinned</span>` : ''}
                        ${submissionGilded ? `- <span class="tb-comment-gilded">gilded ${submissionGilded}x</span>` : ''}
                    </div>
                    <div class="tb-submission-buttons">
                        <a class="tb-submission-button tb-submission-button-comments" href="${submissionPermalink}">${commentsButtonText}</a>
                    </div>
                    ${submissionIsSelf && submissionSelfTextHTML ? `
                    <div class="tb-self-expando">
                        ${submissionSelfTextHTML}
                    </div>
                    ` : ''}
                    <div class="tb-jsapi-submission-container"></div>
                </div>
            </div>
            `);

        // Now that we have the basic submission build we can go and add details where needed.
        // The two places where we will be adding data specific to the submission are either entry or the button list.
        let $submissionEntry = $buildsubmission.find('.tb-submission-entry');
        let $submissionButtonList = $buildsubmission.find('.tb-submission-buttons');

        if(submissionStatus !== 'neutral') {
            $submissionEntry.append(`
            <div class="tb-submission-data">
                <ul class="tb-submission-details">
                    <li class="tb-status-${submissionStatus}">${submissionStatus} ${submissionActionByOn ? submissionActionByOn : ''}.</li>
                    </ul>
            </div>`);
        }

        // Let's see if we need to add reports starting with user reports
        if(submissionUserReports.length && !submissionIgnoreReports) {
            let $submissionUserReports = $(`
            <ul class="tb-user-reports">
                <li>user reports</li>
            </ul>
            `);

            submissionUserReports.forEach(function(report) {
                const userReport = `
                <li class="tb-user-report">
                    <strong>
                        ${report[1]} :
                    </strong>
                    ${report[0]}
                </li>
                `;
                $submissionUserReports.append(userReport);
            });
            $submissionEntry.append($submissionUserReports);

        } else if (submissionIgnoreReports) {
            let $submissionIgnoredReports = $(`
            <span class="tb-ignored-user-reports">
                reports ignored (${submissionUserReports.length})
            </span>
            `);
            $submissionEntry.append($submissionIgnoredReports);
        }

        // Now we do the same for mod reports.
        // Not sure how ignoring reports works in this context so better to be safe than sorry and just show them.

        if(submissionModReports.length) {
            let $submissionModReports = $(`
                <ul class="tb-user-reports">
                    <li>mod reports</li>
                </ul>
            `);

            submissionModReports.forEach(function(report){
                const modReport = `
                    <li class="tb-mod-report">
                        <strong>
                            ${report[1]} :
                        </strong>
                        ${report[0]}
                    </li>
                `;
                $submissionModReports.append(modReport);
            });
            $submissionEntry.append($submissionModReports);

        }

        if(submissionOver18) {
            $(`<span class="tb-nsfw-stamp tb-stamp"><acronym title="Adult content: Not Safe For Work">NSFW</acronym></span>`).prependTo($submissionButtonList);
        }

        // Now add mod action buttons if applicable.
        if (canModsubmission) {
            if(submissionStatus === 'removed' || submissionStatus === 'spammed' || submissionStatus === 'neutral' || submissionStatus === 'filtered') {
                $(`<a class="tb-submission-button tb-submission-button-approve" data-fullname="${submissionName}" href="javascript:void(0)">approve</a>`).appendTo($submissionButtonList);

            }

            if (submissionStatus === 'approved' || submissionStatus === 'neutral' || submissionStatus === 'filtered') {
                $(`<a class="tb-submission-button tb-submission-button-spam" data-fullname="${submissionName}" href="javascript:void(0)">spam</a>
                <a class="tb-submission-button tb-submission-button-remove" data-fullname="${submissionName}" href="javascript:void(0)">remove</a>`).appendTo($submissionButtonList);
            }

            if (submissionLocked) {
                $(`<a class="tb-submission-button tb-submission-button-unlock" data-fullname="${submissionName}" href="javascript:void(0)">unlock</a>`).appendTo($submissionButtonList);
            } else {
                $(`<a class="tb-submission-button tb-submission-button-lock" data-fullname="${submissionName}" href="javascript:void(0)">lock</a>`).appendTo($submissionButtonList);
            }

            if (submissionOver18) {
                $(`<a class="tb-submission-button tb-submission-button-unnsfw" data-fullname="${submissionName}" href="javascript:void(0)">un-nsfw</a>`).appendTo($submissionButtonList);
            } else {
                $(`<a class="tb-submission-button tb-submission-button-nsfw" data-fullname="${submissionName}" href="javascript:void(0)">nsfw</a>`).appendTo($submissionButtonList);
            }
        }
        $buildsubmission.find('p').addClass('tb-comment-p');
        if(submissionOptions && submissionOptions.subredditColor) {
            const subColor = TBUtils.stringToColor(submissionSubreddit + subredditColorSalt);
            $buildsubmission.css(`border-left`, `solid 3px ${subColor}`);
        }

        return $buildsubmission;
    };


    /**
     * Will build a comment given a reddit API comment object.
     * @function makeSingleComment
     * @memberof TBui
     * @param {object} comment reddit API comment object.
     * @param {object} commentOptions object denoting what needs to be included. Object can contain 'parentLink', 'contextLink' and 'fullCommentsLink' as boolean.
     * @returns {object} jquery object with the build comment.
     */

    TBui.makeSingleComment = function makeSingleComment(comment, commentOptions = {}) {
        // Misc
        const canModComment = comment.data.can_mod_post,

            // Comment basis (author, body, time)
            commentAuthor = comment.data.author,
            commentBodyHTML = comment.data.body_html, // html string
            //commentMarkdownBody = comment.data.body, // markdown string
            //commentCreated = comment.data.created, // unix epoch
            commentCreatedUTC = comment.data.created_utc, // unix epoch
            commentDepth = commentOptions.commentDepthPlus ? comment.data.depth + 1 : comment.data.depth, // integer
            commentLinkId = comment.data.link_id, // parent submission ID
            //commentId = comment.data.id, // comment ID
            commentName = comment.data.name, // fullname t1_<comment ID>
            commentParentId = comment.data.parent_id,
            commentPermalink = comment.data.permalink,
            commentSubreddit = comment.data.subreddit,
            //commentSubredditNamePrefixed = comment.data.subreddit_name_prefixed,
            commentSubredditType = comment.data.subreddit_type,
            //commentReplies = comment.data.replies, // object with replies

            // Comment details
            //commentScoreHidden = comment.data.score_hidden, // boolean
            commentScore = comment.data.score, // integer
            commentControversiality = comment.data.controversiality,  // integer
            commentEdited = comment.data.edited,
            commentGilded = comment.data.gilded,
            //commentNumReports = comment.data.num_reports,
            commentUserReports = comment.data.user_reports, // array with reports by users

            // Comment details - mod related
            commentStickied = comment.data.stickied, // boolean
            commentDistinguished = comment.data.distinguished, // string containing "moderator" or "admin"
            commentModReports = comment.data.mod_reports, // array with reports by mods

            // Author details
            commentAuthorFlairCssClass = comment.data.author_flair_css_class,
            commentAuthorFlairText = comment.data.author_flair_text,
            commentIsSubmitter = comment.data.is_submitter, // boolean - is OP

            // Comment status - mod action
            commentApproved = comment.data.approved, // boolean
            commentApprovedAtUTC = comment.data.approved_at_utc, // unix epoch
            commentApprovedBy = comment.data.approved_by, // unix epoch
            commentSpam = comment.data.spam, // boolean
            commentRemoved = comment.data.removed, // boolean
            commentBannedAtUTC = comment.data.banned_at_utc, // unix epoch
            commentBannedBy = comment.data.banned_by, // Mod that removed the comment
            commentIgnoreReports = comment.data.ignore_reports, // boolean

            // Comment status - other
            //commentArchived = comment.data.archived,
            //commentCollapsed = comment.data.collapsed,
            //commentCollapsedReason = comment.data.collapsed_reason,
            commentBanNote = comment.data.ban_note;

        // Do we have overview data?
        let parentHtml;
        if(commentOptions.overviewData) {
            const linkUrl = comment.data.link_url,
                linkTitle = comment.data.link_title,
                linkAuthor = comment.data.link_author;

            parentHtml = `
            <div class="tb-parent">
                <a class="tb-link-title" href="${linkUrl}">${linkTitle}</a>
                by <a class="tb-link-author" href="/user/${linkAuthor}">${linkAuthor}</a> in <a class="subreddit hover" href="/r/${commentSubreddit}/">${commentSubreddit}</a>
            </div>
            `;
        }

        // Format the comment datetime nicely
        const commentReadableCreatedUTC = TBUtils.timeConverterRead(commentCreatedUTC),
            createdTimeAgo = TBUtils.timeConverterISO(commentCreatedUTC);

        // If we want the permalink of the parent thread we simply remove the comment id from the comment permalink..
        const commentThreadPermalink = TBUtils.removeLastDirectoryPartOf(commentPermalink);

        // Build a parentlink
        // Also determine if we are dealing with a top level comment.
        //let commentIsTopLevel = false;
        const commentParentKind = commentParentId.substring(0,2);
        let commentParentLink;
        if(commentParentKind === 't1') {
            commentParentLink = commentThreadPermalink + commentParentId.substring(3);
            //commentIsTopLevel = true;
        } else {
            commentParentLink = commentThreadPermalink;
        }

        // Let's figure out what the current state is of the comment (approved, removed, spammed or neutral)
        let commentStatus,
            commentStatusUTC,
            commentStatusReadableUTC,
            commentStatusBy,
            commentActionByOn;

        if(commentSpam) {
            commentStatus = 'spammed';
            commentStatusUTC = commentBannedAtUTC;
            commentStatusReadableUTC = TBUtils.timeConverterRead(commentStatusUTC);
            commentStatusBy = commentBannedBy;
            commentActionByOn = `by ${commentStatusBy} on ${commentStatusReadableUTC}`;

        } else if (commentRemoved) {
            commentStatus = 'removed';
            commentStatusUTC = commentBannedAtUTC;
            commentStatusReadableUTC = TBUtils.timeConverterRead(commentStatusUTC);
            commentStatusBy = commentBannedBy;
            commentActionByOn = `by ${commentStatusBy} on ${commentStatusReadableUTC}`;
        } else if (commentApproved) {
            commentStatus = 'approved';
            commentStatusUTC = commentApprovedAtUTC;
            commentStatusReadableUTC = TBUtils.timeConverterRead(commentStatusUTC);
            commentStatusBy = commentApprovedBy;
            commentActionByOn = `by ${commentStatusBy} on ${commentStatusReadableUTC}`;
        } else if (commentBanNote && !commentRemoved && !commentSpam && !commentApproved) {
            commentStatus = 'filtered';
            commentStatusUTC = commentBannedAtUTC;
            commentStatusReadableUTC = TBUtils.timeConverterRead(commentStatusUTC);
            commentStatusBy = commentBannedBy;
            commentActionByOn = `${commentStatusBy ? `by ${commentStatusBy}` : ``}  on ${commentStatusReadableUTC} [${commentBanNote}]`;
        } else {
            commentStatus = 'neutral';
        }

        // Let's figure out what sort of attributes we need to give the OP if any.
        let authorStatus = 'tb-regular';
        let authorAttributes = [];
        if(commentIsSubmitter) {
            authorStatus = 'tb-submitter';
            authorAttributes.push(`<a class="tb-submitter" title="submitter" href="${commentThreadPermalink}">S</a>`);
        }
        if (commentDistinguished) {
            authorStatus = `tb-${commentDistinguished}`;
            if(commentDistinguished === 'admin') {
                authorAttributes.push(`<span class="tb-admin" title="reddit admin, speaking officially">A</span>`);
            } else if(commentDistinguished === 'moderator') {
                authorAttributes.push(`<a class="tb-moderator" title="moderator of /r/${commentSubreddit}, speaking officially" href="/r/${commentSubreddit}/about/moderators">M</a>`);
            } else {
                authorAttributes.push(`<a class="tb-unknown" title="Unknown distinguish type ${commentDistinguished}">${commentDistinguished}</a>`);
            }
        }

        // Nicely format if we are talking about point or points
        let commentScoreText;
        if (commentScore > 1 || commentScore < -1 ) {
            commentScoreText = `${commentScore} points`;
        } else {
            commentScoreText = `${commentScore} point`;
        }


        // Indicate if a comment has been edited or not.
        let editedHtml;
        if (commentEdited) {
            const commentReadableEdited = TBUtils.timeConverterRead(commentEdited),
                editedTimeAgo = TBUtils.timeConverterISO(commentEdited);
            editedHtml=  `<span class="tb-comment-edited">*last edited <time title="${commentReadableEdited}" datetime="${editedTimeAgo}" class="tb-live-timestamp timeago">${editedTimeAgo}</time></span>`;
        }

        let commentDepthClass;

        if(commentOptions.noOddEven) {
            commentDepthClass = commentDepth;
        } else {
            commentDepthClass = TBUtils.isOdd(commentDepth) ? 'odd' : 'even';
        }

        const commentOptionsJSON = TBUtils.escapeHTML(JSON.stringify(commentOptions));
        // Let's start building our comment.
        let $buildComment = $(`
            <div class="tb-thing tb-comment tb-comment-${commentDepthClass}" data-thread-permalink="${commentThreadPermalink}" data-comment-options="${commentOptionsJSON}" data-subreddit="${commentSubreddit}" data-subreddit-type="${commentSubredditType}"  data-comment-id="${commentName}" data-comment-author="${commentAuthor}" data-comment-post-id="${commentLinkId}" >
                <div class="tb-comment-entry ${commentStatus} ${commentStickied ? 'tb-stickied': ''} ${commentAuthorFlairCssClass ? `tb-user-flair-${commentAuthorFlairCssClass}` :  ''}">
                    ${commentOptions.overviewData ? parentHtml : ''}
                    <div class="tb-tagline">
                        <a class="tb-comment-toggle" href="javascript:void(0)">[–]</a>
                        <a class="tb-comment-author ${authorStatus}" href="/user/${commentAuthor}">${commentAuthor}</a>
                        ${commentAuthorFlairText ? `<span class="tb-comment-flair ${commentAuthorFlairCssClass}" title="${commentAuthorFlairText}">${commentAuthorFlairText}</span>` : ''}
                        ${authorAttributes.length ? `<span class="tb-userattrs">[${authorAttributes.join(' ')}]</span>` : ''}
                        <span class="tb-jsapi-author-container"></span>
                        <span class="tb-comment-score ${commentControversiality ? 'tb-iscontroversial' : ''}" title="${commentScore}">${commentScoreText}</span>
                        <time title="${commentReadableCreatedUTC}" datetime="${createdTimeAgo}" class="tb-live-timestamp timeago">${createdTimeAgo}</time>
                        ${commentEdited ? editedHtml : ''}
                        ${commentStickied ? '<span class="tb-comment-stickied">stickied</span>' : ''}
                        ${commentGilded ? `<span class="tb-comment-gilded">gilded ${commentGilded}x</span>` : ''}
                    </div>
                    <div class="tb-comment-body">
                        ${commentBodyHTML}
                    </div>
                    <div class="tb-comment-buttons">
                            <a class="tb-comment-button tb-comment-button-permalink" href="${commentPermalink}">permalink</a>
                    </div>
                    <div class="tb-jsapi-comment-container"></div>
                </div>
            </div>
        `);

        // Now that we have the basic comment build we can go and add details where needed.
        // The two places where we will be adding data specific to the comment are either entry or the button list.
        let $commentEntry = $buildComment.find('.tb-comment-entry');
        let $commentButtonList = $buildComment.find('.tb-comment-buttons');

        // Add some data that is otherwise hidden.
        let $commentData = $(`
        <div class="tb-comment-data">
            <ul class="tb-comment-details">
                ${commentControversiality ? `<li> Controversial score: ${commentControversiality}.</li>` : ''}
             </ul>
        </div>`);
        if(commentStatus !== 'neutral') {
            $commentData.find('.tb-comment-details').append(`<li class="tb-status-${commentStatus}">${commentStatus} ${commentActionByOn ? commentActionByOn : ''}.</li>`);
        }

        if($commentData.find('li').length) {
            $commentEntry.append($commentData);
        }

        // Let's see if we need to add reports starting with user reports
        if(commentUserReports.length && !commentIgnoreReports) {
            let $commentUserReports = $(`
            <ul class="tb-user-reports">
                <li>user reports</li>
            </ul>
            `);

            commentUserReports.forEach(function(report) {
                const userReport = `
                <li class="tb-comment-user-report">
                    <strong>
                        ${report[1]} :
                    </strong>
                    ${report[0]}
                </li>
                `;
                $commentUserReports.append(userReport);
            });
            $commentEntry.append($commentUserReports);

        } else if (commentIgnoreReports) {
            let $commentIgnoredReports = $(`
            <span class="tb-ignored-user-reports">
                reports ignored (${commentUserReports.length})
            </span>
            `);
            $commentEntry.append($commentIgnoredReports);
        }

        // Now we do the same for mod reports.
        // Not sure how ignoring reports works in this context so better to be safe than sorry and just show them.

        if(commentModReports.length) {
            let $commentModReports = $(`
                <ul class="tb-user-reports">
                    <li>mod reports</li>
                </ul>
            `);

            commentModReports.forEach(function(report){
                const modReport = `
                    <li class="tb-mod-report">
                        <strong>
                            ${report[1]} :
                        </strong>
                        ${report[0]}
                    </li>
                `;
                $commentModReports.append(modReport);
            });
            $commentEntry.append($commentModReports);

        }

        // Now we move on to the buttons. Starting with the more general buttons depending on what the options tell us.
        if (commentOptions.parentLink) {
            const $parentLink = $(`<a class="tb-comment-button tb-comment-button-parent" href="${commentParentLink}">parent</a>`);
            $commentButtonList.append($parentLink);
        }

        if (commentOptions.contextLink) {
            const $contextLink = $(`<a class="tb-comment-button tb-comment-button-context" href="${commentPermalink}?context=3">context</a>`);
            $commentButtonList.append($contextLink);
        }

        if (commentOptions.contextPopup) {
            const $contextLink = $(`<a class="tb-comment-button tb-comment-context-popup" href="javascript:;" data-comment-id="${commentName}" data-context-json-url="${commentPermalink}.json?context=3">context-popup</a>`);
            $commentButtonList.append($contextLink);
        }

        if (commentOptions.fullCommentsLink) {
            const $fullCommentsLink = $(`<a class="tb-comment-button tb-comment-button-fullcomments" href="${commentThreadPermalink}">full comments</a>`);
            $commentButtonList.append($fullCommentsLink);
        }

        // Now add mod action buttons if applicable.
        if (canModComment) {
            if(commentStatus === 'removed' || commentStatus === 'spammed' || commentStatus === 'neutral' || commentStatus === 'filtered') {
                $(`<a class="tb-comment-button tb-comment-button-approve" data-fullname="${commentName}" href="javascript:void(0)">approve</a>`).appendTo($commentButtonList);

            }

            if (commentStatus === 'approved' || commentStatus === 'neutral' || commentStatus === 'filtered') {
                $(`<a class="tb-comment-button tb-comment-button-spam" data-fullname="${commentName}" href="javascript:void(0)">spam</a>
                <a class="tb-comment-button tb-comment-button-remove" data-fullname="${commentName}" href="javascript:void(0)">remove</a>`).appendTo($commentButtonList);
            }
        }
        $buildComment.find('p').addClass('tb-comment-p');

        if(commentOptions.subredditColor) {
            const subColor = TBUtils.stringToColor(commentSubreddit + subredditColorSalt);
            $buildComment.css(`border-left`, `solid 3px ${subColor}`);
        }

        return $buildComment;

    };
    /**
     * Will build a comment given a reddit API comment object.
     * @function makeCommentThread
     * @memberof TBui
     * @param {object} jsonInput reddit API comments object.
     * @param {object} commentOptions object denoting what needs to included. Object can contain 'parentLink', 'contextLink' and 'fullCommentsLink' as boolean.
     * @returns {object} jquery object with the build comment thread.
     */
    TBui.makeCommentThread = function makeCommentThread(jsonInput, commentOptions) {
        let $commentContainer = $(`<div class="tb-comment-children"></div>`);

        jsonInput.forEach(function(comment) {
            let $childComments;

            if(comment.kind === 't1') {
                let $comment = TBui.makeSingleComment(comment, commentOptions);
                if(comment.data.replies) {
                    $childComments = makeCommentThread(comment.data.replies.data.children, commentOptions);
                    $comment.append($childComments);
                }
                $commentContainer.append($comment);
            } else if(comment.kind === 'more') {
                const count = comment.data.count;
                const commentIDs = comment.data.children.toString();

                $commentContainer.append(`<span class="tb-more-comments"><a class="tb-load-more-comments" data-ids="${commentIDs}" href="javascript:void(0)">load more comments</a> (${count} replies)</span>`);
            }

        });

        return $commentContainer;
    };

    // handling of comment & submisstion actions.
    // TODO make this into command pattern
    $body.on('click', '.tb-comment-button-approve', function() {
        const $this = $(this);
        const fullname = $this.attr('data-fullname');
        TBUtils.approveThing(fullname, function (succes, error) {
            if (succes) {
                $this.replaceWith('<span>approved</span>');
            } else if(error) {
                $this.replaceWith(`<span class="color: red">${error}</span>`);
            } else {
                $this.replaceWith(`<span class="color: red">something went wrong</span>`);
            }

        });
    });

    $body.on('click', '.tb-comment-button-remove, .tb-submission-button-remove', function() {
        const $this = $(this);
        const fullname = $this.attr('data-fullname');
        TBUtils.removeThing(fullname, false, function (succes, error) {
            if (succes) {
                $this.replaceWith('<span>removed</span>');
            } else if(error) {
                $this.replaceWith(`<span class="color: red">${error}</span>`);
            } else {
                $this.replaceWith(`<span class="color: red">something went wrong</span>`);
            }

        });
    });

    $body.on('click', '.tb-comment-button-spam, .tb-submission-button-spam', function() {
        const $this = $(this);
        const fullname = $this.attr('data-fullname');
        TBUtils.removeThing(fullname, true, function (succes, error) {
            if (succes) {
                $this.replaceWith('<span>spammed</span>');
            } else if(error) {
                $this.replaceWith(`<span class="color: red">${error}</span>`);
            } else {
                $this.replaceWith(`<span class="color: red">something went wrong</span>`);
            }

        });
    });

    $body.on('click', '.tb-submission-button-lock', function() {
        const $this = $(this);
        const fullname = $this.attr('data-fullname');
        TBUtils.lockThread(fullname, function (succes, error) {
            if (succes) {
                $this.replaceWith('<span>locked</span>');
            } else if(error) {
                $this.replaceWith(`<span class="color: red">${error}</span>`);
            } else {
                $this.replaceWith(`<span class="color: red">something went wrong</span>`);
            }

        });
    });

    $body.on('click', '.tb-submission-button-unlock', function() {
        const $this = $(this);
        const fullname = $this.attr('data-fullname');
        TBUtils.lockThread(fullname, function (succes, error) {
            if (succes) {
                $this.replaceWith('<span>unlocked</span>');
            } else if(error) {
                $this.replaceWith(`<span class="color: red">${error}</span>`);
            } else {
                $this.replaceWith(`<span class="color: red">something went wrong</span>`);
            }

        });
    });


    $body.on('click', '.tb-submission-button-nsfw', function() {
        const $this = $(this);
        const fullname = $this.attr('data-fullname');
        TBUtils.markOver18(fullname, function (succes, error) {
            if (succes) {
                $this.replaceWith('<span>marked nsfw</span>');
            } else if(error) {
                $this.replaceWith(`<span class="color: red">${error}</span>`);
            } else {
                $this.replaceWith(`<span class="color: red">something went wrong</span>`);
            }

        });
    });

    $body.on('click', '.tb-submission-button-unsfw', function() {
        const $this = $(this);
        const fullname = $this.attr('data-fullname');
        TBUtils.unMarkOver18(fullname, function (succes, error) {
            if (succes) {
                $this.replaceWith('<span>unmarked nsfw</span>');
            } else if(error) {
                $this.replaceWith(`<span class="color: red">${error}</span>`);
            } else {
                $this.replaceWith(`<span class="color: red">something went wrong</span>`);
            }

        });
    });



    $body.on('click', '.tb-comment-toggle', function() {
        const $this = $(this);
        const thisState = $this.text();
        const $comment = $this.closest('.tb-comment');
        $comment.find('.tb-comment-children').first().toggle();
        $comment.find('.tb-comment-body').first().toggle();
        $comment.find('.tb-comment-buttons').first().toggle();
        $comment.find('.tb-comment-details').first().toggle();

        if(thisState === '[–]') {
            $this.text('[+]');
        } else {
            $this.text('[–]');
        }
    });

    $body.on('click', '.tb-load-more-comments', function() {
        const $this = $(this);
        const $thisMoreComments = $this.closest('.tb-more-comments');
        const commentIDs = $this.attr('data-ids').split(',');
        const commentIDcount = commentIDs.length;
        const $thisComment = $this.closest('.tb-comment');
        const threadPermalink = $thisComment.attr('data-thread-permalink');
        const commentOptionsData = $thisComment.attr('data-comment-options');


        let commentOptions = JSON.parse(commentOptionsData);
        // This is to make sure comment coloring still is correct.
        commentOptions.commentDepthPlus = true;
        let processCount = 0;
        TB.ui.longLoadSpinner(true); // We are doing stuff, fire up the spinner that isn't a spinner!
        commentIDs.forEach(function(id) {
            const fetchUrl = `${TBUtils.baseDomain}/${threadPermalink}${id}.json?limit=1500`;
            console.log(fetchUrl);
            // Lets get the comments.
            $.getJSON(fetchUrl, {raw_json: 1}).done(function (data) {
                const $comments = TBui.makeCommentThread(data[1].data.children, commentOptions);
                window.requestAnimationFrame(function() {
                    $thisMoreComments.before($comments.html());
                });

                TBui.tbRedditEvent($comments, 'comment');

                processCount = processCount + 1;
                if(processCount === commentIDcount) {
                    $thisMoreComments.remove();
                    $('time.timeago').timeago();
                    TB.ui.longLoadSpinner(false);
                }

            });
        });


    });

    $body.on('click', '.tb-self-expando-button', function() {
        const $this = $(this);
        const thisState = $this.text();
        const $selfText = $this.closest('.tb-submission').find('.tb-self-expando');
        $selfText.toggle();

        if(thisState === '+') {
            $this.text('-');
        } else {
            $this.text('+');
        }
    });





    // Utilities

    TBui.getBestTextColor = function (bgColor) {
        if(!TBui.getBestTextColor.cache[bgColor]) {
            const textColors = ['black', 'white'];
            TBui.getBestTextColor.cache[bgColor] = tinycolor.mostReadable(bgColor, textColors).toHexString();
        }
        return TBui.getBestTextColor.cache[bgColor];
    };
    TBui.getBestTextColor.cache = {};

}(TBui = window.TBui || {}));
