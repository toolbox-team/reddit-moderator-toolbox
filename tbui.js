(function (TBui) {
    TBui.longLoadArray = [];

    // Icons
    TBui.iconWrench = 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAHaSURBVDjLlZO7a1NRHMfzfzhIKQ5OHR1ddRRBLA6lg4iT\
                d5PSas37YR56Y2JiHgg21uoFxSatCVFjbl5iNBBiMmUJgWwZhCB4pR9/V4QKfSQdDufF5/v7nu85xwJYprV0Oq0kk8luIpEw4vG48f/eVDiVSikCTobDIePxmGg0yokEBO4OBgNGoxH5fJ5wOHwygVgsZpjVW60WqqqWz\
                bVgMIjf78fn8xlTBcTy736/T7VaJRQKfQoEArqmafR6Pdxu9/ECkUjkglje63Q6NBoNisUihUKBcrlMpVLB6XR2D4df3VQnmRstsWzU63WazSZmX6vV0HWdUqmEw+GY2Gw25SC8dV1l1wrZNX5s3qLdbpPL5fB6vXumZal\
                q2O32rtVqVQ6GuGnCd+HbFnx9AZrC+MkSHo/np8vlmj/M7f4ks6yysyawgB8fwPv70HgKG8v8cp/7fFRO/+AllewqNJ/DhyBsi9A7J1QTkF4E69mXRws8u6ayvSJwRqoG4K2Md+ygxyF5FdbPaMfdlIXUZfiyAUWx/OY25O\
                4JHBP4CtyZ16a9EwuRi1CXs+5K1ew6lB9DXERX517P8tEsPDzfNIP6C5YeQewSrJyeCd4P0bnwXYISy3MCn5oZNtsf3pH46e7XBJcAAAAASUVORK5CYII=';

    TBui.iconClose = 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAJdSURBVDjLpZP7S1NhGMf9W7YfogSJboSEUVCY8zJ31trcps6z\
                TI9bLGJpjp1hmkGNxVz4Q6ildtXKXzJNbJRaRmrXoeWx8tJOTWptnrNryre5YCYuI3rh+8vL+/m8PA/PkwIg5X+y5mJWrxfOUBXm91QZM6UluUmthntHqplxUml2lciF6wrmdHriI0Wx3xw2hAediLwZRWRkCPzdDswaSvGq\
                kGCfq8VEUsEyPF1O8Qu3O7A09RbRvjuIttsRbT6HHzebsDjcB4/JgFFlNv9MnkmsEszodIIY7Oaut2OJcSF68Qx8dgv8tmqEL1gQaaARtp5A+N4NzB0lMXxon/uxbI8gIYjB9HytGYuusfiPIQcN71kjgnW6VeFOkgh3XcHL\
                vAwMSDPohOADdYQJdF1FtLMZPmslvhZJk2ahkgRvq4HHUoWHRDqTEDDl2mDkfheiDgt8pw340/EocuClCuFvboQzb0cwIZgki4KhzlaE6w0InipbVzBfqoK/qRH94i0rgokSFeO11iBkp8EdV8cfJo0yD75aE2ZNRvSJ0lZK\
                cBXLaUYmQrCzDT6tDN5SyRqYlWeDLZAg0H4JQ+Jt6M3atNLE10VSwQsN4Z6r0CBwqzXesHmV+BeoyAUri8EyMfi2FowXS5dhd7doo2DVII0V5BAjigP89GEVAtda8b2ehodU4rNaAW+dGfzlFkyo89GTlcrHYCLpKD+V7yee\
                HNzLjkp24Uu1Ed6G8/F8qjqGRzlbl2H2dzjpMg1KdwsHxOlmJ7GTeZC/nesXbeZ6c9OYnuxUc3fmBuFft/Ff8xMd0s65SXIb/gAAAABJRU5ErkJggg==';

    TBui.iconNoteClose = 'iVBORw0KGgoAAAANSUhEUgAAAA4AAAAOCAYAAAAfSC3RAAAA1klEQVQoz6WSOw6CQBCG90gWXsjKxph4HZAEsgUSHlsAAa6ilzDGgopxP5Ix2K7FJH/+x+wMjBERoxXH8d5aey2K4l6W5ZMCw6FtvV+Qpumlrut313UyDIOM47gWGA4N\
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

    TBui.logo64 = 'iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAC4lJREFUeNrUWwlQVMkZ/rlBQAVBQZQVQUvEM4qrIIvEBE2MKQhsRMVUrKzWVmVXpTRqBA9S4rquWmIKYu3itV4pV6tUdDV\
                UKRoXz4jiga6gRARxFQnIJeef/+95D2eGucA3OPxVHzO8192v+3/d//F1DyAimIIuEleCo4llIwiXCaWEzQQnXYWMjsvCFHCQ+0w4RficMIZgpaPcRi5nbW2NdnZ2KNV5ThjSnRXgQvifNJgW6ZPRTPiBsJrgQ/iEr0+aNAkLCwuxpaUFU1NT5bK53VkBsdIglkj/z5\
                Smdr6aMgS8vb2xoqIC1WXDhg3y/ZndVQF7pAH467jXgxBK2MRl5s6di9py69YtWQGruqMCbAgNhCITyv4wbNgwbG1t1VDAzp07ZQXEdUcFhEqd/8qEsn/msnPmzGlTQlZWFvbq1YvrFxLsu6MCtkgKmGRi+f1c3sPDA3k2WFlZycYytLsawf8S6gnWHajzMeGk5CFSCQ\
                O6axwwVHr7O83RuLFxWcP7l4/VvECXi20XPotd2QjCYMJAgrdk/X8n3Y8nfET4iVAs+f8Sc3fKytTpTYamM+3zgGMIUwg/I/TU0EiPHuDg4AAUzUFdXR00NzdrzF7CfSne59D4NOFNZ5aAuRQwnNCPUKD1ptgN/YHwGWE0X6DIDUJCQmDcuHEQFBQk/ndzc4PevXsLBfD\
                Aa2trobKyEp4/fw6PHz8GCmzg6tWrcPPmTXkQrwn7CNsJD9W7Jinag/CAUNYRBXTGCEYRftQKT48TfKW3/Yqv0eBw8eLFmJOTI+L1zsrTp08xPT0dg4OD1Z/3rZT9/YrwWKsvJ9Q9gtJeIJHb9PT0xMTERNy7dy+uW7cO6W3KfrilX79+osONjY2otFy/fh2nTZsmD7Sao\
                8fJkyfj9u3bMSMjA2NjY+V7VYRApRUwmdsbM2YM1tTUaHRK1v7KlSvbhajmkIsXL6KPj4945vz58zXuZWZmyv25RPBTUgG7uGFak+3ib1dXV7xy5Qp2pZDdwFmzZonn86xQl1WrVslKSFJSAfdCQ0PbHpKdnY1yOFpcXIzvSxISEkQ/5s2b13YtNzdXVsBpsymAB84Pyc/P\
                19+71ibEHcsRZ3sjxnkhpv+FrplgGx7fQ1wcjvh7d8RPghD/fdRg8ZiYGNGXffv2aSvgeyUVwKEqvn79uo2B2bNnj+GB/C0W0Zeq/1wCf18XbbhO+SPEX/RCHEFlIwkfEgIJV/Qrgfvk7OwsliLLxo0bzbIERMo6YcIEdHFxwVGjRhkeSP5/VJ2PJswmxEnfJxDuXtVfL/Vz\
                xCAqE0+YJX1ynYVhBh/Hnkc2igMHDuTvOaYYwY7kAtxg4rVr14C8ACxcuNBw6WdFKmbPUWL4WtW+lxrgPcpfqLjhFjVGkOPHakr1sUFvNbIB0KdPH9i9ezdQ7FBJl/5kCsHS0WRoA+Ef/CU8PNxwydHjAFwo1H8hZRyMlwRnCtzGjNNfL3CsFEpJveN6zwgf0AS0ctDPqLq4i\
                GhTCpc/lKJCUFoBLA09e/YEX19fw6U8/AAWf6kKTH+UwAPha30D9NebvQLg1xNV/G6RxPMO7kP1Nhjt2KBBg2QFlJozG3ShYEc7cdEtUUsp76N04Ny3qlcaQSnC+F8ar7cpGyBsB6VCFwG8SFlRCaRQL6PVOKmSFpozoVYRwkBHLrCGq12+fBktTaZMmSLzgtbmJEQu8J9z586\
                BJUlpaSlcunRJNtatilFGeiix/MGDB5sl4emsJCUlyb4/uis4QbE9xTG3KVJSUiLQEeEU+tGjR/jmzRujZe/du4e2trbcyStdSYryUsDjx48b7SAHT1yW02dThLPN+Ph4USctLc1g2aamJhw7dqz89iO6UgEfMH/HO7SnT5822MkDBw6gg4MDykTJihUr8MKFC/js2TMx2KqqKi\
                woKMDDhw/jzJkz29JrHlhRUZHednl2hIWFyeVXvA9afKREPuDWrVsNKqGurg5Xr16Njo6OqL3ZqY0RI0YYVSovDz8/P7lOSmdtnBKkKEdE5znu5ugwIyMDAgICDLbF1pq9yN27d4ESGaBZBP3794fx48dDZGSkHNDoHVBKSgqsXbsWOB7h0EriCTtFiiq1McL09t/lN8hERV5enq\
                JWnpcKzzKm3NQY41Hv6uWU3hniJXFWVgS9Ufziiy/wzp07nRp0eXk5Hjp0COPi4kQGKrXLGcUCpdy8ufYF3CWmeHIbV25vL6Y4U+NDhgwBT09PQY3zdQ5hmRZ/9eoVPHnyBG7fvg2cdZKRVG+zkTCXcETJfQFz7Q3+lXl8NnhMmjBzTIM2avzUwd4iOjoaT548iTNmzJCvnyEEKL\
                k3qPQMYFtwmVxecENDA3DWWFZWJnaAWMhnQ2FhIRQXF8OLFy+A3B9QNCmMIKeznM/zpgkbUQ8Pj7ZGExISYNu2baI9Npok0whZljgDdnOTu3btEuuWfb8SNDnHDdwuu0Z2kdJhqkFKzAAlFcD7fyKCY+GOssVWQjZv3iwUQPYByT6o7w5Z1Pb4H/lPcnKy+If3+HjKKiGurq7ik2J\
                +GDlyJERFRQnqRIpBLGJ7nHv42+nTpwNlieICEyZs4bWlsbISfvruO8D6erDSut9CnsDR3x+8VANsEzs7O/HJO8gsFGfAsWPHuO+/IaRbggKCCG4RERFGCxYkJUFRWpqKLyUF2NDg2MBSXA8trDSmE48cAe+YGL1tTJ06VRhWUsiod+24UktATEX57QteytER6uvrNQpVkX9/umMH\
                OFEMELhmDbiHhYGDjw/YkvX3+/RT8FuwAJqo3NNvvtEkIRtUbDBvpbNwDDFgwAA5IbMIBYieOTm9Pa+s5rLeTjdydc6BgeBPgx9KtsKO4v/m6mpofPkS3EJCYOTXX4N7cDC4DB+uUa+6ulrDFqg9y95SbABnhMK3t5HC5McfPnwobIGtreoxzjRDQnNzwVpa08CxhSqhgeYq0QRMy\
                skBK2vN98IGVYSX7u5t8QRHjfJzLWEGCA7+wYO3VLyPj4/4rKio0HygPHg2ejU1YGVj0+6+9rWSEtUBlL59+6rsSEGBfO2RpSiAj6zkZ2Zmtl2Q7YHceW1ppZnRQlPbytb4JOQjMzakFF77LGfOnJFvXbQUBbAcvn//Phw9elT8M3ToUNCeFRoBChm2VrYRWm9bVyDDyVEg2Q5raWk\
                w5yBtm5yyJAWkcaq6dOlS8Q/HBCx5eXk6C9eQfWhiMoRmgDVZ97riYr10N+cLYeQxWCgsBlY0qM4Vt7xzrxXOBeLlHWQyiCIUnjhxYvvt7AcP8KyvL35PZbOcnPBfdnZIiwcLNm1qV/bgwYMi9D116pTY/5fC4LOWzAcsJ3zp5+cnLDXTVuwd1F0ku77y7GxooNyfZwCSVbdydga38H\
                Bw0aLTli1bBlu2bBEhMIfC1N4NjoVM9QDviw/gswRX5dyejFanE6HRo0fLb71C4hkUneHmPizNbwoXLVrUqcGr/Qpkn7mWeFecFs/y8vIyaYdHW5YvXy4rYHx3VIDs3xJlkqQjUltbK34cxY4EVIerHbuLApj/YlLgifT2+MBCi9EzRXpIEFD9kII/ORfO7Ohs6GoF9Afp7C5ZbXFylGn\
                xkJAQMZhNOtycvvPB/INIptTIC2BKSoogSO3t7WWlfGapCrigb5vM399fdF79pKk+iYyMFGVPnDjRbjssICBA70bo+1YAh35IPlvnoCgzFB2nNNngVvmSJUtEueTkZJ33y8rKkLJCLvNPJRSg5C9GPhLMiK8v5OfnixBWjt05GCJ/DklJSbB+/XoIppw/PT1dUOB85I7TZWcKhFJTU2H//v\
                2CFo+NjYUbN26IYMpGyhf4k4kQsidw/vz5KRIP0WApoXCKsc0O3ijh7XRj5XjtSwcedEL6mdxzUzxDV84Ajs/5FyLMVOg8o8O8nykiU2AGBtWbPm5CJ35Coy3/F2AAwAD1p/Bd/dYAAAAASUVORK5CYII=';

    TBui.standardColors = {
        "red": "#FF0000",
        "green": "#00F51E",
        "blue": "#0082FF",
        "magenta": "DC00C8",
        "cyan": "#00F0F0",
        "yellow": "#EAC117",
        "black": "#000000"
    };

    TBui.FEEDBACK_NEUTRAL = 'neutral';
    TBui.FEEDBACK_POSITIVE = 'positive';
    TBui.FEEDBACK_NEGATIVE = 'negative';


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
            if (!($selected_list.find('option[value="' + $add_item.val() + '"]') > 0)) {
                $selected_list.append($add_item.clone());
            }
        });

        $.each(available, function () {
            $available_list.append($('<option>').attr('value', this).text('/r/' + this));
        });

        $.each(selected, function () {
            $selected_list.append($('<option>').attr('value', this).text('/r/' + this));
        });

        return $select_multiple;
    };

    TBui.textFeedback = function(feedbackText, feedbackKind) {
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
            var $feedbackWindow = $body.find('#tb-feedback-window'),
                feedbackLeftMargin = ($feedbackWindow.outerWidth() / 2),
                feedbackTopMargin = ($feedbackWindow.outerHeight() /2);

            $feedbackWindow.css({
                'margin-left': '-' + feedbackLeftMargin + 'px',
                'margin-top': '-' + feedbackTopMargin + 'px'
            });

            // And fade out nicely after 3 seconds.
            $body.find('#tb-feedback-window').delay(3000).fadeOut();
        }
    };

    // Our awesome long load spinner that ended up not being a spinner at all. It will attend the user to ongoing background operations with a warning when leaving the page.
    TBui.longLoadSpinner = function (createOrDestroy, feedbackText, feedbackKind) {
        if (createOrDestroy !== undefined) {

            // if requested and the element is not present yet
            if (createOrDestroy && TBui.longLoadArray.length == 0) {

                $('#tb-bottombar, #tb-bottombar-hidden').css('bottom', '10px');
                $('.footer-parent').append('<div id="tb-loading"></div>');
                TBui.longLoadArray.push('load');

                // if requested and the element is already present
            } else if (createOrDestroy && TBui.longLoadArray.length > 0) {
                TBui.longLoadArray.push('load');

                // if done and the only instance
            } else if (!createOrDestroy && TBui.longLoadArray.length == 1) {
                $('#tb-bottombar, #tb-bottombar-hidden').css('bottom', '0px');
                $('#tb-loading').remove();
                TBui.longLoadArray.pop();

                // if done but other process still running
            } else if (!createOrDestroy && TBui.longLoadArray.length > 1) {
                TBui.longLoadArray.pop();

            }

            // Support for text feedback removing the need to fire two function calls from a module.
            if (feedbackText !== undefined && feedbackKind !== undefined) {
                TBui.textFeedback(feedbackText, feedbackKind);
            }
        }
    };

    TBui.beforeunload = function () {
        if (longLoadArray.length > 0) {
            return 'Toolbox is still busy!';
        }
    };

}(TBui = window.TBui || {}));