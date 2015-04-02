(function (TBui) {
    TBui.longLoadArray = [];
    TBui.longLoadArrayNonPersistent = [];

    // Icons
    TBui.iconWrench = 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAHaSURBVDjLlZO7a1NRHMfzfzhIKQ5OHR1ddRRBLA6lg4iT\
            d5PSas37YR56Y2JiHgg21uoFxSatCVFjbl5iNBBiMmUJgWwZhCB4pR9/V4QKfSQdDufF5/v7nu85xwJYprV0Oq0kk8luIpEw4vG48f/eVDiVSikCTobDIePxmGg0yokEBO4OBgNGoxH5fJ5wOHwygVgsZpjVW60WqqqWz\
            bVgMIjf78fn8xlTBcTy736/T7VaJRQKfQoEArqmafR6Pdxu9/ECkUjkglje63Q6NBoNisUihUKBcrlMpVLB6XR2D4df3VQnmRstsWzU63WazSZmX6vV0HWdUqmEw+GY2Gw25SC8dV1l1wrZNX5s3qLdbpPL5fB6vXumZal\
            q2O32rtVqVQ6GuGnCd+HbFnx9AZrC+MkSHo/np8vlmj/M7f4ks6yysyawgB8fwPv70HgKG8v8cp/7fFRO/+AllewqNJ/DhyBsi9A7J1QTkF4E69mXRws8u6ayvSJwRqoG4K2Md+ygxyF5FdbPaMfdlIXUZfiyAUWx/OY25O\
            4JHBP4CtyZ16a9EwuRi1CXs+5K1ew6lB9DXERX517P8tEsPDzfNIP6C5YeQewSrJyeCd4P0bnwXYISy3MCn5oZNtsf3pH46e7XBJcAAAAASUVORK5CYII=';

    TBui.iconDelete = 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAJdSURBVDjLpZP7S1NhGMf9W7YfogSJboSEUVCY8zJ31trcps6z\
            TI9bLGJpjp1hmkGNxVz4Q6ildtXKXzJNbJRaRmrXoeWx8tJOTWptnrNryre5YCYuI3rh+8vL+/m8PA/PkwIg5X+y5mJWrxfOUBXm91QZM6UluUmthntHqplxUml2lciF6wrmdHriI0Wx3xw2hAediLwZRWRkCPzdDswaSvGq\
            kGCfq8VEUsEyPF1O8Qu3O7A09RbRvjuIttsRbT6HHzebsDjcB4/JgFFlNv9MnkmsEszodIIY7Oaut2OJcSF68Qx8dgv8tmqEL1gQaaARtp5A+N4NzB0lMXxon/uxbI8gIYjB9HytGYuusfiPIQcN71kjgnW6VeFOkgh3XcHL\
            vAwMSDPohOADdYQJdF1FtLMZPmslvhZJk2ahkgRvq4HHUoWHRDqTEDDl2mDkfheiDgt8pw340/EocuClCuFvboQzb0cwIZgki4KhzlaE6w0InipbVzBfqoK/qRH94i0rgokSFeO11iBkp8EdV8cfJo0yD75aE2ZNRvSJ0lZK\
            cBXLaUYmQrCzDT6tDN5SyRqYlWeDLZAg0H4JQ+Jt6M3atNLE10VSwQsN4Z6r0CBwqzXesHmV+BeoyAUri8EyMfi2FowXS5dhd7doo2DVII0V5BAjigP89GEVAtda8b2ehodU4rNaAW+dGfzlFkyo89GTlcrHYCLpKD+V7yee\
            HNzLjkp24Uu1Ed6G8/F8qjqGRzlbl2H2dzjpMg1KdwsHxOlmJ7GTeZC/nesXbeZ6c9OYnuxUc3fmBuFft/Ff8xMd0s65SXIb/gAAAABJRU5ErkJggg==';

    TBui.iconClose = 'iVBORw0KGgoAAAANSUhEUgAAAA4AAAAOCAYAAAAfSC3RAAAA1klEQVQoz6WSOw6CQBCG90gWXsjKxph4HZAEsgUSHlsAAa6ilzDGgopxP5Ix2K7FJH/+x+wMjBERoxXH8d5aey2K4l6W5ZMCw6FtvV+Qpumlrut313UyDIOM47gWGA4N\
            z08QomkaadtW+r5fA9M0rQWGQ8OjYRNF0c53mxH8aLc8z8/OuYWXKDAcGh68ZAzzMwpdveFEtyzLDt6AScBwaHjwkjF++cem+6zGJEmOlDZCUx8ZU1XVS3eC9K8sGtAGcGi6M5nwYPCowR8n+HcEH8BfJxdy5B8L5i9vzgm5WAAAAABJRU5ErkJggg==';

    TBui.iconHide = 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAEeSURBVHjaYvz//z8DJYAR3YD0WWdxqQUp\
            PDAzzdgRVRRoADJOmX4Km9j/M0///wfR6HJM6Nb8+fMHhZ845fj/DD9TrHIgwIIu8PfvX4azzyDsiauP/M8PtWH48w8hhw4wXPD7928w3bNsP1jzd6Clv/9BMVQOrwtAzuxYtPt/RZwrw8ef+L2H1QCg\
            Lf9rk70YXn3FjAZsLsDqhVO33zD8BHoXHRNrAOP6HQcYHjx9zfAT6GJkTJQBIH/GRoQwbtqxl+HRs1cMv4A2wzC2MMDqBVCIx0RFMG7atpPh8bOXeGOBCVs6AMU7CMfGxjJu2bad4cmzF2A+UekA3ZkJ\
            CQmMW7ZsYXj+/DlWL2BkJpP0WXgz05mZaY54DSAVAAQYAJIy51a9uUPIAAAAAElFTkSuQmCC';

    TBui.iconShow = 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAEiSURBVHjaYvz//z8DJYAFXSB91tn9QMoB\
            iBmxaZiZZowqAHIBMk6Zfur/maf//4NoLHIY6pnQbfjz5w+YzvAzZUiccvw/NjlkgGHA379/Gf78YwDjnCBLhriJR/6ffcbAAMIgOYIG/P79m+E3UDMIfwdamB9qw9CzbP9/mBzBQAQ58xeSRSB2SZQj\
            Q8ei3f+xBSxWF/wE2oyMX31lYKiIcwXJ/SfoArABmF5lOHX7DXFegLkAGTx/+Zph256DDER5ARYGMPzo2SuGTTv2MsRGhDBii0YWXLEAAi9evGTYvnMXQ2J8LCM4ZojxAiwdvHjxgmHHjh0MCQkJjH/+\
            IeSI8sLz588ZtmzZAtZMKCUyoudGk/RZeDPTmZlp+A0gFQAEGAAg59gynHEu1AAAAABJRU5ErkJggg==';

    TBui.iconAdd = 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAJvSURBVDjLpZPrS5NhGIf9W7YvBYOkhlkoqCklWChv2WyKik7b\
            lnNris72bi6dus0DLZ0TDxW1odtopDs4D8MDZuLU0kXq61CijSIIasOvv94VTUfLiB74fXngup7nvrnvJABJ/5PfLnTTdcwOj4RsdYmo5glBWP6iOtzwvIKSWstI0Wgx80SBblpKtE9KQs/We7EaWoT/8wbWP61gMmCH0lMD\
            vokT4j25TiQU/ITFkek9Ow6+7WH2gwsmahCPdwyw75uw9HEO2gUZSkfyI9zBPCJOoJ2SMmg46N61YO/rNoa39Xi41oFuXysMfh36/Fp0b7bAfWAH6RGi0HglWNCbzYgJaFjRv6zGuy+b9It96N3SQvNKiV9HvSaDfFEIxXIt\
            nPs23BzJQd6DDEVM0OKsoVwBG/1VMzpXVWhbkUM2K4oJBDYuGmbKIJ0qxsAbHfRLzbjcnUbFBIpx/qH3vQv9b3U03IQ/HfFkERTzfFj8w8jSpR7GBE123uFEYAzaDRIqX/2JAtJbDat/COkd7CNBva2cMvq0MGxp0PRSCPF8\
            BXjWG3FgNHc9XPT71Ojy3sMFdfJRCeKxEsVtKwFHwALZfCUk3tIfNR8XiJwc1LmL4dg141JPKtj3WUdNFJqLGFVPC4OkR4BxajTWsChY64wmCnMxsWPCHcutKBxMVp5mxA1S+aMComToaqTRUQknLTH62kHOVEE+VQnjahsc\
            NCy0cMBWsSI0TCQcZc5ALkEYckL5A5noWSBhfm2AecMAjbcRWV0pUTh0HE64TNf0mczcnnQyu/MilaFJCae1nw2fbz1DnVOxyGTlKeZft/Ff8x1BRssfACjTwQAAAABJRU5ErkJggg==';

    TBui.iconConsole = 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFke\
            XHJZTwAAAIiSURBVBgZpcE7SJZhFMDx/3neV/u8ZlhoVxAkESoyJYoa3BojDCFc25psaS8CWxoEhxAagiCpHCpqaa3AyiIISwjTtHIou3wX/b73nFOPIEG0\
            SL+fuDv/Q04Mjp052ttz6WvR69wBM9wMNcXNMTdcFXPHVVEzGqsrhamphXPjl/tH0p4jPcNVubrQkmM96gpFHQZG0mLFQ/FrnvUqVTzwW+rqXBxoZ71OD80Sp\
            e5GVM4UB9wcNTAcM0fN0MzRzFE3yuq0tTagpkQBdyIJQhAIQQgJJCKkIZAmKf7zBeV3Q1RJidqqlMgyJQpqShQAEUGCkAQhJIIECF5ieW6c\
            +uZ9VD7dJ60ORKZGFNycVSJEAQgihCAkiVD88IDa5i4at3ZRmHsI+RkiMyUKZsoaEQERogBofoFv7+7RsLkJ/XGHLZ2n+P72Bm4ZZkYUskqFVSKI\
            CJGIEH15c5Pm9uOwPMnEtevUN5X4MfOI77OPySoZUXA1ogQQQEQQoPB5Ei0s0bCpiK3MgBuaf0pb71nmn1yhimWiYGasESAA4sris6s07dqPFV/hVqK7\
            rwMrfySXm6ZxxyG6aiaI5MTg2FjLzm39poqpoars2fCUkwdztO6uQfMTuJd5fnuK7r5OJNkINcd4NHphpdpLB8Td+dvE8OH5vQPXtyfhPZ4tAc4fgaSmg\
            8XXL5m+e/5Wyj9kK+Xc5Ghfyc1xM9wMN8PNcTPcHMxw99ZfSC4lgw+6sSMAAAAASUVORK5CYII=';

    TBui.iconBox = 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAG9SURBVDjLpZO9apRREIafDVuIhMjGhPwJukashNjoNdgIqQQ\
                bG8U7ECy0i4UXIMQLEKxtrCwsRMRKbBSCoBhQwRjwZ3e/M/O+FufbTYRYZWA45wznnXk4Z6Zjm8PYFIe0LsDDG/1pm03jy5gpAzbIxga3q2wMv2Q/uPXo8wZAZ/P6qVmbrd7iyd7cUh86HWhFMvvcpKBE4fv2B358+7Rx+/H23\
                a7Nq+PL/d7c8ipf3r+kjH6jhDSkTAjCRoISZmbhNDMLq4S4c+/K8rmu8fzahYu8fvaEwc+dKm5FIZMJIVMSIsXu1ltmhw1nzq6x8/XjeteG+ZVF1q/dRKMhVqBInElG4igoApXxPlEJpo4t8eaF6drgEIPdd6j5g0KoqCYpSRSh\
                kq0LlZps+ugJZOjWxxEuSQ6zVohETZIh1LTiNqYQGTVmtwQqiUZBjgKVICfVsj0Ll7GwpYvcI1AkOSyUYTkQN4twCjWB0jgryYTAjYhRkIPyH1zVilETOV19QlCSHAQ5bA7GTaEUDuFxZ9EmsCGLOLJyvv5AGmvvstVWlGt/7zNj\
                Ovevrjy1uST90+8Hz4HBVYkrwfPOYcf5L9lR/9+EMK8xAAAAAElFTkSuQmCC';

    TBui.iconCommentRemove = 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAG2SURBVDjLrZNJKIRhGMdHxpTtwIUoRRxdlZvcJsuFc\
                BAHFHGSSBKlbCUZOTgolLKXskyDshwsJWQLYx+DGcaSsWS+5+95Z5jQzJjirf/hfb9+v+d5l08GQPaXyP5NkFGnDuT0cF45cBENJ9KRYKRvdg9vFgmuxujSkZDscxR2AU/8OBaJCHdPhKsHgv6eoLslnJgIh9eEfYMErcEmr+hcEJKYr\
                4KworYZ68dLBvV3hDOGj28IBx/wzqWELb1N0NC/IgQJDgXnDJ+aPmAjYe/KBm8yvK5zLrBvQbR/xFW1Rgm7DG9fSNhgeE0nBBaroLJ7UQhiHR6ikHwdopu1M8kq/nGI3s6u0fJ5ZR3qLbtIoyrARFoQpuLlGE70oZb0QM2vD4kl2guTGV\
                3VmVgticXzWBNoWw1zbzGWC6NRk+o/7Qpuah/fFJ08DiX50RPDUCUBZQFAbTiMjXHoUyrIGRzBOeTkirlom1aGv53NbVUwJnndrfc+wJUeO3IAhl5KZTBxTvI9Maj0IrcErVkhcwt5UdCXhcNQ7oWDXA9MJctRn+I77/Zf15wdOtOvVEii\
                7QGuzPCsWH8HCxz5pzmy7lQAAAAASUVORK5CYII=';

    TBui.iconCommentsRemove = 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAIwSURBVDjLhZHLaxNRGMUjaRDBjQtBxAdZFEQE/wEFUau\
                rLm1FfEGzENwpturG6qIFrYUKXbUudOODNqIiTWqvFEwXKo1UUVRqS2NM0kmaZPKYPKbJ8XzTiUQxceDH3HvnO+e73xnH8X7fLjJInjbgEekiOwA4/sbBD0Ov5sIqY5SVXiO/Rpospw01HphXrOttZPBMxCkWJ3NltZItq3i2pOKZklrWi\
                9Z5SMuKwf2GBtJVxJotiqWLKpIqqHCyYO3/Z/A8UyirBDtLcZTi6Y+RdxdHAsnTAy/NM0TerCuRlE2Y9El+YjCWoLBkViyxdL40OpNmLuBo0Gvk12AuYC5gLqB2XAw8A2NBFZzXVHm1YnHq1qQpYs4PjgbmAuYC5gLe0jrnWGLwzZqDi33k\
                sSTunw3JvKZ0FbFmi5gLeDswF2v/h4Ftcm8yaIl9JMtcwFys4midOJQwEOX6ZyInBos18QYJk0yQVhJjLiiald/iTw+GMHN2N6YOuTB9YieCozfE4EvNYDO5Ttz2vn/Q+x5zC3EwEyw9GcaH7v0ovLiN6mcf8g8v4O35vRg+edTr+Ne/tU2O\
                EV03SvB3uGFQjDvtQM8moM+N+M0D8B92LjQ0sE2+MhdMHXShOutF/ZO6toXnLdVm4o1yA1KYOLI+lrvbBVBU7HYgSZbOOeFvc4abGWwjXrLndefW3jeeVjPS44Z2xYXvnnVQ7S2rvjbn1aYj1BPo3H6ZHRfl2nz/ELGc/wJRo/MQHUFwBgAAAABJRU5ErkJggg==';


    TBui.iconCommentsEdit = 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAIWSURBVDjLjZNPSBRRHMf32rVTdFOsDkJEhODNLGqXukgJpmiEURBGdEnbskNktrhCRQuaL\
                EEikUhlbK5EiZmxjbWwfxvL0dHdtdlCx3VtZxyaed/eG5qwZct98DnM4/f9vN/M+40NgK1Y5p7tPTY9UIeZ4Q6EvIcQ9pQ3FR1O+kvqpbFWZCI+YG0RK5EhBNz2dFHhxIvSWjl+TdOSzyGNd0GJPoE+P4nogzPqpuGUv8wux64ahjIJZbYFy1Pnwfc3I9L\
                XuDR1t2bnf8PC0xKHHL0MQw0gJ5yEmmhA9pMTYm9VOth9cA+rsdV1jm6lDFA0Cizabl6H9KH1d7gJ6kI9VmNXIHiqs5/dFfusQ5hg+PGbL/ipG7CWxPvAv7wEQ5mAKjZjPdGIDO2E9xwmgS7Hjo1dMoFuEIKMQvAtS8C9eoT4iBNh/22kuFrkxAYsh9ow661Bp9fHuqv4S9DiGT\
                dPTa8SfM0QDLoOANl5TN8/jjHndrzrceCt2w71uwDXYJAJjhQULNJwQia4cXY3tMA9aNwdcB37MXRuF4Ih3qwpKLBegbUvLhGcqN6GW6fK8dp1FBP9F/AxvoBwSjcF7Q/fM0FlvsD8iEyycbFuQknDFLPl40QWnqFsyRdY16hbV+gdjf8Rraytm890P0opy5+VggNECwVJzllBld\
                L+r2ErFO7uHYmx4A/Kxc1GPT9cSpmjnC72L/0FRS76cD+dhSEAAAAASUVORK5CYII=';


    TBui.iconGripper = 'iVBORw0KGgoAAAANSUhEUgAAAAYAAAAOCAIAAACD/fpyAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAdSURBVChTY/iPAXAL1c3bD0QQNm4hZDBkzPr/HwBeT+1tHhuGywAAAABJRU5ErkJggg==';

    TBui.iconGear = 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAoJJREFUeNqkU01oE1EQnk02iTFQE7QihUKRkKTF1iU9+FdQCoWYgAcP\
            egkIeiiIWiHgwUvpQXs1Ggo99OYlFwUhWAhYhZJWUmhMxJbYYk1LFDcmJraSv911vjQbevPgg9kZ5vu+eW9n3hM0TaP/WSI+gUCADAYDmUwmEgSBUNRoNJ5jaKjNSyuKsqRjjUaDVFWlWCy2X0BfDJ5n\
            d5r9KxZI0Wh0BuRgMHibcznGrrD/wD6hawwHxBdcLte12dnZGYfDcYOFhkJBpnL5F3Y0IAcMHHB1nYAj+Xw+xHeZ8FSWf1BPTw+trqY2JElyAkilUhsej8dZKhWpu/s4jY+P3+P0s/n5+f0TVCoVqlar\
            L0Oh0KTZbCZZlmlgoN+pqgrBEO/u/iZg4IALTecX+BQX6/X69Xw+v8e7bYqiSMvLy+t+f2AGhhg5YOCAC43+7+T1eh+srCS1hYU32tJSQkun09rg4NA0TwLTIMTIAQMHXGigbU2hVqsZq9UaNZsKKYrK\
            oxRZKDYwKizEyAEDB1xoOk3kzo6xP4PExMT9WyMjl/q2t7+npqYevkBucvLx1d7eE9Li4tutcPjJXEsoCO+z2WxcP0GcC3zmDt8ZHj7bVyyWyO32SLHYOwl4ufyTdna+ELCuriN2nlSEC2x1mshdRZGb\
            kchcSJaLfCOtFI+//prLbRIMMXLAwAEXmk4T+ZLALo+Ojj1PJtc1t7s/bLfbHyUSGQ2GGDlg4IALTesd6Y8JY7JarX6bzTZtsVhOwq+tfdMymZx2MAcOuPrmrSYKaDHRUbZjbIcA8sM6xQ9sADFP4xNf\
            54/t21tnk9kKrG3qBdCLw20T//GCFbY9tj+sVf8KMAACOoVxz9PPRwAAAABJRU5ErkJggg==';

    TBui.topIcon = 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAEGSURBVDjLpZM/LwRRFMXPspmEaGc1shHRaiXsJ5GI\R\
            ixbCr6SikxIlqgJM5UohIiGdofovHf/PZVmYwZvTntPfjnn3txWCAFNNFE33L/ZKXYv+1dRgL3r7bu0PbucJp3e4GLjtsrXGq9wkA8SU7tPk87i/MwCzAyP5QNeytcnJl46XMuoNoGKDoVlTkQhJpAgmJqcBjnqkqPTXxN8\ \
            qz9cD6vdHtQMxXOBt49y5XjzLB/3tau6kWewKiwoRu8jZFvn+U++GgCBlWFBQY4qr1ANcAQxgQaFjwH4TwYrQ5skYBOYKbzjiASOwCrNd2BBwZ4jAcowGJgkAuAZ2dEJhAUqij//wn/1BesSumImTttSAAAAAElFTkSuQmCC';

    TBui.logo64 = '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';

    TBui.iconBot = 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAACz0lEQVQ4T3VTXUhTYRh+zzbdNHZ0E5sjdLOiLnTahQaCFGiIwSK9iIGhGQjOM3GgN0MENYTJYGKiG91kPxe5qxkJk0jQ7EKwvHAarMTMtvYD+2XqnHPr/Q4Jm60PDt95v/f7nvM8z/ccCs4NrVY7I5FIng4ODn5Lb\
                    +n1ernX69VNTk6q09ep8wAjIyOcvb09o0wm04+OjvpIX6PR3OJyuU1isfgJ9uP/BZiYmLgUDAYtqVTqSjKZFOKhMM5crGl8D+LBHyKRSNXf3+86A8lgYDAYOuRy+UuFQgFutwdKS0tBIBDAzs4OFBTQ7Ly7u/tIp9O9ygowPm7oKSoSmQKBAJSVlYHP5wOhkMa9KQiFQsDhcCAWizEI\
                    YM4KYDQaew4PD01VVVXQ2HgHTKYZODqKQW+vBhwOB9hsNigsLGQGBgayA0xNTfXQNG3yeDzA4/EA9UJ+/gXY3/8J6APKKICTkxOmr6/vXwCz2VzpcrneV1YqpHV1dSxloVDIMo1Go4DAsLa2Bltbdjf61NTV1bVFeqyJeLfX/X7/SnPzXcnq6kc4PT0FdD3jhgmDRCIBDQ2NsLho80ql\
                    0tsMwzio6enpa0h5Wam8JyXuz829gerqG2iijNBlqefk5MDBQRTm563Q3a0Gu90OCwvv3Bi4GmpoaGgVDauvra2B7e2vpAEtLS1QXn6ZBSCD+BEOh2F29jkolUqoqKiA9fXPsLT04RM1PDzsV6lU4ng8DlarNcLn82kMDxwfH2dIwHUgD/qRaG1t5eXm5oLFYglQY2Nj9filtxRFEe3\
                    a4uLi1+3tHZBMpmBlZRmczl+QXm9sfHmGjB78lXafNRHzLUCXKdR6FRubbW0PWQBiqMvlhPTa7f7NINsXkUgkhediGVHGf0HB5fI2Ozs70TwgGpGBE9JrBMyeA8IEg8TH69zPy8u7SGqMbQgZxdPrkhLZTbX68fczg/4A1KNbXBApXrkAAAAASUVORK5CYII=';

    TBui.iconRefresh = 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAI/SURBVDjLjZPbS9NhHMYH+zNidtCSQrqw\
            QtY5y2QtT2QGrTZf13TkoYFlzsWa/tzcoR3cSc2xYUlGJfzAaIRltY0N12H5I+jaOxG8De+evhtdOP1hu3hv3sPzPO/z4SsBIPnfuvG8cbBlWiEVO5OUItA0VS8oxi9EdhXo+6yV3V3UGHRvVXHNfNv6\
            zRfNuBZVoiFcB/3LdnQ8U+Gk+bhPVKB3qUOuf6/muaQR/qwDkZ9BRFdCmMr5EPz6BN7lMYylLGgNNaKqt3K0SKDnQ7us690t3rNsxeyvaUz+8OJpzo/QNzd8WTtcaQ7WlBmPvxhx1V2Pg7oDziIBimww\
            f3qAGWESkVwQ7owNujk1ztvk+cg4NnAUTT4FrrjqUKHdF9jxBfXr1rgjaSk4OlMcLrnOrJ7latxbL1V2lgvlbG9MtMTrMw1r1PImtfyn1n5q47TlBLf90n5NmalMtUdKZoyQMkLKlIGLjMyYhFpmlz3n\
            GEVmFJlRZNaf7pIaEndM24XIjCOzjX9mm2S2JsqdkMYIqbB1j5C6yWzVk7YRFTsGFu7l+4nveExIA9aMCcOJh6DIoMigyOh+o4UryRWQOtIjaJtoziM1FD0mpE4uZcTc72gBaUyYKEI6khgqINXO3saR\
            7kM8IZUVCRDS0Ucf+xFbCReQhr97MZ51wpWxYnhpCD3zOrT4lTisr+AJqVx0Fiiyr4/vhP4VyyMFIUWNqRrV96vWKXKckBoIqWzXYcoPDrUslDJoopuEVEpIB0sR+AuErIiZ6OqMKAAAAABJRU5ErkJg';

    TBui.iconUsernotes = 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAJtSURBVDjLpZPNS5RRFMZ/7zgzWmqTFpOb\
                        MiuyKDOFCoJaCUKKUFAUBRKtWrSpoP8gwk1BixbpppURtIigqAjKkgSp0KJP86NGbaYZpxmd9773ve89LTTKj1bdxblw4Pmd53Kf44gI/3PCADJyT0z+ByIaMT4S+IjRiPGQwANfERiFGBd8RezQDWc+\
                        IDBEth9dRBcBB+YKIDB169hiB142wTIRxLqzXQdELOAg/CE4oWLEd5d4gjFYPYnJ94H1ENGzt9VgFWIVYl2iqw9i/cISgMADDGIViD8n+lusEFvATfaTLq4ie+eizPx4gqMS7WEAM52etTxvsou1ag7i\
                        onPDeD+XU1V3glhNA9nhWt4/6OwIA9hAoT71YLzPEGgQQ6BylFTHEVtA58agpIHK+C4yQ++IOpryFVWUrVoXCwMEbhqTS1C28zhgsXqU/KubSFDAn/kGxTuI1TTjTXQTXe4w+vo9vtJp5U7vDQE4IvjJ\
                        AaYenScofILAx4qPl/+KhLcS29iCGr+OE5kiUlZOSWHou5+baNp15vbH0O//Lt/djp9NkX16GSs+mfQ42m4htqkNlbhGKOKjc+tJPn6OzhdaG88+fA0QAsAonKIQpY2nELOSsftd2JV7iG9rQU92UhQV\
                        vFw1qWf9RFJ9bD7X178gB4qp+1cQoxhLZihrbMNInInBq1TEo6jMWjJPewinX2K1mpcDZ+Ey3epoksOnu/jQfZ7xkV6K19VjkqnximhRc92FF28Wxj20sPHh86TRb+9SU7+P0tJaEv2D08rVB5YSL+ng\
                        yP5Kt3HDmvDurTVIxOt1k6mTrZcGvvxrnX8BwNty8Brb9FgAAAAASUVORK5CYII=';

    TBui.iconNuke = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAYAAABWdVznAAAB8UlEQVR42lXP20uTYQCA8ed9v81tzLkmeMCPnDHNC+0geMCV1Fx2I5lgybxK0xCMNdQIHDMiLBJv6rKMA\
                     kMUsYN4FxKa2bLMMLCN1BlEKRLURQ0q2ldzu+n3Dzw80K8JefEnCRpuV7bNX0fepZPkut12G2hw7bqgVwMtxn9chbr2W63m4aE2Zu+dY/6Oz3L/Qq2uC5Ia/whI2p0p+nPTeTzaztyXmzz7NszckI83\
                     HS7CPbViEECXrQninA7pq85nCWHWdmWkvN+6y9TXcV5UFOo3wax1HSXcUiW7iXPkZlkbSo2TFoOMgtRA/PA4CXkqWZFS9xsUbYdZRJsPGyaKHJlWyu2orgI2ECJi0LMGYiNwnLfeGpZBftbpCJn0rJ+\
                     pZvNUFSqpKajOPCKDp5lausLMWTfzbYfEatO/gvcIwZkepke9TPvr+egqQkVaVGtjqZyY8fNydYCFR528korxl1T00ZEOnn+4wcLiVYLdx5RxW5opjW17zufcblEmVwYIVhYoW8mXmDOfT6/7ePrkMo\
                     v77KKXBI24kp086GsgmJVuWk9JtX43WGxRNcMcGfERrC3hIUC5A4jFYK+BbfvtSqC9xjTmKeNdaxWhzjrjWHWJEgBoOiBJOkGccW2ZuLLi+BNq80HUiuIcK4DZGCahXv4FY4eX45ww+AQAAAAASUVORK\
                     5CYII=";

    // Do we ever care about loading image assets from disk? Here's how:
    // switch (TBUtils.browser) {
    //     case TBUtils.browsers.CHROME:
    //     case TBUtils.browsers.OPERA: // yep, same name and everything
    //         TBui.iconNuke = chrome.extension.getURL('images/nuke.png')
    //         break;
    //     case TBUtils.browsers.FIREFOX:
    //         TBui.iconNuke = self.data.nukeIcon;
    //         break;
    //     case TBUtils.browsers.SAFARI:
    //         TBui.iconNuke = safari.extension.baseURI + 'images/nuke.png')
    //         break;
    //     case TBUtils.browsers.UNKOWN_BROWSER:
    //     default:
    //         TBui.iconNuke = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAYAAABWdVznAAAB8UlEQVR42lXP20uTYQCA8ed9v81tzLkmeMCPnDHNC+0geMCV1Fx2I5lgybxK0xCMNdQIHDMiLBJv6rKMA\
    //                          kMUsYN4FxKa2bLMMLCN1BlEKRLURQ0q2ldzu+n3Dzw80K8JefEnCRpuV7bNX0fepZPkut12G2hw7bqgVwMtxn9chbr2W63m4aE2Zu+dY/6Oz3L/Qq2uC5Ia/whI2p0p+nPTeTzaztyXmzz7NszckI83\
    //                          HS7CPbViEECXrQninA7pq85nCWHWdmWkvN+6y9TXcV5UFOo3wax1HSXcUiW7iXPkZlkbSo2TFoOMgtRA/PA4CXkqWZFS9xsUbYdZRJsPGyaKHJlWyu2orgI2ECJi0LMGYiNwnLfeGpZBftbpCJn0rJ+\
    //                          pZvNUFSqpKajOPCKDp5lausLMWTfzbYfEatO/gvcIwZkepke9TPvr+egqQkVaVGtjqZyY8fNydYCFR528korxl1T00ZEOnn+4wcLiVYLdx5RxW5opjW17zufcblEmVwYIVhYoW8mXmDOfT6/7ePrkMo\
    //                          v77KKXBI24kp086GsgmJVuWk9JtX43WGxRNcMcGfERrC3hIUC5A4jFYK+BbfvtSqC9xjTmKeNdaxWhzjrjWHWJEgBoOiBJOkGccW2ZuLLi+BNq80HUiuIcK4DZGCahXv4FY4eX45ww+AQAAAAASUVORK\
    //                          5CYII=";
    //         break;
    // }

    TBui.standardColors = {
        "red": "#FF0000",
        "green": "#00F51E",
        "blue": "#0082FF",
        "magenta": "#DC00C8",
        "cyan": "#00F0F0",
        "yellow": "#EAC117",
        "black": "#000000"
    };

    TBui.FEEDBACK_NEUTRAL = 'neutral';
    TBui.FEEDBACK_POSITIVE = 'positive';
    TBui.FEEDBACK_NEGATIVE = 'negative';

    TBui.DISPLAY_CENTER = 'center';
    TBui.DISPLAY_BOTTOM = 'bottom';
    TBui.DISPLAY_CURSOR = 'cursor';


    // Popup HTML generator
    TBui.popup = function popup(title, tabs, meta, css_class) {
        meta = (typeof meta !== "undefined") ? meta : null;
        css_class = (typeof css_class !== "undefined") ? css_class : '';

        // tabs = [{id:"", title:"", tooltip:"", help_text:"", help_url:"", content:"", footer:""}];
        var $popup = $('\
<div class="tb-popup' + (css_class ? ' ' + css_class : '') + '">' + (meta ? '<div class="meta" style="display:none">' + meta + '</div>' : '') + '\
<div class="tb-popup-header">\
    <div class="tb-popup-title">' + title + '</div>\
    <div class="buttons"><a class="close" href="javascript:;">✕</a></div>\
</div>\
<div>');
        if (tabs.length == 1) {
            $popup.append($('<div class="tb-popup-content">' + tabs[0].content + '</div>'));
            $popup.append($('<div class="tb-popup-footer">' + tabs[0].footer + '</div>'));
        } else if (tabs.length > 1) {
            $popup.append($('<div class="tb-popup-tabs"></div>'));

            for (var i = 0; i < tabs.length; i++) {
                var tab = tabs[i];
                if (tab.id === "undefined" || !tab.id) {
                    tab.id = tab.title.trim().toLowerCase().replace(/\s/g, '_');
                }

                var $button = $('<a' + (tab.tooltip ? ' title="' + tab.tooltip + '"' : '') + ' class="' + tab.id + '">' + tab.title + '</a>');
                $button.click({tab: tab}, function (e) {
                    var tab = e.data.tab;

                    // hide others
                    $popup.find('.tb-popup-tabs a').removeClass('active');
                    $popup.find('.tb-popup-tab').hide();

                    // show current
                    $popup.find('.tb-popup-tab.' + tab.id).show();
                    $(this).addClass('active');

                    e.preventDefault();
                });

                // default first tab is active tab
                if (i == 0) {
                    $button.addClass('active');
                }

                $button.appendTo($popup.find('.tb-popup-tabs'));


                var $tab = $('<div class="tb-popup-tab ' + tab.id + '"></div>');
                $tab.append($('<div class="tb-popup-content">' + tab.content + '</div>'));
                $tab.append($('<div class="tb-popup-footer">' + tab.footer + '</div>'));

                // default first tab is visible; hide others
                if (i == 0) {
                    $tab.show();
                } else {
                    $tab.hide();
                }

                $tab.appendTo($popup);
            }
        }

        return $popup;
    };


    // Window Overlay HTML generator
    TBui.overlay = function overlay(title, tabs, meta, css_class) {
        meta = (typeof meta !== "undefined") ? meta : null;
        css_class = (typeof css_class !== "undefined") ? css_class : '';

        // tabs = [{id:"", title:"", tooltip:"", help_text:"", help_url:"", content:"", footer:""}];
        var $overlay = $('\
<div class="tb-page-overlay ' + (css_class ? ' ' + css_class : '') + '">\
<div class="tb-window-wrapper ' + (css_class ? ' ' + css_class : '') + '">' + (meta ? '<div class="meta" style="display:none">' + meta + '</div>' : '') + '\
    <div class="tb-window-header">\
        <div class="tb-window-title">' + title + '</div>\
        <div class="buttons"><a class="close" href="javascript:;">✕</a></div>\
    </div>\
</div>');

        if (tabs.length == 1) {
            $overlay.find('.tb-window-wrapper').append($('<div class="tb-window-tab"><div class="tb-window-content">' + tabs[0].content + '</div></div>'));
            $overlay.find('.tb-window-wrapper .tb-window-tab').append($('<div class="tb-window-footer">' + tabs[0].footer + '</div>'));
        } else if (tabs.length > 1) {
            $overlay.find('.tb-window-wrapper').append($('<div class="tb-window-tabs"></div>'));

            for (var i = 0; i < tabs.length; i++) {
                var tab = tabs[i];
                if (tab.id === "undefined" || !tab.id) {
                    tab.id = tab.title.trim().toLowerCase();
                    tab.id = tab.id.replace(/\s/g, '_')
                }

                var $button = $('<a' + (tab.tooltip ? ' title="' + tab.tooltip + '"' : '') + ' class="' + tab.id + '">' + tab.title + '</a>');
                $button.click({tab: tab}, function (e) {
                    var tab = e.data.tab;

                    // hide others
                    $overlay.find('.tb-window-tabs a').removeClass('active');
                    $overlay.find('.tb-window-tab').hide();

                    // show current
                    $overlay.find('.tb-window-tab.' + tab.id).show();
                    $(this).addClass('active');

                    e.preventDefault();
                });

                // default first tab is active tab
                if (i == 0) {
                    $button.addClass('active');
                }

                $button.appendTo($overlay.find('.tb-window-tabs'));


                var $tab = $('<div class="tb-window-tab ' + tab.id + '"></div>');
                $tab.append($('<div class="tb-window-content">' + tab.content + '</div>'));
                $tab.append($('<div class="tb-window-footer">' + tab.footer + '</div>'));

                // default first tab is visible; hide others
                if (i == 0) {
                    $tab.show();
                } else {
                    $tab.hide();
                }

                $tab.appendTo($overlay.find('.tb-window-wrapper'));
            }
        }

        return $overlay;
    };

    TBui.selectSingular = function selectSingular(choices, selected) {
        var $selector = $('\
        <div class="select-single">\
            <select class="selector"></select>\
        </div>'),
            $selector_list = $selector.find('.selector');

        //Add values to select
        $.each(choices, function () {
            var value = this.toLowerCase().replace(/\s/g, '_');
            $selector_list.append($('<option>').attr('value', value).text(this));
        });

        //Set selected value
        $selector_list.val(selected).prop('selected', true);

        return $selector;
    };

    TBui.selectMultiple = function selectMultiple(available, selected) {
        available = (available instanceof Array) ? available : [];
        selected = (selected instanceof Array) ? selected : [];

        var $select_multiple = $('\
        <div class="select-multiple">\
            <select class="selected-list left"></select><button class="remove-item right">remove</button>\
            <select class="available-list left"></select><button class="add-item right">add</button>\
            <div style="clear:both"></div>\
        </div>'),
            $selected_list = $select_multiple.find('.selected-list'),
            $available_list = $select_multiple.find('.available-list');

        $select_multiple.find('.remove-item').click(function () {
            var remove_item = $selected_list.find('option:selected').val();

            $selected_list.find('option[value="' + remove_item + '"]').remove();
        });

        $select_multiple.find('.add-item').click(function () {
            var $add_item = $available_list.find('option:selected');

            // Don't add the sub twice.
            var exists = false;
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

        $.each(available, function () {
            $available_list.append($('<option>').attr('value', this).text(this));
        });

        $.each(selected, function () {
            $selected_list.append($('<option>').attr('value', this).text(this));
        });

        return $select_multiple;
    };

    TBui.textFeedback = function (feedbackText, feedbackKind, displayDuration, displayLocation) {
        if (!displayLocation) displayLocation = TBui.DISPLAY_CENTER;

        // Without text we can't give feedback, the feedbackKind is required to avoid problems in the future.
        if (feedbackKind !== undefined && feedbackKind !== undefined) {
            var $body = $('body');

            // If there is still a previous feedback element on the page we remove it.
            $body.find('#tb-feedback-window').remove();

            // build up the html, not that the class used is directly passed from the function allowing for easy addition of other kinds.
            var feedbackElement = '<div id="tb-feedback-window" class="' + feedbackKind + '"><span class="tb-feedback-text">' + feedbackText + '</span></div>';

            // Add the element to the page.
            $body.append(feedbackElement);

            //center it nicely, yes this needs to be done like this if you want to make sure it is in the middle of the page where the user is currently looking.
            var $feedbackWindow = $body.find('#tb-feedback-window');

            switch (displayLocation) {
                case TBui.DISPLAY_CENTER:
                    var feedbackLeftMargin = ($feedbackWindow.outerWidth() / 2),
                        feedbackTopMargin = ($feedbackWindow.outerHeight() / 2);

                    $feedbackWindow.css({
                        'margin-left': '-' + feedbackLeftMargin + 'px',
                        'margin-top': '-' + feedbackTopMargin + 'px'
                    });
                    break;
                case TBui.DISPLAY_BOTTOM:
                    $feedbackWindow.css({
                        'left': '5px',
                        'bottom': '40px',
                        'top': 'auto',
                        'position': 'fixed'
                    });
                    break;
                case TBui.DISPLAY_CURSOR:
                    $(document).mousemove(function (e) {
                        posX = e.pageX;
                        posY = e.pageY;

                        $feedbackWindow.css({
                            left: posX - $feedbackWindow.width() + 155,
                            top: posY - $feedbackWindow.height() - 15,
                            'position': 'fixed'
                        });
                    });
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

                $('head').append('<style id="tb-long-load-style">\
                .mod-toolbox #tb-bottombar, .mod-toolbox #tb-bottombar-hidden {\
                    bottom: 10px !important\
                }\
                </style>');
                $('.footer-parent').append('<div id="tb-loading"></div>');
                TBui.longLoadArray.push('load');

                // if requested and the element is already present
            } else if (createOrDestroy && TBui.longLoadArray.length > 0) {
                TBui.longLoadArray.push('load');

                // if done and the only instance
            } else if (!createOrDestroy && TBui.longLoadArray.length == 1) {
                $('head').find('#tb-long-load-style').remove();
                $('#tb-loading').remove();
                TBui.longLoadArray.pop();

                // if done but other process still running
            } else if (!createOrDestroy && TBui.longLoadArray.length > 1) {
                TBui.longLoadArray.pop();

            }

            // Support for text feedback removing the need to fire two function calls from a module.
            if (feedbackText !== undefined && feedbackKind !== undefined) {
                TBui.textFeedback(feedbackText, feedbackKind, feedbackDuration);
            }
        }
    };

    // Our awesome long load spinner that ended up not being a spinner at all. It will attend the user to ongoing background operations, this variant will NOT warn when you leave the page.
    TBui.longLoadNonPersistent = function (createOrDestroy, feedbackText, feedbackKind, feedbackDuration, displayLocation) {
        if (createOrDestroy !== undefined) {

            // if requested and the element is not present yet
            if (createOrDestroy && TBui.longLoadArrayNonPersistent.length == 0) {

                $('head').append('<style id="tb-long-load-style-non-persistent">\
                .mod-toolbox #tb-bottombar, .mod-toolbox #tb-bottombar-hidden {\
                    bottom: 10px !important\
                }\
                </style>');

                $('.footer-parent').append('<div id="tb-loading-non-persistent"></div>');
                TBui.longLoadArrayNonPersistent.push('load');

                // if requested and the element is already present
            } else if (createOrDestroy && TBui.longLoadArrayNonPersistent.length > 0) {
                TBui.longLoadArrayNonPersistent.push('load');

                // if done and the only instance
            } else if (!createOrDestroy && TBui.longLoadArrayNonPersistent.length == 1) {
                $('head').find('#tb-long-load-style-non-persistent').remove();
                $('#tb-loading-non-persistent').remove();
                TBui.longLoadArrayNonPersistent.pop();

                // if done but other process still running
            } else if (!createOrDestroy && TBui.longLoadArrayNonPersistent.length > 1) {
                TBui.longLoadArrayNonPersistent.pop();

            }

            // Support for text feedback removing the need to fire two function calls from a module.
            if (feedbackText !== undefined && feedbackKind !== undefined) {
                TBui.textFeedback(feedbackText, feedbackKind, feedbackDuration);
            }
        }
    };

    TBui.beforeunload = function () {
        if (longLoadArray.length > 0) {
            return 'Toolbox is still busy!';
        }
    };

}(TBui = window.TBui || {}));
