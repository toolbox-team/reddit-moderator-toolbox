/* ***** BEGIN LICENSE BLOCK *****
 * Distributed under the BSD license:
 * 
 * Copyright 2011 Irakli Gozalishvili. All rights reserved.
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to
 * deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
 * sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 * IN THE SOFTWARE.
 * ***** END LICENSE BLOCK ***** */

ace.define('ace/theme/ambiance', ['require', 'exports', 'module' , 'ace/lib/dom'], function(require, exports, module) {

exports.isDark = true;
exports.cssClass = "ace-ambiance";
exports.cssText = ".ace-ambiance .ace_gutter {\
background-color: #3d3d3d;\
background-image: -moz-linear-gradient(left, #3D3D3D, #333);\
background-image: -ms-linear-gradient(left, #3D3D3D, #333);\
background-image: -webkit-gradient(linear, 0 0, 0 100%, from(#3D3D3D), to(#333));\
background-image: -webkit-linear-gradient(left, #3D3D3D, #333);\
background-image: -o-linear-gradient(left, #3D3D3D, #333);\
background-image: linear-gradient(left, #3D3D3D, #333);\
background-repeat: repeat-x;\
border-right: 1px solid #4d4d4d;\
text-shadow: 0px 1px 1px #4d4d4d;\
color: #222;\
}\
.ace-ambiance .ace_gutter-layer {\
background: repeat left top;\
}\
.ace-ambiance .ace_gutter-active-line {\
background-color: #3F3F3F;\
}\
.ace-ambiance .ace_fold-widget {\
text-align: center;\
}\
.ace-ambiance .ace_fold-widget:hover {\
color: #777;\
}\
.ace-ambiance .ace_fold-widget.ace_start,\
.ace-ambiance .ace_fold-widget.ace_end,\
.ace-ambiance .ace_fold-widget.ace_closed{\
background: none;\
border: none;\
box-shadow: none;\
}\
.ace-ambiance .ace_fold-widget.ace_start:after {\
content: '\u25be'\
}\
.ace-ambiance .ace_fold-widget.ace_end:after {\
content: '\u25b4'\
}\
.ace-ambiance .ace_fold-widget.ace_closed:after {\
content: '\u2023'\
}\
.ace-ambiance .ace_print-margin {\
border-left: 1px dotted #2D2D2D;\
right: 0;\
background: #262626;\
}\
.ace-ambiance .ace_scroller {\
-webkit-box-shadow: inset 0 0 10px black;\
-moz-box-shadow: inset 0 0 10px black;\
-o-box-shadow: inset 0 0 10px black;\
box-shadow: inset 0 0 10px black;\
}\
.ace-ambiance {\
color: #E6E1DC;\
background-color: #202020;\
}\
.ace-ambiance .ace_cursor {\
border-left: 1px solid #7991E8;\
}\
.ace-ambiance .ace_overwrite-cursors .ace_cursor {\
border: 1px solid #FFE300;\
background: #766B13;\
}\
.ace-ambiance.normal-mode .ace_cursor-layer {\
z-index: 0;\
}\
.ace-ambiance .ace_marker-layer .ace_selection {\
background: rgba(221, 240, 255, 0.20);\
}\
.ace-ambiance .ace_marker-layer .ace_selected-word {\
border-radius: 4px;\
border: 8px solid #3f475d;\
box-shadow: 0 0 4px black;\
}\
.ace-ambiance .ace_marker-layer .ace_step {\
background: rgb(198, 219, 174);\
}\
.ace-ambiance .ace_marker-layer .ace_bracket {\
margin: -1px 0 0 -1px;\
border: 1px solid rgba(255, 255, 255, 0.25);\
}\
.ace-ambiance .ace_marker-layer .ace_active-line {\
background: rgba(255, 255, 255, 0.031);\
}\
.ace-ambiance .ace_invisible {\
color: #333;\
}\
.ace-ambiance .ace_paren {\
color: #24C2C7;\
}\
.ace-ambiance .ace_keyword {\
color: #cda869;\
}\
.ace-ambiance .ace_keyword.ace_operator {\
color: #fa8d6a;\
}\
.ace-ambiance .ace_punctuation.ace_operator {\
color: #fa8d6a;\
}\
.ace-ambiance .ace_identifier {\
}\
.ace-ambiance .ace-statement {\
color: #cda869;\
}\
.ace-ambiance .ace_constant {\
color: #CF7EA9;\
}\
.ace-ambiance .ace_constant.ace_language {\
color: #CF7EA9;\
}\
.ace-ambiance .ace_constant.ace_library {\
}\
.ace-ambiance .ace_constant.ace_numeric {\
color: #78CF8A;\
}\
.ace-ambiance .ace_invalid {\
text-decoration: underline;\
}\
.ace-ambiance .ace_invalid.ace_illegal {\
color:#F8F8F8;\
background-color: rgba(86, 45, 86, 0.75);\
}\
.ace-ambiance .ace_invalid,\
.ace-ambiance .ace_deprecated {\
text-decoration: underline;\
font-style: italic;\
color: #D2A8A1;\
}\
.ace-ambiance .ace_support {\
color: #9B859D;\
}\
.ace-ambiance .ace_support.ace_function {\
color: #DAD085;\
}\
.ace-ambiance .ace_function.ace_buildin {\
color: #9b859d;\
}\
.ace-ambiance .ace_string {\
color: #8f9d6a;\
}\
.ace-ambiance .ace_string.ace_regexp {\
color: #DAD085;\
}\
.ace-ambiance .ace_comment {\
font-style: italic;\
color: #555;\
}\
.ace-ambiance .ace_comment.ace_doc {\
}\
.ace-ambiance .ace_comment.ace_doc.ace_tag {\
color: #666;\
font-style: normal;\
}\
.ace-ambiance .ace_definition,\
.ace-ambiance .ace_type {\
color: #aac6e3;\
}\
.ace-ambiance .ace_variable {\
color: #9999cc;\
}\
.ace-ambiance .ace_variable.ace_language {\
color: #9b859d;\
}\
.ace-ambiance .ace_xml-pe {\
color: #494949;\
}\
.ace-ambiance .ace_gutter-layer,\
.ace-ambiance .ace_text-layer {\
background-image: url(\"data:image/png;base64,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\");\
}\
.ace-ambiance .ace_indent-guide {\
background: url(\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAACCAYAAACZgbYnAAAAEklEQVQImWNQUFD4z6Crq/sfAAuYAuYl+7lfAAAAAElFTkSuQmCC\") right repeat-y;\
}";

var dom = require("../lib/dom");
dom.importCssString(exports.cssText, exports.cssClass);

});
/* ***** BEGIN LICENSE BLOCK *****
 * Distributed under the BSD license:
 * 
 * Copyright 2011 Irakli Gozalishvili. All rights reserved.
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to
 * deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
 * sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 * IN THE SOFTWARE.
 * ***** END LICENSE BLOCK ***** */

ace.define('ace/theme/chaos', ['require', 'exports', 'module' , 'ace/lib/dom'], function(require, exports, module) {

exports.isDark = true;
exports.cssClass = "ace-chaos";
exports.cssText = ".ace-chaos .ace_gutter {\
background: #141414;\
color: #595959;\
border-right: 1px solid #282828;\
}\
.ace-chaos .ace_gutter-cell.ace_warning {\
background-image: none;\
background: #FC0;\
border-left: none;\
padding-left: 0;\
color: #000;\
}\
.ace-chaos .ace_gutter-cell.ace_error {\
background-position: -6px center;\
background-image: none;\
background: #F10;\
border-left: none;\
padding-left: 0;\
color: #000;\
}\
.ace-chaos .ace_print-margin {\
border-left: 1px solid #555;\
right: 0;\
background: #1D1D1D;\
}\
.ace-chaos {\
background-color: #161616;\
color: #E6E1DC;\
}\
.ace-chaos .ace_cursor {\
border-left: 2px solid #FFFFFF;\
}\
.ace-chaos .ace_cursor.ace_overwrite {\
border-left: 0px;\
border-bottom: 1px solid #FFFFFF;\
}\
.ace-chaos .ace_marker-layer .ace_selection {\
background: #494836;\
}\
.ace-chaos .ace_marker-layer .ace_step {\
background: rgb(198, 219, 174);\
}\
.ace-chaos .ace_marker-layer .ace_bracket {\
margin: -1px 0 0 -1px;\
border: 1px solid #FCE94F;\
}\
.ace-chaos .ace_marker-layer .ace_active-line {\
background: #333;\
}\
.ace-chaos .ace_gutter-active-line {\
background-color: #222;\
}\
.ace-chaos .ace_invisible {\
color: #404040;\
}\
.ace-chaos .ace_keyword {\
color:#00698F;\
}\
.ace-chaos .ace_keyword.ace_operator {\
color:#FF308F;\
}\
.ace-chaos .ace_constant {\
color:#1EDAFB;\
}\
.ace-chaos .ace_constant.ace_language {\
color:#FDC251;\
}\
.ace-chaos .ace_constant.ace_library {\
color:#8DFF0A;\
}\
.ace-chaos .ace_constant.ace_numeric {\
color:#58C554;\
}\
.ace-chaos .ace_invalid {\
color:#FFFFFF;\
background-color:#990000;\
}\
.ace-chaos .ace_invalid.ace_deprecated {\
color:#FFFFFF;\
background-color:#990000;\
}\
.ace-chaos .ace_support {\
color: #999;\
}\
.ace-chaos .ace_support.ace_function {\
color:#00AEEF;\
}\
.ace-chaos .ace_function {\
color:#00AEEF;\
}\
.ace-chaos .ace_string {\
color:#58C554;\
}\
.ace-chaos .ace_comment {\
color:#555;\
font-style:italic;\
padding-bottom: 0px;\
}\
.ace-chaos .ace_variable {\
color:#997744;\
}\
.ace-chaos .ace_meta.ace_tag {\
color:#BE53E6;\
}\
.ace-chaos .ace_entity.ace_other.ace_attribute-name {\
color:#FFFF89;\
}\
.ace-chaos .ace_markup.ace_underline {\
text-decoration: underline;\
}\
.ace-chaos .ace_fold-widget {\
text-align: center;\
}\
.ace-chaos .ace_fold-widget:hover {\
color: #777;\
}\
.ace-chaos .ace_fold-widget.ace_start,\
.ace-chaos .ace_fold-widget.ace_end,\
.ace-chaos .ace_fold-widget.ace_closed{\
background: none;\
border: none;\
box-shadow: none;\
}\
.ace-chaos .ace_fold-widget.ace_start:after {\
content: '\u25be'\
}\
.ace-chaos .ace_fold-widget.ace_end:after {\
content: '\u25b4'\
}\
.ace-chaos .ace_fold-widget.ace_closed:after {\
content: '\u2023'\
}\
.ace-chaos .ace_indent-guide {\
border-right:1px dotted #333;\
margin-right:-1px;\
}\
.ace-chaos .ace_fold { \
background: #222; \
border-radius: 3px; \
color: #7AF; \
border: none; \
}\
.ace-chaos .ace_fold:hover {\
background: #CCC; \
color: #000;\
}\
";

var dom = require("../lib/dom");
dom.importCssString(exports.cssText, exports.cssClass);

});/* ***** BEGIN LICENSE BLOCK *****
 * Distributed under the BSD license:
 *
 * Copyright (c) 2010, Ajax.org B.V.
 * All rights reserved.
 * 
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of Ajax.org B.V. nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL AJAX.ORG B.V. BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * ***** END LICENSE BLOCK ***** */

ace.define('ace/theme/chrome', ['require', 'exports', 'module' , 'ace/lib/dom'], function(require, exports, module) {

exports.isDark = false;
exports.cssClass = "ace-chrome";
exports.cssText = ".ace-chrome .ace_gutter {\
background: #ebebeb;\
color: #333;\
overflow : hidden;\
}\
.ace-chrome .ace_print-margin {\
width: 1px;\
background: #e8e8e8;\
}\
.ace-chrome {\
background-color: #FFFFFF;\
color: black;\
}\
.ace-chrome .ace_cursor {\
color: black;\
}\
.ace-chrome .ace_invisible {\
color: rgb(191, 191, 191);\
}\
.ace-chrome .ace_constant.ace_buildin {\
color: rgb(88, 72, 246);\
}\
.ace-chrome .ace_constant.ace_language {\
color: rgb(88, 92, 246);\
}\
.ace-chrome .ace_constant.ace_library {\
color: rgb(6, 150, 14);\
}\
.ace-chrome .ace_invalid {\
background-color: rgb(153, 0, 0);\
color: white;\
}\
.ace-chrome .ace_fold {\
}\
.ace-chrome .ace_support.ace_function {\
color: rgb(60, 76, 114);\
}\
.ace-chrome .ace_support.ace_constant {\
color: rgb(6, 150, 14);\
}\
.ace-chrome .ace_support.ace_type,\
.ace-chrome .ace_support.ace_class\
.ace-chrome .ace_support.ace_other {\
color: rgb(109, 121, 222);\
}\
.ace-chrome .ace_variable.ace_parameter {\
font-style:italic;\
color:#FD971F;\
}\
.ace-chrome .ace_keyword.ace_operator {\
color: rgb(104, 118, 135);\
}\
.ace-chrome .ace_comment {\
color: #236e24;\
}\
.ace-chrome .ace_comment.ace_doc {\
color: #236e24;\
}\
.ace-chrome .ace_comment.ace_doc.ace_tag {\
color: #236e24;\
}\
.ace-chrome .ace_constant.ace_numeric {\
color: rgb(0, 0, 205);\
}\
.ace-chrome .ace_variable {\
color: rgb(49, 132, 149);\
}\
.ace-chrome .ace_xml-pe {\
color: rgb(104, 104, 91);\
}\
.ace-chrome .ace_entity.ace_name.ace_function {\
color: #0000A2;\
}\
.ace-chrome .ace_heading {\
color: rgb(12, 7, 255);\
}\
.ace-chrome .ace_list {\
color:rgb(185, 6, 144);\
}\
.ace-chrome .ace_marker-layer .ace_selection {\
background: rgb(181, 213, 255);\
}\
.ace-chrome .ace_marker-layer .ace_step {\
background: rgb(252, 255, 0);\
}\
.ace-chrome .ace_marker-layer .ace_stack {\
background: rgb(164, 229, 101);\
}\
.ace-chrome .ace_marker-layer .ace_bracket {\
margin: -1px 0 0 -1px;\
border: 1px solid rgb(192, 192, 192);\
}\
.ace-chrome .ace_marker-layer .ace_active-line {\
background: rgba(0, 0, 0, 0.07);\
}\
.ace-chrome .ace_gutter-active-line {\
background-color : #dcdcdc;\
}\
.ace-chrome .ace_marker-layer .ace_selected-word {\
background: rgb(250, 250, 255);\
border: 1px solid rgb(200, 200, 250);\
}\
.ace-chrome .ace_storage,\
.ace-chrome .ace_keyword,\
.ace-chrome .ace_meta.ace_tag {\
color: rgb(147, 15, 128);\
}\
.ace-chrome .ace_string.ace_regex {\
color: rgb(255, 0, 0)\
}\
.ace-chrome .ace_string {\
color: #1A1AA6;\
}\
.ace-chrome .ace_entity.ace_other.ace_attribute-name {\
color: #994409;\
}\
.ace-chrome .ace_indent-guide {\
background: url(\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAACCAYAAACZgbYnAAAAE0lEQVQImWP4////f4bLly//BwAmVgd1/w11/gAAAABJRU5ErkJggg==\") right repeat-y;\
}\
";

var dom = require("../lib/dom");
dom.importCssString(exports.cssText, exports.cssClass);
});
/* ***** BEGIN LICENSE BLOCK *****
 * Distributed under the BSD license:
 *
 * Copyright (c) 2010, Ajax.org B.V.
 * All rights reserved.
 * 
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of Ajax.org B.V. nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL AJAX.ORG B.V. BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * ***** END LICENSE BLOCK ***** */

ace.define('ace/theme/cloud9_day', ['require', 'exports', 'module' , 'ace/lib/dom'], function(require, exports, module) {


exports.isDark = false;
exports.cssClass = "ace-cloud9-day";
exports.cssText = ".ace-cloud9-day .ace_gutter {\
background: #ECECEC;\
color: #333;\
}\
.ace-cloud9-day .ace_print-margin {\
width: 1px;\
background: #e8e8e8;\
}\
.ace-cloud9-day .ace_fold {\
background-color: #6B72E6;\
}\
.ace-cloud9-day {\
background-color: #F8F8F8;\
color: black;\
}\
.ace-cloud9-day .ace_cursor {\
color: black;\
}\
.ace-cloud9-day .ace_invisible {\
color: rgb(191, 191, 191);\
}\
.ace-cloud9-day .ace_storage,\
.ace-cloud9-day .ace_keyword {\
color: blue;\
}\
.ace-cloud9-day .ace_constant {\
color: rgb(197, 6, 11);\
}\
.ace-cloud9-day .ace_constant.ace_buildin {\
color: rgb(88, 72, 246);\
}\
.ace-cloud9-day .ace_constant.ace_language {\
color: rgb(88, 92, 246);\
}\
.ace-cloud9-day .ace_constant.ace_library {\
color: rgb(6, 150, 14);\
}\
.ace-cloud9-day .ace_invalid {\
background-color: rgba(255, 0, 0, 0.1);\
color: red;\
}\
.ace-cloud9-day .ace_support.ace_function {\
color: rgb(60, 76, 114);\
}\
.ace-cloud9-day .ace_support.ace_constant {\
color: rgb(6, 150, 14);\
}\
.ace-cloud9-day .ace_support.ace_type,\
.ace-cloud9-day .ace_support.ace_class {\
color: rgb(109, 121, 222);\
}\
.ace-cloud9-day .ace_keyword.ace_operator {\
color: rgb(104, 118, 135);\
}\
.ace-cloud9-day .ace_string {\
color: rgb(3, 106, 7);\
}\
.ace-cloud9-day .ace_comment {\
color: rgb(76, 136, 107);\
}\
.ace-cloud9-day .ace_comment.ace_doc {\
color: rgb(0, 102, 255);\
}\
.ace-cloud9-day .ace_comment.ace_doc.ace_tag {\
color: rgb(128, 159, 191);\
}\
.ace-cloud9-day .ace_constant.ace_numeric {\
color: rgb(0, 0, 205);\
}\
.ace-cloud9-day .ace_variable {\
color: rgb(49, 132, 149);\
}\
.ace-cloud9-day .ace_xml-pe {\
color: rgb(104, 104, 91);\
}\
.ace-cloud9-day .ace_entity.ace_name.ace_function {\
color: #0000A2;\
}\
.ace-cloud9-day .ace_heading {\
color: rgb(12, 7, 255);\
}\
.ace-cloud9-day .ace_list {\
color:rgb(185, 6, 144);\
}\
.ace-cloud9-day .ace_meta.ace_tag {\
color:rgb(0, 22, 142);\
}\
.ace-cloud9-day .ace_string.ace_regex {\
color: rgb(255, 0, 0)\
}\
.ace-cloud9-day .ace_marker-layer .ace_selection {\
background: rgb(181, 213, 255);\
}\
.ace-cloud9-day.ace_multiselect .ace_selection.ace_start {\
box-shadow: 0 0 3px 0px white;\
border-radius: 2px;\
}\
.ace-cloud9-day .ace_marker-layer .ace_step {\
background: rgb(252, 255, 0);\
}\
.ace-cloud9-day .ace_marker-layer .ace_stack {\
background: rgb(164, 229, 101);\
}\
.ace-cloud9-day .ace_marker-layer .ace_bracket {\
margin: -1px 0 0 -1px;\
border: 1px solid rgb(192, 192, 192);\
}\
.ace-cloud9-day .ace_marker-layer .ace_active-line {\
background: rgba(0, 0, 0, 0.07);\
}\
.ace-cloud9-day .ace_gutter-active-line {\
background-color : #dcdcdc;\
}\
.ace-cloud9-day .ace_marker-layer .ace_selected-word {\
background: rgb(250, 250, 255);\
border: 1px solid rgb(200, 200, 250);\
}\
.ace-cloud9-day .ace_indent-guide {\
background: url(\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAACCAYAAACZgbYnAAAAE0lEQVQImWP4////f4bLly//BwAmVgd1/w11/gAAAABJRU5ErkJggg==\") right repeat-y;\
}\
";

var dom = require("../lib/dom");
dom.importCssString(exports.cssText, exports.cssClass);
});
/* ***** BEGIN LICENSE BLOCK *****
 * Distributed under the BSD license:
 *
 * Copyright (c) 2010, Ajax.org B.V.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of Ajax.org B.V. nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL AJAX.ORG B.V. BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * ***** END LICENSE BLOCK ***** */

ace.define('ace/theme/cloud9_night', ['require', 'exports', 'module' , 'ace/lib/dom'], function(require, exports, module) {

exports.isDark = true;
exports.cssClass = "ace-cloud9-night";
exports.cssText = ".ace-cloud9-night .ace_gutter {\
background: #303130;\
color: #eee\
}\
.ace-cloud9-night .ace_print-margin {\
width: 1px;\
background: #222\
}\
.ace-cloud9-night {\
background-color: #181818;\
color: #EBEBEB\
}\
.ace-cloud9-night .ace_cursor {\
color: #9F9F9F\
}\
.ace-cloud9-night .ace_marker-layer .ace_selection {\
background: #424242\
}\
.ace-cloud9-night.ace_multiselect .ace_selection.ace_start {\
box-shadow: 0 0 3px 0px #000000;\
border-radius: 2px\
}\
.ace-cloud9-night .ace_marker-layer .ace_step {\
background: rgb(102, 82, 0)\
}\
.ace-cloud9-night .ace_marker-layer .ace_bracket {\
margin: -1px 0 0 -1px;\
border: 1px solid #888888\
}\
.ace-cloud9-night .ace_marker-layer .ace_highlight {\
border: 1px solid rgb(110, 119, 0);\
border-bottom: 0;\
box-shadow: inset 0 -1px rgb(110, 119, 0);\
margin: -1px 0 0 -1px;\
background: rgba(255, 235, 0, 0.1);\
}\
.ace-cloud9-night .ace_marker-layer .ace_active-line {\
background: #292929\
}\
.ace-cloud9-night .ace_gutter-active-line {\
background-color: #3D3D3D\
}\
.ace-cloud9-night .ace_stack {\
background-color: rgb(66, 90, 44)\
}\
.ace-cloud9-night .ace_marker-layer .ace_selected-word {\
border: 1px solid #888888\
}\
.ace-cloud9-night .ace_invisible {\
color: #343434\
}\
.ace-cloud9-night .ace_keyword,\
.ace-cloud9-night .ace_meta,\
.ace-cloud9-night .ace_storage,\
.ace-cloud9-night .ace_storage.ace_type,\
.ace-cloud9-night .ace_support.ace_type {\
color: #C397D8\
}\
.ace-cloud9-night .ace_keyword.ace_operator {\
color: #70C0B1\
}\
.ace-cloud9-night .ace_constant.ace_character,\
.ace-cloud9-night .ace_constant.ace_language,\
.ace-cloud9-night .ace_constant.ace_numeric,\
.ace-cloud9-night .ace_keyword.ace_other.ace_unit,\
.ace-cloud9-night .ace_support.ace_constant,\
.ace-cloud9-night .ace_variable.ace_parameter {\
color: #E78C45\
}\
.ace-cloud9-night .ace_constant.ace_other {\
color: #EEEEEE\
}\
.ace-cloud9-night .ace_invalid {\
color: #CED2CF;\
background-color: #DF5F5F\
}\
.ace-cloud9-night .ace_invalid.ace_deprecated {\
color: #CED2CF;\
background-color: #B798BF\
}\
.ace-cloud9-night .ace_fold {\
background-color: #7AA6DA;\
border-color: #DEDEDE\
}\
.ace-cloud9-night .ace_entity.ace_name.ace_function,\
.ace-cloud9-night .ace_support.ace_function,\
.ace-cloud9-night .ace_variable {\
color: #7AA6DA\
}\
.ace-cloud9-night .ace_support.ace_class,\
.ace-cloud9-night .ace_support.ace_type {\
color: #E7C547\
}\
.ace-cloud9-night .ace_heading,\
.ace-cloud9-night .ace_markup.ace_heading,\
.ace-cloud9-night .ace_string {\
color: #B9CA4A\
}\
.ace-cloud9-night .ace_entity.ace_name.ace_tag,\
.ace-cloud9-night .ace_entity.ace_other.ace_attribute-name,\
.ace-cloud9-night .ace_meta.ace_tag,\
.ace-cloud9-night .ace_string.ace_regexp,\
.ace-cloud9-night .ace_variable {\
color: #D54E53\
}\
.ace-cloud9-night .ace_comment {\
color: #969896\
}\
.ace-cloud9-night .ace_c9searchresults.ace_keyword {\
color: #C2C280;\
}\
.ace-cloud9-night .ace_indent-guide {\
background: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAACCAYAAACZgbYnAAAAEklEQVQImWNgYGBgYFBXV/8PAAJoAXX4kT2EAAAAAElFTkSuQmCC) right repeat-y\
}";

var dom = require("../lib/dom");
dom.importCssString(exports.cssText, exports.cssClass);
});
/* ***** BEGIN LICENSE BLOCK *****
 * Distributed under the BSD license:
 *
 * Copyright (c) 2010, Ajax.org B.V.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of Ajax.org B.V. nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL AJAX.ORG B.V. BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * ***** END LICENSE BLOCK ***** */

ace.define('ace/theme/cloud9_night_low_color', ['require', 'exports', 'module' , 'ace/lib/dom'], function(require, exports, module) {

exports.isDark = true;
exports.cssClass = "ace-cloud9-night-low-color";
exports.cssText = ".ace-cloud9-night-low-color .ace_gutter {\
background: #303130;\
color: #eee\
}\
.ace-cloud9-night-low-color .ace_print-margin {\
width: 1px;\
background: #222\
}\
.ace-cloud9-night-low-color {\
background-color: #181818;\
color: #EBEBEB\
}\
.ace-cloud9-night-low-color .ace_cursor {\
color: #9F9F9F\
}\
.ace-cloud9-night-low-color .ace_marker-layer .ace_selection {\
background: #424242\
}\
.ace-cloud9-night-low-color.ace_multiselect .ace_selection.ace_start {\
box-shadow: 0 0 3px 0px #000000;\
border-radius: 2px\
}\
.ace-cloud9-night-low-color .ace_marker-layer .ace_step {\
background: rgb(102, 82, 0)\
}\
.ace-cloud9-night-low-color .ace_marker-layer .ace_bracket {\
margin: -1px 0 0 -1px;\
border: 1px solid #888888\
}\
.ace-cloud9-night-low-color .ace_marker-layer .ace_highlight {\
border: 1px solid rgb(110, 119, 0);\
border-bottom: 0;\
box-shadow: inset 0 -1px rgb(110, 119, 0);\
margin: -1px 0 0 -1px;\
background: rgba(255, 235, 0, 0.1);\
}\
.ace-cloud9-night-low-color .ace_marker-layer .ace_active-line {\
background: #292929\
}\
.ace-cloud9-night-low-color .ace_gutter-active-line {\
background-color: #3D3D3D\
}\
.ace-cloud9-night-low-color .ace_stack {\
background-color: rgb(66, 90, 44)\
}\
.ace-cloud9-night-low-color .ace_marker-layer .ace_selected-word {\
border: 1px solid #888888\
}\
.ace-cloud9-night-low-color .ace_invisible {\
color: #343434\
}\
.ace-cloud9-night-low-color .ace_keyword,\
.ace-cloud9-night-low-color .ace_meta,\
.ace-cloud9-night-low-color .ace_storage {\
color: #C397D8\
}\
.ace-cloud9-night-low-color .ace_keyword.ace_operator {\
color: #70C0B1\
}\
.ace-cloud9-night-low-color .ace_constant.ace_character,\
.ace-cloud9-night-low-color .ace_constant.ace_language,\
.ace-cloud9-night-low-color .ace_constant.ace_numeric,\
.ace-cloud9-night-low-color .ace_keyword.ace_other.ace_unit {\
color: #B9CA4A\
}\
.ace-cloud9-night-low-color .ace_constant.ace_other {\
color: #EEEEEE\
}\
.ace-cloud9-night-low-color .ace_invalid {\
color: #CED2CF;\
background-color: #DF5F5F\
}\
.ace-cloud9-night-low-color .ace_invalid.ace_deprecated {\
color: #CED2CF;\
background-color: #B798BF\
}\
.ace-cloud9-night-low-color .ace_fold {\
background-color: #7AA6DA;\
border-color: #DEDEDE\
}\
.ace-cloud9-night-low-color .ace_entity.ace_name.ace_function,\
.ace-cloud9-night-low-color .ace_support.ace_function,\
.ace-cloud9-night-low-color .ace_variable:not(.ace_parameter),\
.ace-cloud9-night-low-color .ace_constant:not(.ace_numeric) {\
color: #7AA6DA\
}\
.ace-cloud9-night-low-color .ace_support.ace_class,\
.ace-cloud9-night-low-color .ace_support.ace_type {\
color: #E7C547\
}\
.ace-cloud9-night-low-color .ace_heading,\
.ace-cloud9-night-low-color .ace_markup.ace_heading,\
.ace-cloud9-night-low-color .ace_string {\
color: #B9CA4A\
}\
.ace-cloud9-night-low-color .ace_comment {\
color: #969896\
}\
.ace-cloud9-night-low-color .ace_c9searchresults.ace_keyword {\
color: #C2C280;\
}\
.ace-cloud9-night-low-color .ace_indent-guide {\
background: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAACCAYAAACZgbYnAAAAEklEQVQImWNgYGBgYFBXV/8PAAJoAXX4kT2EAAAAAElFTkSuQmCC) right repeat-y\
}";

var dom = require("../lib/dom");
dom.importCssString(exports.cssText, exports.cssClass);
});
/* ***** BEGIN LICENSE BLOCK *****
 * Distributed under the BSD license:
 *
 * Copyright (c) 2010, Ajax.org B.V.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of Ajax.org B.V. nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL AJAX.ORG B.V. BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * ***** END LICENSE BLOCK ***** */

ace.define('ace/theme/clouds', ['require', 'exports', 'module' , 'ace/lib/dom'], function(require, exports, module) {

exports.isDark = false;
exports.cssClass = "ace-clouds";
exports.cssText = ".ace-clouds .ace_gutter {\
background: #ebebeb;\
color: #333\
}\
.ace-clouds .ace_print-margin {\
width: 1px;\
background: #e8e8e8\
}\
.ace-clouds {\
background-color: #FFFFFF;\
color: #000000\
}\
.ace-clouds .ace_cursor {\
color: #000000\
}\
.ace-clouds .ace_marker-layer .ace_selection {\
background: #BDD5FC\
}\
.ace-clouds.ace_multiselect .ace_selection.ace_start {\
box-shadow: 0 0 3px 0px #FFFFFF;\
border-radius: 2px\
}\
.ace-clouds .ace_marker-layer .ace_step {\
background: rgb(255, 255, 0)\
}\
.ace-clouds .ace_marker-layer .ace_bracket {\
margin: -1px 0 0 -1px;\
border: 1px solid #BFBFBF\
}\
.ace-clouds .ace_marker-layer .ace_active-line {\
background: #FFFBD1\
}\
.ace-clouds .ace_gutter-active-line {\
background-color : #dcdcdc\
}\
.ace-clouds .ace_marker-layer .ace_selected-word {\
border: 1px solid #BDD5FC\
}\
.ace-clouds .ace_invisible {\
color: #BFBFBF\
}\
.ace-clouds .ace_keyword,\
.ace-clouds .ace_meta,\
.ace-clouds .ace_support.ace_constant.ace_property-value {\
color: #AF956F\
}\
.ace-clouds .ace_keyword.ace_operator {\
color: #484848\
}\
.ace-clouds .ace_keyword.ace_other.ace_unit {\
color: #96DC5F\
}\
.ace-clouds .ace_constant.ace_language {\
color: #39946A\
}\
.ace-clouds .ace_constant.ace_numeric {\
color: #46A609\
}\
.ace-clouds .ace_constant.ace_character.ace_entity {\
color: #BF78CC\
}\
.ace-clouds .ace_invalid {\
background-color: #FF002A\
}\
.ace-clouds .ace_fold {\
background-color: #AF956F;\
border-color: #000000\
}\
.ace-clouds .ace_storage,\
.ace-clouds .ace_support.ace_class,\
.ace-clouds .ace_support.ace_function,\
.ace-clouds .ace_support.ace_other,\
.ace-clouds .ace_support.ace_type {\
color: #C52727\
}\
.ace-clouds .ace_string {\
color: #5D90CD\
}\
.ace-clouds .ace_comment {\
color: #BCC8BA\
}\
.ace-clouds .ace_entity.ace_name.ace_tag,\
.ace-clouds .ace_entity.ace_other.ace_attribute-name {\
color: #606060\
}\
.ace-clouds .ace_indent-guide {\
background: url(\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAACCAYAAACZgbYnAAAAE0lEQVQImWP4////f4bLly//BwAmVgd1/w11/gAAAABJRU5ErkJggg==\") right repeat-y\
}";

var dom = require("../lib/dom");
dom.importCssString(exports.cssText, exports.cssClass);
});
/* ***** BEGIN LICENSE BLOCK *****
 * Distributed under the BSD license:
 *
 * Copyright (c) 2010, Ajax.org B.V.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of Ajax.org B.V. nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL AJAX.ORG B.V. BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * ***** END LICENSE BLOCK ***** */

ace.define('ace/theme/clouds_midnight', ['require', 'exports', 'module' , 'ace/lib/dom'], function(require, exports, module) {

exports.isDark = true;
exports.cssClass = "ace-clouds-midnight";
exports.cssText = ".ace-clouds-midnight .ace_gutter {\
background: #232323;\
color: #929292\
}\
.ace-clouds-midnight .ace_print-margin {\
width: 1px;\
background: #232323\
}\
.ace-clouds-midnight {\
background-color: #191919;\
color: #929292\
}\
.ace-clouds-midnight .ace_cursor {\
color: #7DA5DC\
}\
.ace-clouds-midnight .ace_marker-layer .ace_selection {\
background: #000000\
}\
.ace-clouds-midnight.ace_multiselect .ace_selection.ace_start {\
box-shadow: 0 0 3px 0px #191919;\
border-radius: 2px\
}\
.ace-clouds-midnight .ace_marker-layer .ace_step {\
background: rgb(102, 82, 0)\
}\
.ace-clouds-midnight .ace_marker-layer .ace_bracket {\
margin: -1px 0 0 -1px;\
border: 1px solid #BFBFBF\
}\
.ace-clouds-midnight .ace_marker-layer .ace_active-line {\
background: rgba(215, 215, 215, 0.031)\
}\
.ace-clouds-midnight .ace_gutter-active-line {\
background-color: rgba(215, 215, 215, 0.031)\
}\
.ace-clouds-midnight .ace_marker-layer .ace_selected-word {\
border: 1px solid #000000\
}\
.ace-clouds-midnight .ace_invisible {\
color: #BFBFBF\
}\
.ace-clouds-midnight .ace_keyword,\
.ace-clouds-midnight .ace_meta,\
.ace-clouds-midnight .ace_support.ace_constant.ace_property-value {\
color: #927C5D\
}\
.ace-clouds-midnight .ace_keyword.ace_operator {\
color: #4B4B4B\
}\
.ace-clouds-midnight .ace_keyword.ace_other.ace_unit {\
color: #366F1A\
}\
.ace-clouds-midnight .ace_constant.ace_language {\
color: #39946A\
}\
.ace-clouds-midnight .ace_constant.ace_numeric {\
color: #46A609\
}\
.ace-clouds-midnight .ace_constant.ace_character.ace_entity {\
color: #A165AC\
}\
.ace-clouds-midnight .ace_invalid {\
color: #FFFFFF;\
background-color: #E92E2E\
}\
.ace-clouds-midnight .ace_fold {\
background-color: #927C5D;\
border-color: #929292\
}\
.ace-clouds-midnight .ace_storage,\
.ace-clouds-midnight .ace_support.ace_class,\
.ace-clouds-midnight .ace_support.ace_function,\
.ace-clouds-midnight .ace_support.ace_other,\
.ace-clouds-midnight .ace_support.ace_type {\
color: #E92E2E\
}\
.ace-clouds-midnight .ace_string {\
color: #5D90CD\
}\
.ace-clouds-midnight .ace_comment {\
color: #3C403B\
}\
.ace-clouds-midnight .ace_entity.ace_name.ace_tag,\
.ace-clouds-midnight .ace_entity.ace_other.ace_attribute-name {\
color: #606060\
}\
.ace-clouds-midnight .ace_indent-guide {\
background: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAACCAYAAACZgbYnAAAAEklEQVQImWNgYGBgYHB3d/8PAAOIAdULw8qMAAAAAElFTkSuQmCC) right repeat-y\
}";

var dom = require("../lib/dom");
dom.importCssString(exports.cssText, exports.cssClass);
});
/* ***** BEGIN LICENSE BLOCK *****
 * Distributed under the BSD license:
 *
 * Copyright (c) 2010, Ajax.org B.V.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of Ajax.org B.V. nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL AJAX.ORG B.V. BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * ***** END LICENSE BLOCK ***** */

ace.define("ace/theme/cobalt",["require","exports","module","ace/lib/dom"], function(require, exports, module) {

    exports.isDark = true;
    exports.cssClass = "ace-cobalt";
    exports.cssText = ".ace-cobalt .ace_gutter {\
background: #011e3a;\
color: rgb(128,145,160)\
}\
.ace-cobalt .ace_print-margin {\
width: 1px;\
background: #011e3a\
}\
.ace-cobalt {\
background-color: #002240;\
color: #FFFFFF\
}\
.ace-cobalt .ace_cursor {\
color: #FFFFFF\
}\
.ace-cobalt .ace_marker-layer .ace_selection {\
background: rgba(179, 101, 57, 0.75)\
}\
.ace-cobalt.ace_multiselect .ace_selection.ace_start {\
box-shadow: 0 0 3px 0px #002240;\
border-radius: 2px\
}\
.ace-cobalt .ace_marker-layer .ace_step {\
background: rgb(127, 111, 19)\
}\
.ace-cobalt .ace_marker-layer .ace_bracket {\
margin: -1px 0 0 -1px;\
border: 1px solid rgba(255, 255, 255, 0.15)\
}\
.ace-cobalt .ace_marker-layer .ace_active-line {\
background: rgba(0, 0, 0, 0.35)\
}\
.ace-cobalt .ace_gutter-active-line {\
background-color: rgba(0, 0, 0, 0.35)\
}\
.ace-cobalt .ace_marker-layer .ace_selected-word {\
border: 1px solid rgba(179, 101, 57, 0.75)\
}\
.ace-cobalt .ace_invisible {\
color: rgba(255, 255, 255, 0.15)\
}\
.ace-cobalt .ace_keyword,\
.ace-cobalt .ace_meta {\
color: #FF9D00\
}\
.ace-cobalt .ace_constant,\
.ace-cobalt .ace_constant.ace_character,\
.ace-cobalt .ace_constant.ace_character.ace_escape,\
.ace-cobalt .ace_constant.ace_other {\
color: #FF628C\
}\
.ace-cobalt .ace_invalid {\
color: #F8F8F8;\
background-color: #800F00\
}\
.ace-cobalt .ace_support {\
color: #80FFBB\
}\
.ace-cobalt .ace_support.ace_constant {\
color: #EB939A\
}\
.ace-cobalt .ace_fold {\
background-color: #FF9D00;\
border-color: #FFFFFF\
}\
.ace-cobalt .ace_support.ace_function {\
color: #FFB054\
}\
.ace-cobalt .ace_storage {\
color: #FFEE80\
}\
.ace-cobalt .ace_entity {\
color: #FFDD00\
}\
.ace-cobalt .ace_string {\
color: #3AD900\
}\
.ace-cobalt .ace_string.ace_regexp {\
color: #80FFC2\
}\
.ace-cobalt .ace_comment {\
font-style: italic;\
color: #0088FF\
}\
.ace-cobalt .ace_heading,\
.ace-cobalt .ace_markup.ace_heading {\
color: #C8E4FD;\
background-color: #001221\
}\
.ace-cobalt .ace_list,\
.ace-cobalt .ace_markup.ace_list {\
background-color: #130D26\
}\
.ace-cobalt .ace_variable {\
color: #CCCCCC\
}\
.ace-cobalt .ace_variable.ace_language {\
color: #FF80E1\
}\
.ace-cobalt .ace_meta.ace_tag {\
color: #9EFFFF\
}\
.ace-cobalt .ace_indent-guide {\
background: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAACCAYAAACZgbYnAAAAEklEQVQImWNgYGBgYHCLSvkPAAP3AgSDTRd4AAAAAElFTkSuQmCC) right repeat-y\
}";

    var dom = require("../lib/dom");
    dom.importCssString(exports.cssText, exports.cssClass);
});

/* ***** BEGIN LICENSE BLOCK *****
 * Distributed under the BSD license:
 *
 * Copyright (c) 2010, Ajax.org B.V.
 * All rights reserved.
 * 
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of Ajax.org B.V. nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL AJAX.ORG B.V. BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * ***** END LICENSE BLOCK ***** */

ace.define('ace/theme/crimson_editor', ['require', 'exports', 'module' , 'ace/lib/dom'], function(require, exports, module) {
exports.isDark = false;
exports.cssText = ".ace-crimson-editor .ace_gutter {\
background: #ebebeb;\
color: #333;\
overflow : hidden;\
}\
.ace-crimson-editor .ace_gutter-layer {\
width: 100%;\
text-align: right;\
}\
.ace-crimson-editor .ace_print-margin {\
width: 1px;\
background: #e8e8e8;\
}\
.ace-crimson-editor {\
background-color: #FFFFFF;\
color: rgb(64, 64, 64);\
}\
.ace-crimson-editor .ace_cursor {\
color: black;\
}\
.ace-crimson-editor .ace_invisible {\
color: rgb(191, 191, 191);\
}\
.ace-crimson-editor .ace_identifier {\
color: black;\
}\
.ace-crimson-editor .ace_keyword {\
color: blue;\
}\
.ace-crimson-editor .ace_constant.ace_buildin {\
color: rgb(88, 72, 246);\
}\
.ace-crimson-editor .ace_constant.ace_language {\
color: rgb(255, 156, 0);\
}\
.ace-crimson-editor .ace_constant.ace_library {\
color: rgb(6, 150, 14);\
}\
.ace-crimson-editor .ace_invalid {\
text-decoration: line-through;\
color: rgb(224, 0, 0);\
}\
.ace-crimson-editor .ace_fold {\
}\
.ace-crimson-editor .ace_support.ace_function {\
color: rgb(192, 0, 0);\
}\
.ace-crimson-editor .ace_support.ace_constant {\
color: rgb(6, 150, 14);\
}\
.ace-crimson-editor .ace_support.ace_type,\
.ace-crimson-editor .ace_support.ace_class {\
color: rgb(109, 121, 222);\
}\
.ace-crimson-editor .ace_keyword.ace_operator {\
color: rgb(49, 132, 149);\
}\
.ace-crimson-editor .ace_string {\
color: rgb(128, 0, 128);\
}\
.ace-crimson-editor .ace_comment {\
color: rgb(76, 136, 107);\
}\
.ace-crimson-editor .ace_comment.ace_doc {\
color: rgb(0, 102, 255);\
}\
.ace-crimson-editor .ace_comment.ace_doc.ace_tag {\
color: rgb(128, 159, 191);\
}\
.ace-crimson-editor .ace_constant.ace_numeric {\
color: rgb(0, 0, 64);\
}\
.ace-crimson-editor .ace_variable {\
color: rgb(0, 64, 128);\
}\
.ace-crimson-editor .ace_xml-pe {\
color: rgb(104, 104, 91);\
}\
.ace-crimson-editor .ace_marker-layer .ace_selection {\
background: rgb(181, 213, 255);\
}\
.ace-crimson-editor .ace_marker-layer .ace_step {\
background: rgb(252, 255, 0);\
}\
.ace-crimson-editor .ace_marker-layer .ace_stack {\
background: rgb(164, 229, 101);\
}\
.ace-crimson-editor .ace_marker-layer .ace_bracket {\
margin: -1px 0 0 -1px;\
border: 1px solid rgb(192, 192, 192);\
}\
.ace-crimson-editor .ace_marker-layer .ace_active-line {\
background: rgb(232, 242, 254);\
}\
.ace-crimson-editor .ace_gutter-active-line {\
background-color : #dcdcdc;\
}\
.ace-crimson-editor .ace_meta.ace_tag {\
color:rgb(28, 2, 255);\
}\
.ace-crimson-editor .ace_marker-layer .ace_selected-word {\
background: rgb(250, 250, 255);\
border: 1px solid rgb(200, 200, 250);\
}\
.ace-crimson-editor .ace_string.ace_regex {\
color: rgb(192, 0, 192);\
}\
.ace-crimson-editor .ace_indent-guide {\
background: url(\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAACCAYAAACZgbYnAAAAE0lEQVQImWP4////f4bLly//BwAmVgd1/w11/gAAAABJRU5ErkJggg==\") right repeat-y;\
}";

exports.cssClass = "ace-crimson-editor";

var dom = require("../lib/dom");
dom.importCssString(exports.cssText, exports.cssClass);
});
/* ***** BEGIN LICENSE BLOCK *****
 * Distributed under the BSD license:
 *
 * Copyright (c) 2010, Ajax.org B.V.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of Ajax.org B.V. nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL AJAX.ORG B.V. BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * ***** END LICENSE BLOCK ***** */

ace.define('ace/theme/dawn', ['require', 'exports', 'module' , 'ace/lib/dom'], function(require, exports, module) {

exports.isDark = false;
exports.cssClass = "ace-dawn";
exports.cssText = ".ace-dawn .ace_gutter {\
background: #ebebeb;\
color: #333\
}\
.ace-dawn .ace_print-margin {\
width: 1px;\
background: #e8e8e8\
}\
.ace-dawn {\
background-color: #F9F9F9;\
color: #080808\
}\
.ace-dawn .ace_cursor {\
color: #000000\
}\
.ace-dawn .ace_marker-layer .ace_selection {\
background: rgba(39, 95, 255, 0.30)\
}\
.ace-dawn.ace_multiselect .ace_selection.ace_start {\
box-shadow: 0 0 3px 0px #F9F9F9;\
border-radius: 2px\
}\
.ace-dawn .ace_marker-layer .ace_step {\
background: rgb(255, 255, 0)\
}\
.ace-dawn .ace_marker-layer .ace_bracket {\
margin: -1px 0 0 -1px;\
border: 1px solid rgba(75, 75, 126, 0.50)\
}\
.ace-dawn .ace_marker-layer .ace_active-line {\
background: rgba(36, 99, 180, 0.12)\
}\
.ace-dawn .ace_gutter-active-line {\
background-color : #dcdcdc\
}\
.ace-dawn .ace_marker-layer .ace_selected-word {\
border: 1px solid rgba(39, 95, 255, 0.30)\
}\
.ace-dawn .ace_invisible {\
color: rgba(75, 75, 126, 0.50)\
}\
.ace-dawn .ace_keyword,\
.ace-dawn .ace_meta {\
color: #794938\
}\
.ace-dawn .ace_constant,\
.ace-dawn .ace_constant.ace_character,\
.ace-dawn .ace_constant.ace_character.ace_escape,\
.ace-dawn .ace_constant.ace_other {\
color: #811F24\
}\
.ace-dawn .ace_invalid.ace_illegal {\
text-decoration: underline;\
font-style: italic;\
color: #F8F8F8;\
background-color: #B52A1D\
}\
.ace-dawn .ace_invalid.ace_deprecated {\
text-decoration: underline;\
font-style: italic;\
color: #B52A1D\
}\
.ace-dawn .ace_support {\
color: #691C97\
}\
.ace-dawn .ace_support.ace_constant {\
color: #B4371F\
}\
.ace-dawn .ace_fold {\
background-color: #794938;\
border-color: #080808\
}\
.ace-dawn .ace_list,\
.ace-dawn .ace_markup.ace_list,\
.ace-dawn .ace_support.ace_function {\
color: #693A17\
}\
.ace-dawn .ace_storage {\
font-style: italic;\
color: #A71D5D\
}\
.ace-dawn .ace_string {\
color: #0B6125\
}\
.ace-dawn .ace_string.ace_regexp {\
color: #CF5628\
}\
.ace-dawn .ace_comment {\
font-style: italic;\
color: #5A525F\
}\
.ace-dawn .ace_heading,\
.ace-dawn .ace_markup.ace_heading {\
color: #19356D\
}\
.ace-dawn .ace_variable {\
color: #234A97\
}\
.ace-dawn .ace_indent-guide {\
background: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAACCAYAAACZgbYnAAAAEklEQVQImWNgYGBgYLh/5+x/AAizA4hxNNsZAAAAAElFTkSuQmCC) right repeat-y\
}";

var dom = require("../lib/dom");
dom.importCssString(exports.cssText, exports.cssClass);
});
/* ***** BEGIN LICENSE BLOCK *****
 * Distributed under the BSD license:
 *
 * Copyright (c) 2010, Ajax.org B.V.
 * All rights reserved.
 * 
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of Ajax.org B.V. nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL AJAX.ORG B.V. BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * ***** END LICENSE BLOCK ***** */

ace.define('ace/theme/dreamweaver', ['require', 'exports', 'module' , 'ace/lib/dom'], function(require, exports, module) {
exports.isDark = false;
exports.cssClass = "ace-dreamweaver";
exports.cssText = ".ace-dreamweaver .ace_gutter {\
background: #e8e8e8;\
color: #333;\
}\
.ace-dreamweaver .ace_print-margin {\
width: 1px;\
background: #e8e8e8;\
}\
.ace-dreamweaver {\
background-color: #FFFFFF;\
color: black;\
}\
.ace-dreamweaver .ace_fold {\
background-color: #757AD8;\
}\
.ace-dreamweaver .ace_cursor {\
color: black;\
}\
.ace-dreamweaver .ace_invisible {\
color: rgb(191, 191, 191);\
}\
.ace-dreamweaver .ace_storage,\
.ace-dreamweaver .ace_keyword {\
color: blue;\
}\
.ace-dreamweaver .ace_constant.ace_buildin {\
color: rgb(88, 72, 246);\
}\
.ace-dreamweaver .ace_constant.ace_language {\
color: rgb(88, 92, 246);\
}\
.ace-dreamweaver .ace_constant.ace_library {\
color: rgb(6, 150, 14);\
}\
.ace-dreamweaver .ace_invalid {\
background-color: rgb(153, 0, 0);\
color: white;\
}\
.ace-dreamweaver .ace_support.ace_function {\
color: rgb(60, 76, 114);\
}\
.ace-dreamweaver .ace_support.ace_constant {\
color: rgb(6, 150, 14);\
}\
.ace-dreamweaver .ace_support.ace_type,\
.ace-dreamweaver .ace_support.ace_class {\
color: #009;\
}\
.ace-dreamweaver .ace_support.ace_php_tag {\
color: #f00;\
}\
.ace-dreamweaver .ace_keyword.ace_operator {\
color: rgb(104, 118, 135);\
}\
.ace-dreamweaver .ace_string {\
color: #00F;\
}\
.ace-dreamweaver .ace_comment {\
color: rgb(76, 136, 107);\
}\
.ace-dreamweaver .ace_comment.ace_doc {\
color: rgb(0, 102, 255);\
}\
.ace-dreamweaver .ace_comment.ace_doc.ace_tag {\
color: rgb(128, 159, 191);\
}\
.ace-dreamweaver .ace_constant.ace_numeric {\
color: rgb(0, 0, 205);\
}\
.ace-dreamweaver .ace_variable {\
color: #06F\
}\
.ace-dreamweaver .ace_xml-pe {\
color: rgb(104, 104, 91);\
}\
.ace-dreamweaver .ace_entity.ace_name.ace_function {\
color: #00F;\
}\
.ace-dreamweaver .ace_heading {\
color: rgb(12, 7, 255);\
}\
.ace-dreamweaver .ace_list {\
color:rgb(185, 6, 144);\
}\
.ace-dreamweaver .ace_marker-layer .ace_selection {\
background: rgb(181, 213, 255);\
}\
.ace-dreamweaver .ace_marker-layer .ace_step {\
background: rgb(252, 255, 0);\
}\
.ace-dreamweaver .ace_marker-layer .ace_stack {\
background: rgb(164, 229, 101);\
}\
.ace-dreamweaver .ace_marker-layer .ace_bracket {\
margin: -1px 0 0 -1px;\
border: 1px solid rgb(192, 192, 192);\
}\
.ace-dreamweaver .ace_marker-layer .ace_active-line {\
background: rgba(0, 0, 0, 0.07);\
}\
.ace-dreamweaver .ace_gutter-active-line {\
background-color : #DCDCDC;\
}\
.ace-dreamweaver .ace_marker-layer .ace_selected-word {\
background: rgb(250, 250, 255);\
border: 1px solid rgb(200, 200, 250);\
}\
.ace-dreamweaver .ace_meta.ace_tag {\
color:#009;\
}\
.ace-dreamweaver .ace_meta.ace_tag.ace_anchor {\
color:#060;\
}\
.ace-dreamweaver .ace_meta.ace_tag.ace_form {\
color:#F90;\
}\
.ace-dreamweaver .ace_meta.ace_tag.ace_image {\
color:#909;\
}\
.ace-dreamweaver .ace_meta.ace_tag.ace_script {\
color:#900;\
}\
.ace-dreamweaver .ace_meta.ace_tag.ace_style {\
color:#909;\
}\
.ace-dreamweaver .ace_meta.ace_tag.ace_table {\
color:#099;\
}\
.ace-dreamweaver .ace_string.ace_regex {\
color: rgb(255, 0, 0)\
}\
.ace-dreamweaver .ace_indent-guide {\
background: url(\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAACCAYAAACZgbYnAAAAE0lEQVQImWP4////f4bLly//BwAmVgd1/w11/gAAAABJRU5ErkJggg==\") right repeat-y;\
}";

var dom = require("../lib/dom");
dom.importCssString(exports.cssText, exports.cssClass);
});
/* ***** BEGIN LICENSE BLOCK *****
 * Distributed under the BSD license:
 *
 * Copyright (c) 2010, Ajax.org B.V.
 * All rights reserved.
 * 
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of Ajax.org B.V. nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL AJAX.ORG B.V. BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * ***** END LICENSE BLOCK ***** */

ace.define('ace/theme/eclipse', ['require', 'exports', 'module' , 'ace/lib/dom'], function(require, exports, module) {


exports.isDark = false;
exports.cssText = ".ace-eclipse .ace_gutter {\
background: #ebebeb;\
border-right: 1px solid rgb(159, 159, 159);\
color: rgb(136, 136, 136);\
}\
.ace-eclipse .ace_print-margin {\
width: 1px;\
background: #ebebeb;\
}\
.ace-eclipse {\
background-color: #FFFFFF;\
color: black;\
}\
.ace-eclipse .ace_fold {\
background-color: rgb(60, 76, 114);\
}\
.ace-eclipse .ace_cursor {\
color: black;\
}\
.ace-eclipse .ace_storage,\
.ace-eclipse .ace_keyword,\
.ace-eclipse .ace_variable {\
color: rgb(127, 0, 85);\
}\
.ace-eclipse .ace_constant.ace_buildin {\
color: rgb(88, 72, 246);\
}\
.ace-eclipse .ace_constant.ace_library {\
color: rgb(6, 150, 14);\
}\
.ace-eclipse .ace_function {\
color: rgb(60, 76, 114);\
}\
.ace-eclipse .ace_string {\
color: rgb(42, 0, 255);\
}\
.ace-eclipse .ace_comment {\
color: rgb(113, 150, 130);\
}\
.ace-eclipse .ace_comment.ace_doc {\
color: rgb(63, 95, 191);\
}\
.ace-eclipse .ace_comment.ace_doc.ace_tag {\
color: rgb(127, 159, 191);\
}\
.ace-eclipse .ace_constant.ace_numeric {\
color: darkblue;\
}\
.ace-eclipse .ace_tag {\
color: rgb(25, 118, 116);\
}\
.ace-eclipse .ace_type {\
color: rgb(127, 0, 127);\
}\
.ace-eclipse .ace_xml-pe {\
color: rgb(104, 104, 91);\
}\
.ace-eclipse .ace_marker-layer .ace_selection {\
background: rgb(181, 213, 255);\
}\
.ace-eclipse .ace_marker-layer .ace_bracket {\
margin: -1px 0 0 -1px;\
border: 1px solid rgb(192, 192, 192);\
}\
.ace-eclipse .ace_meta.ace_tag {\
color:rgb(25, 118, 116);\
}\
.ace-eclipse .ace_invisible {\
color: #ddd;\
}\
.ace-eclipse .ace_entity.ace_other.ace_attribute-name {\
color:rgb(127, 0, 127);\
}\
.ace-eclipse .ace_marker-layer .ace_step {\
background: rgb(255, 255, 0);\
}\
.ace-eclipse .ace_active-line {\
background: rgb(232, 242, 254);\
}\
.ace-eclipse .ace_gutter-active-line {\
background-color : #DADADA;\
}\
.ace-eclipse .ace_marker-layer .ace_selected-word {\
border: 1px solid rgb(181, 213, 255);\
}\
.ace-eclipse .ace_indent-guide {\
background: url(\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAACCAYAAACZgbYnAAAAE0lEQVQImWP4////f4bLly//BwAmVgd1/w11/gAAAABJRU5ErkJggg==\") right repeat-y;\
}";

exports.cssClass = "ace-eclipse";

var dom = require("../lib/dom");
dom.importCssString(exports.cssText, exports.cssClass);
});
/* ***** BEGIN LICENSE BLOCK *****
 * Distributed under the BSD license:
 *
 * Copyright (c) 2010, Ajax.org B.V.
 * All rights reserved.
 * 
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of Ajax.org B.V. nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL AJAX.ORG B.V. BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * ***** END LICENSE BLOCK ***** */

ace.define('ace/theme/github', ['require', 'exports', 'module' , 'ace/lib/dom'], function(require, exports, module) {

exports.isDark = false;
exports.cssClass = "ace-github";
exports.cssText = "/* CSS style content from github's default pygments highlighter template.\
Cursor and selection styles from textmate.css. */\
.ace-github .ace_gutter {\
background: #e8e8e8;\
color: #AAA;\
}\
.ace-github  {\
background: #fff;\
color: #000;\
}\
.ace-github .ace_keyword {\
font-weight: bold;\
}\
.ace-github .ace_string {\
color: #D14;\
}\
.ace-github .ace_variable.ace_class {\
color: teal;\
}\
.ace-github .ace_constant.ace_numeric {\
color: #099;\
}\
.ace-github .ace_constant.ace_buildin {\
color: #0086B3;\
}\
.ace-github .ace_support.ace_function {\
color: #0086B3;\
}\
.ace-github .ace_comment {\
color: #998;\
font-style: italic;\
}\
.ace-github .ace_variable.ace_language  {\
color: #0086B3;\
}\
.ace-github .ace_paren {\
font-weight: bold;\
}\
.ace-github .ace_boolean {\
font-weight: bold;\
}\
.ace-github .ace_string.ace_regexp {\
color: #009926;\
font-weight: normal;\
}\
.ace-github .ace_variable.ace_instance {\
color: teal;\
}\
.ace-github .ace_constant.ace_language {\
font-weight: bold;\
}\
.ace-github .ace_cursor {\
color: black;\
}\
.ace-github .ace_marker-layer .ace_active-line {\
background: rgb(255, 255, 204);\
}\
.ace-github .ace_marker-layer .ace_selection {\
background: rgb(181, 213, 255);\
}\
.ace-github.ace_multiselect .ace_selection.ace_start {\
box-shadow: 0 0 3px 0px white;\
border-radius: 2px;\
}\
/* bold keywords cause cursor issues for some fonts */\
/* this disables bold style for editor and keeps for static highlighter */\
.ace-github.ace_nobold .ace_line > span {\
font-weight: normal !important;\
}\
.ace-github .ace_marker-layer .ace_step {\
background: rgb(252, 255, 0);\
}\
.ace-github .ace_marker-layer .ace_stack {\
background: rgb(164, 229, 101);\
}\
.ace-github .ace_marker-layer .ace_bracket {\
margin: -1px 0 0 -1px;\
border: 1px solid rgb(192, 192, 192);\
}\
.ace-github .ace_gutter-active-line {\
background-color : rgba(0, 0, 0, 0.07);\
}\
.ace-github .ace_marker-layer .ace_selected-word {\
background: rgb(250, 250, 255);\
border: 1px solid rgb(200, 200, 250);\
}\
.ace-github .ace_print-margin {\
width: 1px;\
background: #e8e8e8;\
}\
.ace-github .ace_indent-guide {\
background: url(\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAACCAYAAACZgbYnAAAAE0lEQVQImWP4////f4bLly//BwAmVgd1/w11/gAAAABJRU5ErkJggg==\") right repeat-y;\
}";

    var dom = require("../lib/dom");
    dom.importCssString(exports.cssText, exports.cssClass);
});
/* ***** BEGIN LICENSE BLOCK *****
 * Distributed under the BSD license:
 *
 * Copyright (c) 2010, Ajax.org B.V.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of Ajax.org B.V. nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL AJAX.ORG B.V. BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * ***** END LICENSE BLOCK ***** */

ace.define("ace/theme/idle_fingers",["require","exports","module","ace/lib/dom"], function(require, exports, module) {

    exports.isDark = true;
    exports.cssClass = "ace-idle-fingers";
    exports.cssText = ".ace-idle-fingers .ace_gutter {\
background: #3b3b3b;\
color: rgb(153,153,153)\
}\
.ace-idle-fingers .ace_print-margin {\
width: 1px;\
background: #3b3b3b\
}\
.ace-idle-fingers {\
background-color: #323232;\
color: #FFFFFF\
}\
.ace-idle-fingers .ace_cursor {\
color: #91FF00\
}\
.ace-idle-fingers .ace_marker-layer .ace_selection {\
background: rgba(90, 100, 126, 0.88)\
}\
.ace-idle-fingers.ace_multiselect .ace_selection.ace_start {\
box-shadow: 0 0 3px 0px #323232;\
border-radius: 2px\
}\
.ace-idle-fingers .ace_marker-layer .ace_step {\
background: rgb(102, 82, 0)\
}\
.ace-idle-fingers .ace_marker-layer .ace_bracket {\
margin: -1px 0 0 -1px;\
border: 1px solid #404040\
}\
.ace-idle-fingers .ace_marker-layer .ace_active-line {\
background: #353637\
}\
.ace-idle-fingers .ace_gutter-active-line {\
background-color: #353637\
}\
.ace-idle-fingers .ace_marker-layer .ace_selected-word {\
border: 1px solid rgba(90, 100, 126, 0.88)\
}\
.ace-idle-fingers .ace_invisible {\
color: #404040\
}\
.ace-idle-fingers .ace_keyword,\
.ace-idle-fingers .ace_meta {\
color: #CC7833\
}\
.ace-idle-fingers .ace_constant,\
.ace-idle-fingers .ace_constant.ace_character,\
.ace-idle-fingers .ace_constant.ace_character.ace_escape,\
.ace-idle-fingers .ace_constant.ace_other,\
.ace-idle-fingers .ace_support.ace_constant {\
color: #6C99BB\
}\
.ace-idle-fingers .ace_invalid {\
color: #FFFFFF;\
background-color: #FF0000\
}\
.ace-idle-fingers .ace_fold {\
background-color: #CC7833;\
border-color: #FFFFFF\
}\
.ace-idle-fingers .ace_support.ace_function {\
color: #B83426\
}\
.ace-idle-fingers .ace_variable.ace_parameter {\
font-style: italic\
}\
.ace-idle-fingers .ace_string {\
color: #A5C261\
}\
.ace-idle-fingers .ace_string.ace_regexp {\
color: #CCCC33\
}\
.ace-idle-fingers .ace_comment {\
font-style: italic;\
color: #BC9458\
}\
.ace-idle-fingers .ace_meta.ace_tag {\
color: #FFE5BB\
}\
.ace-idle-fingers .ace_entity.ace_name {\
color: #FFC66D\
}\
.ace-idle-fingers .ace_collab.ace_user1 {\
color: #323232;\
background-color: #FFF980\
}\
.ace-idle-fingers .ace_indent-guide {\
background: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAACCAYAAACZgbYnAAAAEklEQVQImWMwMjLyZYiPj/8PAAreAwAI1+g0AAAAAElFTkSuQmCC) right repeat-y\
}";

    var dom = require("../lib/dom");
    dom.importCssString(exports.cssText, exports.cssClass);
});
/* ***** BEGIN LICENSE BLOCK *****
 * Distributed under the BSD license:
 *
 * Copyright (c) 2010, Ajax.org B.V.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of Ajax.org B.V. nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL AJAX.ORG B.V. BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * ***** END LICENSE BLOCK ***** */

ace.define('ace/theme/katzenmilch', ['require', 'exports', 'module' , 'ace/lib/dom'], function(require, exports, module) {

exports.isDark = false;
exports.cssClass = "ace-katzenmilch";
exports.cssText = ".ace-katzenmilch .ace_gutter,\
/* THIS THEME WAS AUTOGENERATED BY Theme.tmpl.css (UUID: ) */\
.ace-katzenmilch .ace_gutter {\
background: #e8e8e8;\
color: #333\
}\
.ace-katzenmilch .ace_print-margin {\
width: 1px;\
background: #e8e8e8\
}\
.ace-katzenmilch {\
background-color: #f3f2f3;\
color: rgba(15, 0, 9, 1.0)\
}\
.ace-katzenmilch .ace_cursor {\
border-left: 2px solid #100011\
}\
.ace-katzenmilch .ace_overwrite-cursors .ace_cursor {\
border-left: 0px;\
border-bottom: 1px solid #100011\
}\
.ace-katzenmilch .ace_marker-layer .ace_selection {\
background: rgba(100, 5, 208, 0.27)\
}\
.ace-katzenmilch.ace_multiselect .ace_selection.ace_start {\
box-shadow: 0 0 3px 0px #f3f2f3;\
border-radius: 2px\
}\
.ace-katzenmilch .ace_marker-layer .ace_step {\
background: rgb(198, 219, 174)\
}\
.ace-katzenmilch .ace_marker-layer .ace_bracket {\
margin: -1px 0 0 -1px;\
border: 1px solid #000000\
}\
.ace-katzenmilch .ace_marker-layer .ace_active-line {\
background: rgb(232, 242, 254)\
}\
.ace-katzenmilch .ace_gutter-active-line {\
background-color: rgb(232, 242, 254)\
}\
.ace-katzenmilch .ace_marker-layer .ace_selected-word {\
border: 1px solid rgba(100, 5, 208, 0.27)\
}\
.ace-katzenmilch .ace_fold {\
background-color: rgba(2, 95, 73, 0.97);\
border-color: rgba(15, 0, 9, 1.0)\
}\
.ace-katzenmilch .ace_keyword {\
color: #674Aa8;\
rbackground-color: rgba(163, 170, 216, 0.055)\
}\
.ace-katzenmilch .ace_constant.ace_language {\
color: #7D7e52;\
rbackground-color: rgba(189, 190, 130, 0.059)\
}\
.ace-katzenmilch .ace_constant.ace_numeric {\
color: rgba(79, 130, 123, 0.93);\
rbackground-color: rgba(119, 194, 187, 0.059)\
}\
.ace-katzenmilch .ace_constant.ace_character,\
.ace-katzenmilch .ace_constant.ace_other {\
color: rgba(2, 95, 105, 1.0);\
rbackground-color: rgba(127, 34, 153, 0.063)\
}\
.ace-katzenmilch .ace_support.ace_function {\
color: #9D7e62;\
rbackground-color: rgba(189, 190, 130, 0.039)\
}\
.ace-katzenmilch .ace_support.ace_class {\
color: rgba(239, 106, 167, 1.0);\
rbackground-color: rgba(239, 106, 167, 0.063)\
}\
.ace-katzenmilch .ace_storage {\
color: rgba(123, 92, 191, 1.0);\
rbackground-color: rgba(139, 93, 223, 0.051)\
}\
.ace-katzenmilch .ace_invalid {\
color: #DFDFD5;\
rbackground-color: #CC1B27\
}\
.ace-katzenmilch .ace_string {\
color: #5a5f9b;\
rbackground-color: rgba(170, 175, 219, 0.035)\
}\
.ace-katzenmilch .ace_comment {\
font-style: italic;\
color: rgba(64, 79, 80, 0.67);\
rbackground-color: rgba(95, 15, 255, 0.0078)\
}\
.ace-katzenmilch .ace_entity.ace_name.ace_function,\
.ace-katzenmilch .ace_variable {\
color: rgba(2, 95, 73, 0.97);\
rbackground-color: rgba(34, 255, 73, 0.12)\
}\
.ace-katzenmilch .ace_variable.ace_language {\
color: #316fcf;\
rbackground-color: rgba(58, 175, 255, 0.039)\
}\
.ace-katzenmilch .ace_variable.ace_parameter {\
font-style: italic;\
color: rgba(51, 150, 159, 0.87);\
rbackground-color: rgba(5, 214, 249, 0.043)\
}\
.ace-katzenmilch .ace_entity.ace_other.ace_attribute-name {\
color: rgba(73, 70, 194, 0.93);\
rbackground-color: rgba(73, 134, 194, 0.035)\
}\
.ace-katzenmilch .ace_entity.ace_name.ace_tag {\
color: #3976a2;\
rbackground-color: rgba(73, 166, 210, 0.039)\
}";

var dom = require("../lib/dom");
dom.importCssString(exports.cssText, exports.cssClass);
});
/* ***** BEGIN LICENSE BLOCK *****
 * Distributed under the BSD license:
 *
 * Copyright (c) 2010, Ajax.org B.V.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of Ajax.org B.V. nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL AJAX.ORG B.V. BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * ***** END LICENSE BLOCK ***** */

ace.define("ace/theme/kr_theme",["require","exports","module","ace/lib/dom"], function(require, exports, module) {

    exports.isDark = true;
    exports.cssClass = "ace-kr-theme";
    exports.cssText = ".ace-kr-theme .ace_gutter {\
background: #1c1917;\
color: #FCFFE0\
}\
.ace-kr-theme .ace_print-margin {\
width: 1px;\
background: #1c1917\
}\
.ace-kr-theme {\
background-color: #0B0A09;\
color: #FCFFE0\
}\
.ace-kr-theme .ace_cursor {\
color: #FF9900\
}\
.ace-kr-theme .ace_marker-layer .ace_selection {\
background: rgba(170, 0, 255, 0.45)\
}\
.ace-kr-theme.ace_multiselect .ace_selection.ace_start {\
box-shadow: 0 0 3px 0px #0B0A09;\
border-radius: 2px\
}\
.ace-kr-theme .ace_marker-layer .ace_step {\
background: rgb(102, 82, 0)\
}\
.ace-kr-theme .ace_marker-layer .ace_bracket {\
margin: -1px 0 0 -1px;\
border: 1px solid rgba(255, 177, 111, 0.32)\
}\
.ace-kr-theme .ace_marker-layer .ace_active-line {\
background: #38403D\
}\
.ace-kr-theme .ace_gutter-active-line {\
background-color : #38403D\
}\
.ace-kr-theme .ace_marker-layer .ace_selected-word {\
border: 1px solid rgba(170, 0, 255, 0.45)\
}\
.ace-kr-theme .ace_invisible {\
color: rgba(255, 177, 111, 0.32)\
}\
.ace-kr-theme .ace_keyword,\
.ace-kr-theme .ace_meta {\
color: #949C8B\
}\
.ace-kr-theme .ace_constant,\
.ace-kr-theme .ace_constant.ace_character,\
.ace-kr-theme .ace_constant.ace_character.ace_escape,\
.ace-kr-theme .ace_constant.ace_other {\
color: rgba(210, 117, 24, 0.76)\
}\
.ace-kr-theme .ace_invalid {\
color: #F8F8F8;\
background-color: #A41300\
}\
.ace-kr-theme .ace_support {\
color: #9FC28A\
}\
.ace-kr-theme .ace_support.ace_constant {\
color: #C27E66\
}\
.ace-kr-theme .ace_fold {\
background-color: #949C8B;\
border-color: #FCFFE0\
}\
.ace-kr-theme .ace_support.ace_function {\
color: #85873A\
}\
.ace-kr-theme .ace_storage {\
color: #FFEE80\
}\
.ace-kr-theme .ace_string {\
color: rgba(164, 161, 181, 0.8)\
}\
.ace-kr-theme .ace_string.ace_regexp {\
color: rgba(125, 255, 192, 0.65)\
}\
.ace-kr-theme .ace_comment {\
font-style: italic;\
color: #706D5B\
}\
.ace-kr-theme .ace_variable {\
color: #D1A796\
}\
.ace-kr-theme .ace_list,\
.ace-kr-theme .ace_markup.ace_list {\
background-color: #0F0040\
}\
.ace-kr-theme .ace_variable.ace_language {\
color: #FF80E1\
}\
.ace-kr-theme .ace_meta.ace_tag {\
color: #BABD9C\
}\
.ace-kr-theme .ace_indent-guide {\
background: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAACCAYAAACZgbYnAAAAEklEQVQImWNgYGBgYFBXV/8PAAJoAXX4kT2EAAAAAElFTkSuQmCC) right repeat-y\
}";

    var dom = require("../lib/dom");
    dom.importCssString(exports.cssText, exports.cssClass);
});
/* ***** BEGIN LICENSE BLOCK *****
 * Distributed under the BSD license:
 *
 * Copyright (c) 2010, Ajax.org B.V.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of Ajax.org B.V. nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL AJAX.ORG B.V. BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * ***** END LICENSE BLOCK ***** */

ace.define('ace/theme/kuroir', ['require', 'exports', 'module' , 'ace/lib/dom'], function(require, exports, module) {

exports.isDark = false;
exports.cssClass = "ace-kuroir";
exports.cssText = "/* THIS THEME WAS AUTOGENERATED BY Theme.tmpl.css (UUID: 467560D0-6ACE-4409-82FD-4791420837AC) */\
.ace-kuroir .ace_gutter {\
background: #e8e8e8;\
color: #333;\
}\
.ace-kuroir .ace_print-margin {\
width: 1px;\
background: #e8e8e8;\
}\
.ace-kuroir {\
background-color: #E8E9E8;\
color: #363636;\
}\
.ace-kuroir .ace_cursor {\
color: #202020;\
}\
.ace-kuroir .ace_marker-layer .ace_selection {\
background: rgba(245, 170, 0, 0.57);\
}\
.ace-kuroir.ace_multiselect .ace_selection.ace_start {\
box-shadow: 0 0 3px 0px #E8E9E8;\
border-radius: 2px;\
}\
.ace-kuroir .ace_marker-layer .ace_step {\
background: rgb(198, 219, 174);\
}\
.ace-kuroir .ace_marker-layer .ace_bracket {\
margin: -1px 0 0 -1px;\
border: 1px solid rgba(0, 0, 0, 0.29);\
}\
.ace-kuroir .ace_marker-layer .ace_active-line {\
background: rgba(203, 220, 47, 0.22);\
}\
.ace-kuroir .ace_gutter-active-line {\
background-color: rgba(203, 220, 47, 0.22);\
}\
.ace-kuroir .ace_marker-layer .ace_selected-word {\
border: 1px solid rgba(245, 170, 0, 0.57);\
}\
.ace-kuroir .ace_fold {\
border-color: #363636;\
}\
.ace-kuroir .ace_constant{color:#CD6839;}.ace-kuroir .ace_constant.ace_numeric{color:#9A5925;}.ace-kuroir .ace_support{color:#104E8B;}.ace-kuroir .ace_support.ace_function{color:#005273;}.ace-kuroir .ace_support.ace_constant{color:#CF6A4C;}.ace-kuroir .ace_storage{color:#A52A2A;}.ace-kuroir .ace_invalid.ace_illegal{color:#FD1224;\
background-color:rgba(255, 6, 0, 0.15);}.ace-kuroir .ace_invalid.ace_deprecated{text-decoration:underline;\
font-style:italic;\
color:#FD1732;\
background-color:#E8E9E8;}.ace-kuroir .ace_string{color:#639300;}.ace-kuroir .ace_string.ace_regexp{color:#417E00;\
background-color:#C9D4BE;}.ace-kuroir .ace_comment{color:rgba(148, 148, 148, 0.91);\
background-color:rgba(220, 220, 220, 0.56);}.ace-kuroir .ace_variable{color:#009ACD;}.ace-kuroir .ace_meta.ace_tag{color:#005273;}.ace-kuroir .ace_markup.ace_heading{color:#B8012D;\
background-color:rgba(191, 97, 51, 0.051);}.ace-kuroir .ace_markup.ace_list{color:#8F5B26;}\
";

var dom = require("../lib/dom");
dom.importCssString(exports.cssText, exports.cssClass);
});
/* ***** BEGIN LICENSE BLOCK *****
 * Distributed under the BSD license:
 *
 * Copyright (c) 2010, Ajax.org B.V.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of Ajax.org B.V. nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL AJAX.ORG B.V. BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * ***** END LICENSE BLOCK ***** */

ace.define('ace/theme/merbivore', ['require', 'exports', 'module' , 'ace/lib/dom'], function(require, exports, module) {

exports.isDark = true;
exports.cssClass = "ace-merbivore";
exports.cssText = ".ace-merbivore .ace_gutter {\
background: #202020;\
color: #E6E1DC\
}\
.ace-merbivore .ace_print-margin {\
width: 1px;\
background: #555651\
}\
.ace-merbivore {\
background-color: #161616;\
color: #E6E1DC\
}\
.ace-merbivore .ace_cursor {\
color: #FFFFFF\
}\
.ace-merbivore .ace_marker-layer .ace_selection {\
background: #454545\
}\
.ace-merbivore.ace_multiselect .ace_selection.ace_start {\
box-shadow: 0 0 3px 0px #161616;\
border-radius: 2px\
}\
.ace-merbivore .ace_marker-layer .ace_step {\
background: rgb(102, 82, 0)\
}\
.ace-merbivore .ace_marker-layer .ace_bracket {\
margin: -1px 0 0 -1px;\
border: 1px solid #404040\
}\
.ace-merbivore .ace_marker-layer .ace_active-line {\
background: #333435\
}\
.ace-merbivore .ace_gutter-active-line {\
background-color: #333435\
}\
.ace-merbivore .ace_marker-layer .ace_selected-word {\
border: 1px solid #454545\
}\
.ace-merbivore .ace_invisible {\
color: #404040\
}\
.ace-merbivore .ace_entity.ace_name.ace_tag,\
.ace-merbivore .ace_keyword,\
.ace-merbivore .ace_meta,\
.ace-merbivore .ace_meta.ace_tag,\
.ace-merbivore .ace_storage,\
.ace-merbivore .ace_support.ace_function {\
color: #FC6F09\
}\
.ace-merbivore .ace_constant,\
.ace-merbivore .ace_constant.ace_character,\
.ace-merbivore .ace_constant.ace_character.ace_escape,\
.ace-merbivore .ace_constant.ace_other,\
.ace-merbivore .ace_support.ace_type {\
color: #1EDAFB\
}\
.ace-merbivore .ace_constant.ace_character.ace_escape {\
color: #519F50\
}\
.ace-merbivore .ace_constant.ace_language {\
color: #FDC251\
}\
.ace-merbivore .ace_constant.ace_library,\
.ace-merbivore .ace_string,\
.ace-merbivore .ace_support.ace_constant {\
color: #8DFF0A\
}\
.ace-merbivore .ace_constant.ace_numeric {\
color: #58C554\
}\
.ace-merbivore .ace_invalid {\
color: #FFFFFF;\
background-color: #990000\
}\
.ace-merbivore .ace_fold {\
background-color: #FC6F09;\
border-color: #E6E1DC\
}\
.ace-merbivore .ace_comment {\
font-style: italic;\
color: #AD2EA4\
}\
.ace-merbivore .ace_entity.ace_other.ace_attribute-name {\
color: #FFFF89\
}\
.ace-merbivore .ace_indent-guide {\
background: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAACCAYAAACZgbYnAAAAEklEQVQImWMQFxf3ZXB1df0PAAdsAmERTkEHAAAAAElFTkSuQmCC) right repeat-y\
}";

var dom = require("../lib/dom");
dom.importCssString(exports.cssText, exports.cssClass);
});
/* ***** BEGIN LICENSE BLOCK *****
 * Distributed under the BSD license:
 *
 * Copyright (c) 2010, Ajax.org B.V.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of Ajax.org B.V. nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL AJAX.ORG B.V. BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * ***** END LICENSE BLOCK ***** */

ace.define('ace/theme/merbivore_soft', ['require', 'exports', 'module' , 'ace/lib/dom'], function(require, exports, module) {

exports.isDark = true;
exports.cssClass = "ace-merbivore-soft";
exports.cssText = ".ace-merbivore-soft .ace_gutter {\
background: #262424;\
color: #E6E1DC\
}\
.ace-merbivore-soft .ace_print-margin {\
width: 1px;\
background: #262424\
}\
.ace-merbivore-soft {\
background-color: #1C1C1C;\
color: #E6E1DC\
}\
.ace-merbivore-soft .ace_cursor {\
color: #FFFFFF\
}\
.ace-merbivore-soft .ace_marker-layer .ace_selection {\
background: #494949\
}\
.ace-merbivore-soft.ace_multiselect .ace_selection.ace_start {\
box-shadow: 0 0 3px 0px #1C1C1C;\
border-radius: 2px\
}\
.ace-merbivore-soft .ace_marker-layer .ace_step {\
background: rgb(102, 82, 0)\
}\
.ace-merbivore-soft .ace_marker-layer .ace_bracket {\
margin: -1px 0 0 -1px;\
border: 1px solid #404040\
}\
.ace-merbivore-soft .ace_marker-layer .ace_active-line {\
background: #333435\
}\
.ace-merbivore-soft .ace_gutter-active-line {\
background-color: #333435\
}\
.ace-merbivore-soft .ace_marker-layer .ace_selected-word {\
border: 1px solid #494949\
}\
.ace-merbivore-soft .ace_invisible {\
color: #404040\
}\
.ace-merbivore-soft .ace_entity.ace_name.ace_tag,\
.ace-merbivore-soft .ace_keyword,\
.ace-merbivore-soft .ace_meta,\
.ace-merbivore-soft .ace_meta.ace_tag,\
.ace-merbivore-soft .ace_storage {\
color: #FC803A\
}\
.ace-merbivore-soft .ace_constant,\
.ace-merbivore-soft .ace_constant.ace_character,\
.ace-merbivore-soft .ace_constant.ace_character.ace_escape,\
.ace-merbivore-soft .ace_constant.ace_other,\
.ace-merbivore-soft .ace_support.ace_type {\
color: #68C1D8\
}\
.ace-merbivore-soft .ace_constant.ace_character.ace_escape {\
color: #B3E5B4\
}\
.ace-merbivore-soft .ace_constant.ace_language {\
color: #E1C582\
}\
.ace-merbivore-soft .ace_constant.ace_library,\
.ace-merbivore-soft .ace_string,\
.ace-merbivore-soft .ace_support.ace_constant {\
color: #8EC65F\
}\
.ace-merbivore-soft .ace_constant.ace_numeric {\
color: #7FC578\
}\
.ace-merbivore-soft .ace_invalid,\
.ace-merbivore-soft .ace_invalid.ace_deprecated {\
color: #FFFFFF;\
background-color: #FE3838\
}\
.ace-merbivore-soft .ace_fold {\
background-color: #FC803A;\
border-color: #E6E1DC\
}\
.ace-merbivore-soft .ace_comment,\
.ace-merbivore-soft .ace_meta {\
font-style: italic;\
color: #AC4BB8\
}\
.ace-merbivore-soft .ace_entity.ace_other.ace_attribute-name {\
color: #EAF1A3\
}\
.ace-merbivore-soft .ace_indent-guide {\
background: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAACCAYAAACZgbYnAAAAEklEQVQImWOQkpLyZfD09PwPAAfYAnaStpHRAAAAAElFTkSuQmCC) right repeat-y\
}";

var dom = require("../lib/dom");
dom.importCssString(exports.cssText, exports.cssClass);
});
/* ***** BEGIN LICENSE BLOCK *****
 * Distributed under the BSD license:
 *
 * Copyright (c) 2010, Ajax.org B.V.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of Ajax.org B.V. nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL AJAX.ORG B.V. BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * ***** END LICENSE BLOCK ***** */

ace.define('ace/theme/monokai', ['require', 'exports', 'module' , 'ace/lib/dom'], function(require, exports, module) {

exports.isDark = true;
exports.cssClass = "ace-monokai";
exports.cssText = ".ace-monokai .ace_gutter {\
background: #2F3129;\
color: #8F908A\
}\
.ace-monokai .ace_print-margin {\
width: 1px;\
background: #555651\
}\
.ace-monokai {\
background-color: #272822;\
color: #F8F8F2\
}\
.ace-monokai .ace_cursor {\
color: #F8F8F0\
}\
.ace-monokai .ace_marker-layer .ace_selection {\
background: #49483E\
}\
.ace-monokai.ace_multiselect .ace_selection.ace_start {\
box-shadow: 0 0 3px 0px #272822;\
border-radius: 2px\
}\
.ace-monokai .ace_marker-layer .ace_step {\
background: rgb(102, 82, 0)\
}\
.ace-monokai .ace_marker-layer .ace_bracket {\
margin: -1px 0 0 -1px;\
border: 1px solid #49483E\
}\
.ace-monokai .ace_marker-layer .ace_active-line {\
background: #202020\
}\
.ace-monokai .ace_gutter-active-line {\
background-color: #272727\
}\
.ace-monokai .ace_marker-layer .ace_selected-word {\
border: 1px solid #49483E\
}\
.ace-monokai .ace_invisible {\
color: #52524d\
}\
.ace-monokai .ace_entity.ace_name.ace_tag,\
.ace-monokai .ace_keyword,\
.ace-monokai .ace_meta.ace_tag,\
.ace-monokai .ace_storage {\
color: #F92672\
}\
.ace-monokai .ace_punctuation,\
.ace-monokai .ace_punctuation.ace_tag {\
color: #fff\
}\
.ace-monokai .ace_constant.ace_character,\
.ace-monokai .ace_constant.ace_language,\
.ace-monokai .ace_constant.ace_numeric,\
.ace-monokai .ace_constant.ace_other {\
color: #AE81FF\
}\
.ace-monokai .ace_invalid {\
color: #F8F8F0;\
background-color: #F92672\
}\
.ace-monokai .ace_invalid.ace_deprecated {\
color: #F8F8F0;\
background-color: #AE81FF\
}\
.ace-monokai .ace_support.ace_constant,\
.ace-monokai .ace_support.ace_function {\
color: #66D9EF\
}\
.ace-monokai .ace_fold {\
background-color: #A6E22E;\
border-color: #F8F8F2\
}\
.ace-monokai .ace_storage.ace_type,\
.ace-monokai .ace_support.ace_class,\
.ace-monokai .ace_support.ace_type {\
font-style: italic;\
color: #66D9EF\
}\
.ace-monokai .ace_entity.ace_name.ace_function,\
.ace-monokai .ace_entity.ace_other,\
.ace-monokai .ace_entity.ace_other.ace_attribute-name,\
.ace-monokai .ace_variable {\
color: #A6E22E\
}\
.ace-monokai .ace_variable.ace_parameter {\
font-style: italic;\
color: #FD971F\
}\
.ace-monokai .ace_string {\
color: #E6DB74\
}\
.ace-monokai .ace_comment {\
color: #75715E\
}\
.ace-monokai .ace_indent-guide {\
background: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAACCAYAAACZgbYnAAAAEklEQVQImWPQ0FD0ZXBzd/wPAAjVAoxeSgNeAAAAAElFTkSuQmCC) right repeat-y\
}";

var dom = require("../lib/dom");
dom.importCssString(exports.cssText, exports.cssClass);
});
/* ***** BEGIN LICENSE BLOCK *****
 * Distributed under the BSD license:
 *
 * Copyright (c) 2010, Ajax.org B.V.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of Ajax.org B.V. nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL AJAX.ORG B.V. BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * ***** END LICENSE BLOCK ***** */

ace.define('ace/theme/mono_industrial', ['require', 'exports', 'module' , 'ace/lib/dom'], function(require, exports, module) {

exports.isDark = true;
exports.cssClass = "ace-mono-industrial";
exports.cssText = ".ace-mono-industrial .ace_gutter {\
background: #1d2521;\
color: #C5C9C9\
}\
.ace-mono-industrial .ace_print-margin {\
width: 1px;\
background: #555651\
}\
.ace-mono-industrial {\
background-color: #222C28;\
color: #FFFFFF\
}\
.ace-mono-industrial .ace_cursor {\
color: #FFFFFF\
}\
.ace-mono-industrial .ace_marker-layer .ace_selection {\
background: rgba(145, 153, 148, 0.40)\
}\
.ace-mono-industrial.ace_multiselect .ace_selection.ace_start {\
box-shadow: 0 0 3px 0px #222C28;\
border-radius: 2px\
}\
.ace-mono-industrial .ace_marker-layer .ace_step {\
background: rgb(102, 82, 0)\
}\
.ace-mono-industrial .ace_marker-layer .ace_bracket {\
margin: -1px 0 0 -1px;\
border: 1px solid rgba(102, 108, 104, 0.50)\
}\
.ace-mono-industrial .ace_marker-layer .ace_active-line {\
background: rgba(12, 13, 12, 0.25)\
}\
.ace-mono-industrial .ace_gutter-active-line {\
background-color: rgba(12, 13, 12, 0.25)\
}\
.ace-mono-industrial .ace_marker-layer .ace_selected-word {\
border: 1px solid rgba(145, 153, 148, 0.40)\
}\
.ace-mono-industrial .ace_invisible {\
color: rgba(102, 108, 104, 0.50)\
}\
.ace-mono-industrial .ace_string {\
background-color: #151C19;\
color: #FFFFFF\
}\
.ace-mono-industrial .ace_keyword,\
.ace-mono-industrial .ace_meta {\
color: #A39E64\
}\
.ace-mono-industrial .ace_constant,\
.ace-mono-industrial .ace_constant.ace_character,\
.ace-mono-industrial .ace_constant.ace_character.ace_escape,\
.ace-mono-industrial .ace_constant.ace_numeric,\
.ace-mono-industrial .ace_constant.ace_other {\
color: #E98800\
}\
.ace-mono-industrial .ace_entity.ace_name.ace_function,\
.ace-mono-industrial .ace_keyword.ace_operator,\
.ace-mono-industrial .ace_variable {\
color: #A8B3AB\
}\
.ace-mono-industrial .ace_invalid {\
color: #FFFFFF;\
background-color: rgba(153, 0, 0, 0.68)\
}\
.ace-mono-industrial .ace_support.ace_constant {\
color: #C87500\
}\
.ace-mono-industrial .ace_fold {\
background-color: #A8B3AB;\
border-color: #FFFFFF\
}\
.ace-mono-industrial .ace_support.ace_function {\
color: #588E60\
}\
.ace-mono-industrial .ace_entity.ace_name,\
.ace-mono-industrial .ace_support.ace_class,\
.ace-mono-industrial .ace_support.ace_type {\
color: #5778B6\
}\
.ace-mono-industrial .ace_storage {\
color: #C23B00\
}\
.ace-mono-industrial .ace_variable.ace_language,\
.ace-mono-industrial .ace_variable.ace_parameter {\
color: #648BD2\
}\
.ace-mono-industrial .ace_comment {\
color: #666C68;\
background-color: #151C19\
}\
.ace-mono-industrial .ace_entity.ace_other.ace_attribute-name {\
color: #909993\
}\
.ace-mono-industrial .ace_entity.ace_name.ace_tag {\
color: #A65EFF\
}\
.ace-mono-industrial .ace_indent-guide {\
background: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAACCAYAAACZgbYnAAAAEklEQVQImWNQ1NbwZfALD/4PAAlTArlEC4r/AAAAAElFTkSuQmCC) right repeat-y\
}";

var dom = require("../lib/dom");
dom.importCssString(exports.cssText, exports.cssClass);
});
/* ***** BEGIN LICENSE BLOCK *****
 * Distributed under the BSD license:
 *
 * Copyright (c) 2010, Ajax.org B.V.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of Ajax.org B.V. nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL AJAX.ORG B.V. BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * ***** END LICENSE BLOCK ***** */

ace.define('ace/theme/pastel_on_dark', ['require', 'exports', 'module' , 'ace/lib/dom'], function(require, exports, module) {

exports.isDark = true;
exports.cssClass = "ace-pastel-on-dark";
exports.cssText = ".ace-pastel-on-dark .ace_gutter {\
background: #353030;\
color: #8F938F\
}\
.ace-pastel-on-dark .ace_print-margin {\
width: 1px;\
background: #353030\
}\
.ace-pastel-on-dark {\
background-color: #2C2828;\
color: #8F938F\
}\
.ace-pastel-on-dark .ace_cursor {\
color: #A7A7A7\
}\
.ace-pastel-on-dark .ace_marker-layer .ace_selection {\
background: rgba(221, 240, 255, 0.20)\
}\
.ace-pastel-on-dark.ace_multiselect .ace_selection.ace_start {\
box-shadow: 0 0 3px 0px #2C2828;\
border-radius: 2px\
}\
.ace-pastel-on-dark .ace_marker-layer .ace_step {\
background: rgb(102, 82, 0)\
}\
.ace-pastel-on-dark .ace_marker-layer .ace_bracket {\
margin: -1px 0 0 -1px;\
border: 1px solid rgba(255, 255, 255, 0.25)\
}\
.ace-pastel-on-dark .ace_marker-layer .ace_active-line {\
background: rgba(255, 255, 255, 0.031)\
}\
.ace-pastel-on-dark .ace_gutter-active-line {\
background-color: rgba(255, 255, 255, 0.031)\
}\
.ace-pastel-on-dark .ace_marker-layer .ace_selected-word {\
border: 1px solid rgba(221, 240, 255, 0.20)\
}\
.ace-pastel-on-dark .ace_invisible {\
color: rgba(255, 255, 255, 0.25)\
}\
.ace-pastel-on-dark .ace_keyword,\
.ace-pastel-on-dark .ace_meta {\
color: #757aD8\
}\
.ace-pastel-on-dark .ace_constant,\
.ace-pastel-on-dark .ace_constant.ace_character,\
.ace-pastel-on-dark .ace_constant.ace_character.ace_escape,\
.ace-pastel-on-dark .ace_constant.ace_other {\
color: #4FB7C5\
}\
.ace-pastel-on-dark .ace_keyword.ace_operator {\
color: #797878\
}\
.ace-pastel-on-dark .ace_constant.ace_character {\
color: #AFA472\
}\
.ace-pastel-on-dark .ace_constant.ace_language {\
color: #DE8E30\
}\
.ace-pastel-on-dark .ace_constant.ace_numeric {\
color: #CCCCCC\
}\
.ace-pastel-on-dark .ace_invalid,\
.ace-pastel-on-dark .ace_invalid.ace_illegal {\
color: #F8F8F8;\
background-color: rgba(86, 45, 86, 0.75)\
}\
.ace-pastel-on-dark .ace_invalid.ace_deprecated {\
text-decoration: underline;\
font-style: italic;\
color: #D2A8A1\
}\
.ace-pastel-on-dark .ace_fold {\
background-color: #757aD8;\
border-color: #8F938F\
}\
.ace-pastel-on-dark .ace_support.ace_function {\
color: #AEB2F8\
}\
.ace-pastel-on-dark .ace_string {\
color: #66A968\
}\
.ace-pastel-on-dark .ace_string.ace_regexp {\
color: #E9C062\
}\
.ace-pastel-on-dark .ace_comment {\
color: #A6C6FF\
}\
.ace-pastel-on-dark .ace_variable {\
color: #BEBF55\
}\
.ace-pastel-on-dark .ace_variable.ace_language {\
color: #C1C144\
}\
.ace-pastel-on-dark .ace_xml-pe {\
color: #494949\
}\
.ace-pastel-on-dark .ace_indent-guide {\
background: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAACCAYAAACZgbYnAAAAEklEQVQImWNgYGBgYIiPj/8PAARgAh2NTMh8AAAAAElFTkSuQmCC) right repeat-y\
}";

var dom = require("../lib/dom");
dom.importCssString(exports.cssText, exports.cssClass);
});
/* ***** BEGIN LICENSE BLOCK *****
 * Distributed under the BSD license:
 *
 * Copyright (c) 2010, Ajax.org B.V.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of Ajax.org B.V. nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL AJAX.ORG B.V. BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * ***** END LICENSE BLOCK ***** */

ace.define('ace/theme/solarized_dark', ['require', 'exports', 'module' , 'ace/lib/dom'], function(require, exports, module) {

exports.isDark = true;
exports.cssClass = "ace-solarized-dark";
exports.cssText = ".ace-solarized-dark .ace_gutter {\
background: #01313f;\
color: #d0edf7\
}\
.ace-solarized-dark .ace_print-margin {\
width: 1px;\
background: #33555E\
}\
.ace-solarized-dark {\
background-color: #002B36;\
color: #93A1A1\
}\
.ace-solarized-dark .ace_entity.ace_other.ace_attribute-name,\
.ace-solarized-dark .ace_storage {\
color: #93A1A1\
}\
.ace-solarized-dark .ace_cursor,\
.ace-solarized-dark .ace_string.ace_regexp {\
color: #D30102\
}\
.ace-solarized-dark .ace_marker-layer .ace_active-line,\
.ace-solarized-dark .ace_marker-layer .ace_selection {\
background: rgba(255, 255, 255, 0.1)\
}\
.ace-solarized-dark.ace_multiselect .ace_selection.ace_start {\
box-shadow: 0 0 3px 0px #002B36;\
border-radius: 2px\
}\
.ace-solarized-dark .ace_marker-layer .ace_step {\
background: rgb(102, 82, 0)\
}\
.ace-solarized-dark .ace_marker-layer .ace_bracket {\
margin: -1px 0 0 -1px;\
border: 1px solid rgba(147, 161, 161, 0.50)\
}\
.ace-solarized-dark .ace_gutter-active-line {\
background-color: #0d3440\
}\
.ace-solarized-dark .ace_marker-layer .ace_selected-word {\
border: 1px solid #073642\
}\
.ace-solarized-dark .ace_invisible {\
color: rgba(147, 161, 161, 0.50)\
}\
.ace-solarized-dark .ace_keyword,\
.ace-solarized-dark .ace_meta,\
.ace-solarized-dark .ace_support.ace_class,\
.ace-solarized-dark .ace_support.ace_type {\
color: #859900\
}\
.ace-solarized-dark .ace_constant.ace_character,\
.ace-solarized-dark .ace_constant.ace_other {\
color: #CB4B16\
}\
.ace-solarized-dark .ace_constant.ace_language {\
color: #B58900\
}\
.ace-solarized-dark .ace_constant.ace_numeric {\
color: #D33682\
}\
.ace-solarized-dark .ace_fold {\
background-color: #268BD2;\
border-color: #93A1A1\
}\
.ace-solarized-dark .ace_entity.ace_name.ace_function,\
.ace-solarized-dark .ace_entity.ace_name.ace_tag,\
.ace-solarized-dark .ace_support.ace_function,\
.ace-solarized-dark .ace_variable,\
.ace-solarized-dark .ace_variable.ace_language {\
color: #268BD2\
}\
.ace-solarized-dark .ace_string {\
color: #2AA198\
}\
.ace-solarized-dark .ace_comment {\
font-style: italic;\
color: #657B83\
}\
.ace-solarized-dark .ace_indent-guide {\
background: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAACCAYAAACZgbYnAAAAEklEQVQImWNg0Db1ZVCxc/sPAAd4AlUHlLenAAAAAElFTkSuQmCC) right repeat-y\
}";

var dom = require("../lib/dom");
dom.importCssString(exports.cssText, exports.cssClass);
});
/* ***** BEGIN LICENSE BLOCK *****
 * Distributed under the BSD license:
 *
 * Copyright (c) 2010, Ajax.org B.V.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of Ajax.org B.V. nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL AJAX.ORG B.V. BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * ***** END LICENSE BLOCK ***** */

ace.define('ace/theme/solarized_light', ['require', 'exports', 'module' , 'ace/lib/dom'], function(require, exports, module) {

exports.isDark = false;
exports.cssClass = "ace-solarized-light";
exports.cssText = ".ace-solarized-light .ace_gutter {\
background: #fbf1d3;\
color: #333\
}\
.ace-solarized-light .ace_print-margin {\
width: 1px;\
background: #e8e8e8\
}\
.ace-solarized-light {\
background-color: #FDF6E3;\
color: #586E75\
}\
.ace-solarized-light .ace_cursor {\
color: #000000\
}\
.ace-solarized-light .ace_marker-layer .ace_selection {\
background: rgba(7, 54, 67, 0.09)\
}\
.ace-solarized-light.ace_multiselect .ace_selection.ace_start {\
box-shadow: 0 0 3px 0px #FDF6E3;\
border-radius: 2px\
}\
.ace-solarized-light .ace_marker-layer .ace_step {\
background: rgb(255, 255, 0)\
}\
.ace-solarized-light .ace_marker-layer .ace_bracket {\
margin: -1px 0 0 -1px;\
border: 1px solid rgba(147, 161, 161, 0.50)\
}\
.ace-solarized-light .ace_marker-layer .ace_active-line {\
background: #EEE8D5\
}\
.ace-solarized-light .ace_gutter-active-line {\
background-color : #EDE5C1\
}\
.ace-solarized-light .ace_marker-layer .ace_selected-word {\
border: 1px solid #073642\
}\
.ace-solarized-light .ace_invisible {\
color: rgba(147, 161, 161, 0.50)\
}\
.ace-solarized-light .ace_keyword,\
.ace-solarized-light .ace_meta,\
.ace-solarized-light .ace_support.ace_class,\
.ace-solarized-light .ace_support.ace_type {\
color: #859900\
}\
.ace-solarized-light .ace_constant.ace_character,\
.ace-solarized-light .ace_constant.ace_other {\
color: #CB4B16\
}\
.ace-solarized-light .ace_constant.ace_language {\
color: #B58900\
}\
.ace-solarized-light .ace_constant.ace_numeric {\
color: #D33682\
}\
.ace-solarized-light .ace_fold {\
background-color: #268BD2;\
border-color: #586E75\
}\
.ace-solarized-light .ace_entity.ace_name.ace_function,\
.ace-solarized-light .ace_entity.ace_name.ace_tag,\
.ace-solarized-light .ace_support.ace_function,\
.ace-solarized-light .ace_variable,\
.ace-solarized-light .ace_variable.ace_language {\
color: #268BD2\
}\
.ace-solarized-light .ace_storage {\
color: #073642\
}\
.ace-solarized-light .ace_string {\
color: #2AA198\
}\
.ace-solarized-light .ace_string.ace_regexp {\
color: #D30102\
}\
.ace-solarized-light .ace_comment,\
.ace-solarized-light .ace_entity.ace_other.ace_attribute-name {\
color: #93A1A1\
}\
.ace-solarized-light .ace_indent-guide {\
background: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAACCAYAAACZgbYnAAAAEklEQVQImWNgYGBgYHjy8NJ/AAjgA5fzQUmBAAAAAElFTkSuQmCC) right repeat-y\
}";

var dom = require("../lib/dom");
dom.importCssString(exports.cssText, exports.cssClass);
});
/* ***** BEGIN LICENSE BLOCK *****
 * Distributed under the BSD license:
 *
 * Copyright (c) 2010, Ajax.org B.V.
 * All rights reserved.
 * 
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of Ajax.org B.V. nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL AJAX.ORG B.V. BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * ***** END LICENSE BLOCK ***** */

ace.define('ace/theme/terminal', ['require', 'exports', 'module' , 'ace/lib/dom'], function(require, exports, module) {

exports.isDark = true;
exports.cssClass = "ace-terminal-theme";
exports.cssText = ".ace-terminal-theme .ace_gutter {\
background: #1a0005;\
color: steelblue\
}\
.ace-terminal-theme .ace_print-margin {\
width: 1px;\
background: #1a1a1a\
}\
.ace-terminal-theme {\
background-color: black;\
color: #DEDEDE\
}\
.ace-terminal-theme .ace_cursor {\
color: #9F9F9F\
}\
.ace-terminal-theme .ace_marker-layer .ace_selection {\
background: #424242\
}\
.ace-terminal-theme.ace_multiselect .ace_selection.ace_start {\
box-shadow: 0 0 3px 0px black;\
border-radius: 2px\
}\
.ace-terminal-theme .ace_marker-layer .ace_step {\
background: rgb(0, 0, 0)\
}\
.ace-terminal-theme .ace_marker-layer .ace_bracket {\
background: #090;\
}\
.ace-terminal-theme .ace_marker-layer .ace_bracket-start {\
background: #090;\
}\
.ace-terminal-theme .ace_marker-layer .ace_bracket-unmatched {\
margin: -1px 0 0 -1px;\
border: 1px solid #900\
}\
.ace-terminal-theme .ace_marker-layer .ace_active-line {\
background: #2A2A2A\
}\
.ace-terminal-theme .ace_gutter-active-line {\
background-color: #2A112A\
}\
.ace-terminal-theme .ace_marker-layer .ace_selected-word {\
border: 1px solid #424242\
}\
.ace-terminal-theme .ace_invisible {\
color: #343434\
}\
.ace-terminal-theme .ace_keyword,\
.ace-terminal-theme .ace_meta,\
.ace-terminal-theme .ace_storage,\
.ace-terminal-theme .ace_storage.ace_type,\
.ace-terminal-theme .ace_support.ace_type {\
color: tomato\
}\
.ace-terminal-theme .ace_keyword.ace_operator {\
color: deeppink\
}\
.ace-terminal-theme .ace_constant.ace_character,\
.ace-terminal-theme .ace_constant.ace_language,\
.ace-terminal-theme .ace_constant.ace_numeric,\
.ace-terminal-theme .ace_keyword.ace_other.ace_unit,\
.ace-terminal-theme .ace_support.ace_constant,\
.ace-terminal-theme .ace_variable.ace_parameter {\
color: #E78C45\
}\
.ace-terminal-theme .ace_constant.ace_other {\
color: gold\
}\
.ace-terminal-theme .ace_invalid {\
color: yellow;\
background-color: red\
}\
.ace-terminal-theme .ace_invalid.ace_deprecated {\
color: #CED2CF;\
background-color: #B798BF\
}\
.ace-terminal-theme .ace_fold {\
background-color: #7AA6DA;\
border-color: #DEDEDE\
}\
.ace-terminal-theme .ace_entity.ace_name.ace_function,\
.ace-terminal-theme .ace_support.ace_function,\
.ace-terminal-theme .ace_variable {\
color: #7AA6DA\
}\
.ace-terminal-theme .ace_support.ace_class,\
.ace-terminal-theme .ace_support.ace_type {\
color: #E7C547\
}\
.ace-terminal-theme .ace_heading,\
.ace-terminal-theme .ace_string {\
color: #B9CA4A\
}\
.ace-terminal-theme .ace_entity.ace_name.ace_tag,\
.ace-terminal-theme .ace_entity.ace_other.ace_attribute-name,\
.ace-terminal-theme .ace_meta.ace_tag,\
.ace-terminal-theme .ace_string.ace_regexp,\
.ace-terminal-theme .ace_variable {\
color: #D54E53\
}\
.ace-terminal-theme .ace_comment {\
color: orangered\
}\
.ace-terminal-theme .ace_indent-guide {\
background: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAACCAYAAACZgbYnAAAAEklEQVQImWNgYGBgYLBWV/8PAAK4AYnhiq+xAAAAAElFTkSuQmCC) right repeat-y;\
}\
";

var dom = require("../lib/dom");
dom.importCssString(exports.cssText, exports.cssClass);
});
/* ***** BEGIN LICENSE BLOCK *****
 * Distributed under the BSD license:
 *
 * Copyright (c) 2010, Ajax.org B.V.
 * All rights reserved.
 * 
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of Ajax.org B.V. nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL AJAX.ORG B.V. BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * ***** END LICENSE BLOCK ***** */

ace.define('ace/theme/textmate', ['require', 'exports', 'module' , 'ace/lib/dom'], function(require, exports, module) {


exports.isDark = false;
exports.cssClass = "ace-tm";
exports.cssText = ".ace-tm .ace_gutter {\
background: #f0f0f0;\
color: #333;\
}\
.ace-tm .ace_print-margin {\
width: 1px;\
background: #e8e8e8;\
}\
.ace-tm .ace_fold {\
background-color: #6B72E6;\
}\
.ace-tm {\
background-color: #FFFFFF;\
color: black;\
}\
.ace-tm .ace_cursor {\
color: black;\
}\
.ace-tm .ace_invisible {\
color: rgb(191, 191, 191);\
}\
.ace-tm .ace_storage,\
.ace-tm .ace_keyword {\
color: blue;\
}\
.ace-tm .ace_constant {\
color: rgb(197, 6, 11);\
}\
.ace-tm .ace_constant.ace_buildin {\
color: rgb(88, 72, 246);\
}\
.ace-tm .ace_constant.ace_language {\
color: rgb(88, 92, 246);\
}\
.ace-tm .ace_constant.ace_library {\
color: rgb(6, 150, 14);\
}\
.ace-tm .ace_invalid {\
background-color: rgba(255, 0, 0, 0.1);\
color: red;\
}\
.ace-tm .ace_support.ace_function {\
color: rgb(60, 76, 114);\
}\
.ace-tm .ace_support.ace_constant {\
color: rgb(6, 150, 14);\
}\
.ace-tm .ace_support.ace_type,\
.ace-tm .ace_support.ace_class {\
color: rgb(109, 121, 222);\
}\
.ace-tm .ace_keyword.ace_operator {\
color: rgb(104, 118, 135);\
}\
.ace-tm .ace_string {\
color: rgb(3, 106, 7);\
}\
.ace-tm .ace_comment {\
color: rgb(76, 136, 107);\
}\
.ace-tm .ace_comment.ace_doc {\
color: rgb(0, 102, 255);\
}\
.ace-tm .ace_comment.ace_doc.ace_tag {\
color: rgb(128, 159, 191);\
}\
.ace-tm .ace_constant.ace_numeric {\
color: rgb(0, 0, 205);\
}\
.ace-tm .ace_variable {\
color: rgb(49, 132, 149);\
}\
.ace-tm .ace_xml-pe {\
color: rgb(104, 104, 91);\
}\
.ace-tm .ace_entity.ace_name.ace_function {\
color: #0000A2;\
}\
.ace-tm .ace_heading {\
color: rgb(12, 7, 255);\
}\
.ace-tm .ace_list {\
color:rgb(185, 6, 144);\
}\
.ace-tm .ace_meta.ace_tag {\
color:rgb(0, 22, 142);\
}\
.ace-tm .ace_string.ace_regex {\
color: rgb(255, 0, 0)\
}\
.ace-tm .ace_marker-layer .ace_selection {\
background: rgb(181, 213, 255);\
}\
.ace-tm.ace_multiselect .ace_selection.ace_start {\
box-shadow: 0 0 3px 0px white;\
border-radius: 2px;\
}\
.ace-tm .ace_marker-layer .ace_step {\
background: rgb(252, 255, 0);\
}\
.ace-tm .ace_marker-layer .ace_stack {\
background: rgb(164, 229, 101);\
}\
.ace-tm .ace_marker-layer .ace_bracket {\
margin: -1px 0 0 -1px;\
border: 1px solid rgb(192, 192, 192);\
}\
.ace-tm .ace_marker-layer .ace_active-line {\
background: rgba(0, 0, 0, 0.07);\
}\
.ace-tm .ace_gutter-active-line {\
background-color : #dcdcdc;\
}\
.ace-tm .ace_marker-layer .ace_selected-word {\
background: rgb(250, 250, 255);\
border: 1px solid rgb(200, 200, 250);\
}\
.ace-tm .ace_indent-guide {\
background: url(\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAACCAYAAACZgbYnAAAAE0lEQVQImWP4////f4bLly//BwAmVgd1/w11/gAAAABJRU5ErkJggg==\") right repeat-y;\
}\
";

var dom = require("../lib/dom");
dom.importCssString(exports.cssText, exports.cssClass);
});
/* ***** BEGIN LICENSE BLOCK *****
 * Distributed under the BSD license:
 *
 * Copyright (c) 2010, Ajax.org B.V.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of Ajax.org B.V. nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL AJAX.ORG B.V. BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * ***** END LICENSE BLOCK ***** */

ace.define('ace/theme/tomorrow', ['require', 'exports', 'module' , 'ace/lib/dom'], function(require, exports, module) {

exports.isDark = false;
exports.cssClass = "ace-tomorrow";
exports.cssText = ".ace-tomorrow .ace_gutter {\
background: #f6f6f6;\
color: #4D4D4C\
}\
.ace-tomorrow .ace_print-margin {\
width: 1px;\
background: #f6f6f6\
}\
.ace-tomorrow {\
background-color: #FFFFFF;\
color: #4D4D4C\
}\
.ace-tomorrow .ace_cursor {\
color: #AEAFAD\
}\
.ace-tomorrow .ace_marker-layer .ace_selection {\
background: #D6D6D6\
}\
.ace-tomorrow.ace_multiselect .ace_selection.ace_start {\
box-shadow: 0 0 3px 0px #FFFFFF;\
border-radius: 2px\
}\
.ace-tomorrow .ace_marker-layer .ace_step {\
background: rgb(255, 255, 0)\
}\
.ace-tomorrow .ace_marker-layer .ace_bracket {\
margin: -1px 0 0 -1px;\
border: 1px solid #D1D1D1\
}\
.ace-tomorrow .ace_marker-layer .ace_active-line {\
background: #EFEFEF\
}\
.ace-tomorrow .ace_gutter-active-line {\
background-color : #dcdcdc\
}\
.ace-tomorrow .ace_marker-layer .ace_selected-word {\
border: 1px solid #D6D6D6\
}\
.ace-tomorrow .ace_invisible {\
color: #D1D1D1\
}\
.ace-tomorrow .ace_keyword,\
.ace-tomorrow .ace_meta,\
.ace-tomorrow .ace_storage,\
.ace-tomorrow .ace_storage.ace_type,\
.ace-tomorrow .ace_support.ace_type {\
color: #8959A8\
}\
.ace-tomorrow .ace_keyword.ace_operator {\
color: #3E999F\
}\
.ace-tomorrow .ace_constant.ace_character,\
.ace-tomorrow .ace_constant.ace_language,\
.ace-tomorrow .ace_constant.ace_numeric,\
.ace-tomorrow .ace_keyword.ace_other.ace_unit,\
.ace-tomorrow .ace_support.ace_constant,\
.ace-tomorrow .ace_variable.ace_parameter {\
color: #F5871F\
}\
.ace-tomorrow .ace_constant.ace_other {\
color: #666969\
}\
.ace-tomorrow .ace_invalid {\
color: #FFFFFF;\
background-color: #C82829\
}\
.ace-tomorrow .ace_invalid.ace_deprecated {\
color: #FFFFFF;\
background-color: #8959A8\
}\
.ace-tomorrow .ace_fold {\
background-color: #4271AE;\
border-color: #4D4D4C\
}\
.ace-tomorrow .ace_entity.ace_name.ace_function,\
.ace-tomorrow .ace_support.ace_function,\
.ace-tomorrow .ace_variable {\
color: #4271AE\
}\
.ace-tomorrow .ace_support.ace_class,\
.ace-tomorrow .ace_support.ace_type {\
color: #C99E00\
}\
.ace-tomorrow .ace_heading,\
.ace-tomorrow .ace_markup.ace_heading,\
.ace-tomorrow .ace_string {\
color: #718C00\
}\
.ace-tomorrow .ace_entity.ace_name.ace_tag,\
.ace-tomorrow .ace_entity.ace_other.ace_attribute-name,\
.ace-tomorrow .ace_meta.ace_tag,\
.ace-tomorrow .ace_string.ace_regexp,\
.ace-tomorrow .ace_variable {\
color: #C82829\
}\
.ace-tomorrow .ace_comment {\
color: #8E908C\
}\
.ace-tomorrow .ace_indent-guide {\
background: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAACCAYAAACZgbYnAAAAE0lEQVQImWP4////f4bdu3f/BwAlfgctduB85QAAAABJRU5ErkJggg==) right repeat-y\
}";

var dom = require("../lib/dom");
dom.importCssString(exports.cssText, exports.cssClass);
});
/* ***** BEGIN LICENSE BLOCK *****
 * Distributed under the BSD license:
 *
 * Copyright (c) 2010, Ajax.org B.V.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of Ajax.org B.V. nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL AJAX.ORG B.V. BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * ***** END LICENSE BLOCK ***** */

ace.define('ace/theme/tomorrow_night', ['require', 'exports', 'module' , 'ace/lib/dom'], function(require, exports, module) {

exports.isDark = true;
exports.cssClass = "ace-tomorrow-night";
exports.cssText = ".ace-tomorrow-night .ace_gutter {\
background: #25282c;\
color: #C5C8C6\
}\
.ace-tomorrow-night .ace_print-margin {\
width: 1px;\
background: #25282c\
}\
.ace-tomorrow-night {\
background-color: #1D1F21;\
color: #C5C8C6\
}\
.ace-tomorrow-night .ace_cursor {\
color: #AEAFAD\
}\
.ace-tomorrow-night .ace_marker-layer .ace_selection {\
background: #373B41\
}\
.ace-tomorrow-night.ace_multiselect .ace_selection.ace_start {\
box-shadow: 0 0 3px 0px #1D1F21;\
border-radius: 2px\
}\
.ace-tomorrow-night .ace_marker-layer .ace_step {\
background: rgb(102, 82, 0)\
}\
.ace-tomorrow-night .ace_marker-layer .ace_bracket {\
margin: -1px 0 0 -1px;\
border: 1px solid #4B4E55\
}\
.ace-tomorrow-night .ace_marker-layer .ace_active-line {\
background: #282A2E\
}\
.ace-tomorrow-night .ace_gutter-active-line {\
background-color: #282A2E\
}\
.ace-tomorrow-night .ace_marker-layer .ace_selected-word {\
border: 1px solid #373B41\
}\
.ace-tomorrow-night .ace_invisible {\
color: #4B4E55\
}\
.ace-tomorrow-night .ace_keyword,\
.ace-tomorrow-night .ace_meta,\
.ace-tomorrow-night .ace_storage,\
.ace-tomorrow-night .ace_storage.ace_type,\
.ace-tomorrow-night .ace_support.ace_type {\
color: #B294BB\
}\
.ace-tomorrow-night .ace_keyword.ace_operator {\
color: #8ABEB7\
}\
.ace-tomorrow-night .ace_constant.ace_character,\
.ace-tomorrow-night .ace_constant.ace_language,\
.ace-tomorrow-night .ace_constant.ace_numeric,\
.ace-tomorrow-night .ace_keyword.ace_other.ace_unit,\
.ace-tomorrow-night .ace_support.ace_constant,\
.ace-tomorrow-night .ace_variable.ace_parameter {\
color: #DE935F\
}\
.ace-tomorrow-night .ace_constant.ace_other {\
color: #CED1CF\
}\
.ace-tomorrow-night .ace_invalid {\
color: #CED2CF;\
background-color: #DF5F5F\
}\
.ace-tomorrow-night .ace_invalid.ace_deprecated {\
color: #CED2CF;\
background-color: #B798BF\
}\
.ace-tomorrow-night .ace_fold {\
background-color: #81A2BE;\
border-color: #C5C8C6\
}\
.ace-tomorrow-night .ace_entity.ace_name.ace_function,\
.ace-tomorrow-night .ace_support.ace_function,\
.ace-tomorrow-night .ace_variable {\
color: #81A2BE\
}\
.ace-tomorrow-night .ace_support.ace_class,\
.ace-tomorrow-night .ace_support.ace_type {\
color: #F0C674\
}\
.ace-tomorrow-night .ace_heading,\
.ace-tomorrow-night .ace_markup.ace_heading,\
.ace-tomorrow-night .ace_string {\
color: #B5BD68\
}\
.ace-tomorrow-night .ace_entity.ace_name.ace_tag,\
.ace-tomorrow-night .ace_entity.ace_other.ace_attribute-name,\
.ace-tomorrow-night .ace_meta.ace_tag,\
.ace-tomorrow-night .ace_string.ace_regexp,\
.ace-tomorrow-night .ace_variable {\
color: #CC6666\
}\
.ace-tomorrow-night .ace_comment {\
color: #969896\
}\
.ace-tomorrow-night .ace_indent-guide {\
background: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAACCAYAAACZgbYnAAAAEklEQVQImWNgYGBgYHB3d/8PAAOIAdULw8qMAAAAAElFTkSuQmCC) right repeat-y\
}";

var dom = require("../lib/dom");
dom.importCssString(exports.cssText, exports.cssClass);
});
/* ***** BEGIN LICENSE BLOCK *****
 * Distributed under the BSD license:
 *
 * Copyright (c) 2010, Ajax.org B.V.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of Ajax.org B.V. nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL AJAX.ORG B.V. BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * ***** END LICENSE BLOCK ***** */

ace.define('ace/theme/tomorrow_night_blue', ['require', 'exports', 'module' , 'ace/lib/dom'], function(require, exports, module) {

exports.isDark = true;
exports.cssClass = "ace-tomorrow-night-blue";
exports.cssText = ".ace-tomorrow-night-blue .ace_gutter {\
background: #00204b;\
color: #7388b5\
}\
.ace-tomorrow-night-blue .ace_print-margin {\
width: 1px;\
background: #00204b\
}\
.ace-tomorrow-night-blue {\
background-color: #002451;\
color: #FFFFFF\
}\
.ace-tomorrow-night-blue .ace_constant.ace_other,\
.ace-tomorrow-night-blue .ace_cursor {\
color: #FFFFFF\
}\
.ace-tomorrow-night-blue .ace_marker-layer .ace_selection {\
background: #003F8E\
}\
.ace-tomorrow-night-blue.ace_multiselect .ace_selection.ace_start {\
box-shadow: 0 0 3px 0px #002451;\
border-radius: 2px\
}\
.ace-tomorrow-night-blue .ace_marker-layer .ace_step {\
background: rgb(127, 111, 19)\
}\
.ace-tomorrow-night-blue .ace_marker-layer .ace_bracket {\
margin: -1px 0 0 -1px;\
border: 1px solid #404F7D\
}\
.ace-tomorrow-night-blue .ace_marker-layer .ace_active-line {\
background: #00346E\
}\
.ace-tomorrow-night-blue .ace_gutter-active-line {\
background-color: #022040\
}\
.ace-tomorrow-night-blue .ace_marker-layer .ace_selected-word {\
border: 1px solid #003F8E\
}\
.ace-tomorrow-night-blue .ace_invisible {\
color: #404F7D\
}\
.ace-tomorrow-night-blue .ace_keyword,\
.ace-tomorrow-night-blue .ace_meta,\
.ace-tomorrow-night-blue .ace_storage,\
.ace-tomorrow-night-blue .ace_storage.ace_type,\
.ace-tomorrow-night-blue .ace_support.ace_type {\
color: #EBBBFF\
}\
.ace-tomorrow-night-blue .ace_keyword.ace_operator {\
color: #99FFFF\
}\
.ace-tomorrow-night-blue .ace_constant.ace_character,\
.ace-tomorrow-night-blue .ace_constant.ace_language,\
.ace-tomorrow-night-blue .ace_constant.ace_numeric,\
.ace-tomorrow-night-blue .ace_keyword.ace_other.ace_unit,\
.ace-tomorrow-night-blue .ace_support.ace_constant,\
.ace-tomorrow-night-blue .ace_variable.ace_parameter {\
color: #FFC58F\
}\
.ace-tomorrow-night-blue .ace_invalid {\
color: #FFFFFF;\
background-color: #F99DA5\
}\
.ace-tomorrow-night-blue .ace_invalid.ace_deprecated {\
color: #FFFFFF;\
background-color: #EBBBFF\
}\
.ace-tomorrow-night-blue .ace_fold {\
background-color: #BBDAFF;\
border-color: #FFFFFF\
}\
.ace-tomorrow-night-blue .ace_entity.ace_name.ace_function,\
.ace-tomorrow-night-blue .ace_support.ace_function,\
.ace-tomorrow-night-blue .ace_variable {\
color: #BBDAFF\
}\
.ace-tomorrow-night-blue .ace_support.ace_class,\
.ace-tomorrow-night-blue .ace_support.ace_type {\
color: #FFEEAD\
}\
.ace-tomorrow-night-blue .ace_heading,\
.ace-tomorrow-night-blue .ace_markup.ace_heading,\
.ace-tomorrow-night-blue .ace_string {\
color: #D1F1A9\
}\
.ace-tomorrow-night-blue .ace_entity.ace_name.ace_tag,\
.ace-tomorrow-night-blue .ace_entity.ace_other.ace_attribute-name,\
.ace-tomorrow-night-blue .ace_meta.ace_tag,\
.ace-tomorrow-night-blue .ace_string.ace_regexp,\
.ace-tomorrow-night-blue .ace_variable {\
color: #FF9DA4\
}\
.ace-tomorrow-night-blue .ace_comment {\
color: #7285B7\
}\
.ace-tomorrow-night-blue .ace_indent-guide {\
background: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAACCAYAAACZgbYnAAAAEklEQVQImWNgYGBgYJDzqfwPAANXAeNsiA+ZAAAAAElFTkSuQmCC) right repeat-y\
}";

var dom = require("../lib/dom");
dom.importCssString(exports.cssText, exports.cssClass);
});
/* ***** BEGIN LICENSE BLOCK *****
 * Distributed under the BSD license:
 *
 * Copyright (c) 2010, Ajax.org B.V.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of Ajax.org B.V. nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL AJAX.ORG B.V. BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * ***** END LICENSE BLOCK ***** */

ace.define("ace/theme/tomorrow_night_bright",["require","exports","module","ace/lib/dom"], function(require, exports, module) {

    exports.isDark = true;
    exports.cssClass = "ace-tomorrow-night-bright";
    exports.cssText = ".ace-tomorrow-night-bright .ace_gutter {\
background: #1a1a1a;\
color: #DEDEDE\
}\
.ace-tomorrow-night-bright .ace_print-margin {\
width: 1px;\
background: #1a1a1a\
}\
.ace-tomorrow-night-bright {\
background-color: #000000;\
color: #DEDEDE\
}\
.ace-tomorrow-night-bright .ace_cursor {\
color: #9F9F9F\
}\
.ace-tomorrow-night-bright .ace_marker-layer .ace_selection {\
background: #424242\
}\
.ace-tomorrow-night-bright.ace_multiselect .ace_selection.ace_start {\
box-shadow: 0 0 3px 0px #000000;\
border-radius: 2px\
}\
.ace-tomorrow-night-bright .ace_marker-layer .ace_step {\
background: rgb(102, 82, 0)\
}\
.ace-tomorrow-night-bright .ace_marker-layer .ace_bracket {\
margin: -1px 0 0 -1px;\
border: 1px solid #888888\
}\
.ace-tomorrow-night-bright .ace_marker-layer .ace_highlight {\
border: 1px solid rgb(110, 119, 0);\
border-bottom: 0;\
box-shadow: inset 0 -1px rgb(110, 119, 0);\
margin: -1px 0 0 -1px;\
background: rgba(255, 235, 0, 0.1)\
}\
.ace-tomorrow-night-bright .ace_marker-layer .ace_active-line {\
background: #2A2A2A\
}\
.ace-tomorrow-night-bright .ace_gutter-active-line {\
background-color: #2A2A2A\
}\
.ace-tomorrow-night-bright .ace_stack {\
background-color: rgb(66, 90, 44)\
}\
.ace-tomorrow-night-bright .ace_marker-layer .ace_selected-word {\
border: 1px solid #888888\
}\
.ace-tomorrow-night-bright .ace_invisible {\
color: #343434\
}\
.ace-tomorrow-night-bright .ace_keyword,\
.ace-tomorrow-night-bright .ace_meta,\
.ace-tomorrow-night-bright .ace_storage,\
.ace-tomorrow-night-bright .ace_storage.ace_type,\
.ace-tomorrow-night-bright .ace_support.ace_type {\
color: #C397D8\
}\
.ace-tomorrow-night-bright .ace_keyword.ace_operator {\
color: #70C0B1\
}\
.ace-tomorrow-night-bright .ace_constant.ace_character,\
.ace-tomorrow-night-bright .ace_constant.ace_language,\
.ace-tomorrow-night-bright .ace_constant.ace_numeric,\
.ace-tomorrow-night-bright .ace_keyword.ace_other.ace_unit,\
.ace-tomorrow-night-bright .ace_support.ace_constant,\
.ace-tomorrow-night-bright .ace_variable.ace_parameter {\
color: #E78C45\
}\
.ace-tomorrow-night-bright .ace_constant.ace_other {\
color: #EEEEEE\
}\
.ace-tomorrow-night-bright .ace_invalid {\
color: #CED2CF;\
background-color: #DF5F5F\
}\
.ace-tomorrow-night-bright .ace_invalid.ace_deprecated {\
color: #CED2CF;\
background-color: #B798BF\
}\
.ace-tomorrow-night-bright .ace_fold {\
background-color: #7AA6DA;\
border-color: #DEDEDE\
}\
.ace-tomorrow-night-bright .ace_entity.ace_name.ace_function,\
.ace-tomorrow-night-bright .ace_support.ace_function,\
.ace-tomorrow-night-bright .ace_variable {\
color: #7AA6DA\
}\
.ace-tomorrow-night-bright .ace_support.ace_class,\
.ace-tomorrow-night-bright .ace_support.ace_type {\
color: #E7C547\
}\
.ace-tomorrow-night-bright .ace_heading,\
.ace-tomorrow-night-bright .ace_markup.ace_heading,\
.ace-tomorrow-night-bright .ace_string {\
color: #B9CA4A\
}\
.ace-tomorrow-night-bright .ace_entity.ace_name.ace_tag,\
.ace-tomorrow-night-bright .ace_entity.ace_other.ace_attribute-name,\
.ace-tomorrow-night-bright .ace_meta.ace_tag,\
.ace-tomorrow-night-bright .ace_string.ace_regexp,\
.ace-tomorrow-night-bright .ace_variable {\
color: #D54E53\
}\
.ace-tomorrow-night-bright .ace_comment {\
color: #969896\
}\
.ace-tomorrow-night-bright .ace_c9searchresults.ace_keyword {\
color: #C2C280\
}\
.ace-tomorrow-night-bright .ace_indent-guide {\
background: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAACCAYAAACZgbYnAAAAEklEQVQImWNgYGBgYFBXV/8PAAJoAXX4kT2EAAAAAElFTkSuQmCC) right repeat-y\
}";

    var dom = require("../lib/dom");
    dom.importCssString(exports.cssText, exports.cssClass);
});
/* ***** BEGIN LICENSE BLOCK *****
 * Distributed under the BSD license:
 *
 * Copyright (c) 2010, Ajax.org B.V.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of Ajax.org B.V. nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL AJAX.ORG B.V. BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * ***** END LICENSE BLOCK ***** */

ace.define('ace/theme/tomorrow_night_eighties', ['require', 'exports', 'module' , 'ace/lib/dom'], function(require, exports, module) {

exports.isDark = true;
exports.cssClass = "ace-tomorrow-night-eighties";
exports.cssText = ".ace-tomorrow-night-eighties .ace_gutter {\
background: #272727;\
color: #CCC\
}\
.ace-tomorrow-night-eighties .ace_print-margin {\
width: 1px;\
background: #272727\
}\
.ace-tomorrow-night-eighties {\
background-color: #2D2D2D;\
color: #CCCCCC\
}\
.ace-tomorrow-night-eighties .ace_constant.ace_other,\
.ace-tomorrow-night-eighties .ace_cursor {\
color: #CCCCCC\
}\
.ace-tomorrow-night-eighties .ace_marker-layer .ace_selection {\
background: #515151\
}\
.ace-tomorrow-night-eighties.ace_multiselect .ace_selection.ace_start {\
box-shadow: 0 0 3px 0px #2D2D2D;\
border-radius: 2px\
}\
.ace-tomorrow-night-eighties .ace_marker-layer .ace_step {\
background: rgb(102, 82, 0)\
}\
.ace-tomorrow-night-eighties .ace_marker-layer .ace_bracket {\
margin: -1px 0 0 -1px;\
border: 1px solid #6A6A6A\
}\
.ace-tomorrow-night-bright .ace_stack {\
background: rgb(66, 90, 44)\
}\
.ace-tomorrow-night-eighties .ace_marker-layer .ace_active-line {\
background: #393939\
}\
.ace-tomorrow-night-eighties .ace_gutter-active-line {\
background-color: #393939\
}\
.ace-tomorrow-night-eighties .ace_marker-layer .ace_selected-word {\
border: 1px solid #515151\
}\
.ace-tomorrow-night-eighties .ace_invisible {\
color: #6A6A6A\
}\
.ace-tomorrow-night-eighties .ace_keyword,\
.ace-tomorrow-night-eighties .ace_meta,\
.ace-tomorrow-night-eighties .ace_storage,\
.ace-tomorrow-night-eighties .ace_storage.ace_type,\
.ace-tomorrow-night-eighties .ace_support.ace_type {\
color: #CC99CC\
}\
.ace-tomorrow-night-eighties .ace_keyword.ace_operator {\
color: #66CCCC\
}\
.ace-tomorrow-night-eighties .ace_constant.ace_character,\
.ace-tomorrow-night-eighties .ace_constant.ace_language,\
.ace-tomorrow-night-eighties .ace_constant.ace_numeric,\
.ace-tomorrow-night-eighties .ace_keyword.ace_other.ace_unit,\
.ace-tomorrow-night-eighties .ace_support.ace_constant,\
.ace-tomorrow-night-eighties .ace_variable.ace_parameter {\
color: #F99157\
}\
.ace-tomorrow-night-eighties .ace_invalid {\
color: #CDCDCD;\
background-color: #F2777A\
}\
.ace-tomorrow-night-eighties .ace_invalid.ace_deprecated {\
color: #CDCDCD;\
background-color: #CC99CC\
}\
.ace-tomorrow-night-eighties .ace_fold {\
background-color: #6699CC;\
border-color: #CCCCCC\
}\
.ace-tomorrow-night-eighties .ace_entity.ace_name.ace_function,\
.ace-tomorrow-night-eighties .ace_support.ace_function,\
.ace-tomorrow-night-eighties .ace_variable {\
color: #6699CC\
}\
.ace-tomorrow-night-eighties .ace_support.ace_class,\
.ace-tomorrow-night-eighties .ace_support.ace_type {\
color: #FFCC66\
}\
.ace-tomorrow-night-eighties .ace_heading,\
.ace-tomorrow-night-eighties .ace_markup.ace_heading,\
.ace-tomorrow-night-eighties .ace_string {\
color: #99CC99\
}\
.ace-tomorrow-night-eighties .ace_comment {\
color: #999999\
}\
.ace-tomorrow-night-eighties .ace_entity.ace_name.ace_tag,\
.ace-tomorrow-night-eighties .ace_entity.ace_other.ace_attribute-name,\
.ace-tomorrow-night-eighties .ace_meta.ace_tag,\
.ace-tomorrow-night-eighties .ace_variable {\
color: #F2777A\
}\
.ace-tomorrow-night-eighties .ace_indent-guide {\
background: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAACCAYAAACZgbYnAAAAEklEQVQImWPQ09NrYAgMjP4PAAtGAwchHMyAAAAAAElFTkSuQmCC) right repeat-y\
}";

var dom = require("../lib/dom");
dom.importCssString(exports.cssText, exports.cssClass);
});
/* ***** BEGIN LICENSE BLOCK *****
 * Distributed under the BSD license:
 *
 * Copyright (c) 2010, Ajax.org B.V.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of Ajax.org B.V. nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL AJAX.ORG B.V. BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * ***** END LICENSE BLOCK ***** */

ace.define('ace/theme/twilight', ['require', 'exports', 'module' , 'ace/lib/dom'], function(require, exports, module) {

exports.isDark = true;
exports.cssClass = "ace-twilight";
exports.cssText = ".ace-twilight .ace_gutter {\
background: #232323;\
color: #E2E2E2\
}\
.ace-twilight .ace_print-margin {\
width: 1px;\
background: #232323\
}\
.ace-twilight {\
background-color: #141414;\
color: #F8F8F8\
}\
.ace-twilight .ace_cursor {\
color: #A7A7A7\
}\
.ace-twilight .ace_marker-layer .ace_selection {\
background: rgba(221, 240, 255, 0.20)\
}\
.ace-twilight.ace_multiselect .ace_selection.ace_start {\
box-shadow: 0 0 3px 0px #141414;\
border-radius: 2px\
}\
.ace-twilight .ace_marker-layer .ace_step {\
background: rgb(102, 82, 0)\
}\
.ace-twilight .ace_marker-layer .ace_bracket {\
margin: -1px 0 0 -1px;\
border: 1px solid rgba(255, 255, 255, 0.25)\
}\
.ace-twilight .ace_marker-layer .ace_active-line {\
background: rgba(255, 255, 255, 0.031)\
}\
.ace-twilight .ace_gutter-active-line {\
background-color: rgba(255, 255, 255, 0.031)\
}\
.ace-twilight .ace_marker-layer .ace_selected-word {\
border: 1px solid rgba(221, 240, 255, 0.20)\
}\
.ace-twilight .ace_invisible {\
color: rgba(255, 255, 255, 0.25)\
}\
.ace-twilight .ace_keyword,\
.ace-twilight .ace_meta {\
color: #CDA869\
}\
.ace-twilight .ace_constant,\
.ace-twilight .ace_constant.ace_character,\
.ace-twilight .ace_constant.ace_character.ace_escape,\
.ace-twilight .ace_constant.ace_other,\
.ace-twilight .ace_heading,\
.ace-twilight .ace_markup.ace_heading,\
.ace-twilight .ace_support.ace_constant {\
color: #CF6A4C\
}\
.ace-twilight .ace_invalid.ace_illegal {\
color: #F8F8F8;\
background-color: rgba(86, 45, 86, 0.75)\
}\
.ace-twilight .ace_invalid.ace_deprecated {\
text-decoration: underline;\
font-style: italic;\
color: #D2A8A1\
}\
.ace-twilight .ace_support {\
color: #9B859D\
}\
.ace-twilight .ace_fold {\
background-color: #AC885B;\
border-color: #F8F8F8\
}\
.ace-twilight .ace_support.ace_function {\
color: #DAD085\
}\
.ace-twilight .ace_list,\
.ace-twilight .ace_markup.ace_list,\
.ace-twilight .ace_storage {\
color: #F9EE98\
}\
.ace-twilight .ace_entity.ace_name.ace_function,\
.ace-twilight .ace_meta.ace_tag,\
.ace-twilight .ace_variable {\
color: #AC885B\
}\
.ace-twilight .ace_string {\
color: #8F9D6A\
}\
.ace-twilight .ace_string.ace_regexp {\
color: #E9C062\
}\
.ace-twilight .ace_comment {\
font-style: italic;\
color: #5F5A60\
}\
.ace-twilight .ace_variable {\
color: #7587A6\
}\
.ace-twilight .ace_xml-pe {\
color: #494949\
}\
.ace-twilight .ace_indent-guide {\
background: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAACCAYAAACZgbYnAAAAEklEQVQImWMQERFpYLC1tf0PAAgOAnPnhxyiAAAAAElFTkSuQmCC) right repeat-y\
}";

var dom = require("../lib/dom");
dom.importCssString(exports.cssText, exports.cssClass);
});
/* ***** BEGIN LICENSE BLOCK *****
 * Distributed under the BSD license:
 *
 * Copyright (c) 2010, Ajax.org B.V.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of Ajax.org B.V. nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL AJAX.ORG B.V. BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * ***** END LICENSE BLOCK ***** */

ace.define('ace/theme/vibrant_ink', ['require', 'exports', 'module' , 'ace/lib/dom'], function(require, exports, module) {

exports.isDark = true;
exports.cssClass = "ace-vibrant-ink";
exports.cssText = ".ace-vibrant-ink .ace_gutter {\
background: #1a1a1a;\
color: #BEBEBE\
}\
.ace-vibrant-ink .ace_print-margin {\
width: 1px;\
background: #1a1a1a\
}\
.ace-vibrant-ink {\
background-color: #0F0F0F;\
color: #FFFFFF\
}\
.ace-vibrant-ink .ace_cursor {\
color: #FFFFFF\
}\
.ace-vibrant-ink .ace_marker-layer .ace_selection {\
background: #6699CC\
}\
.ace-vibrant-ink.ace_multiselect .ace_selection.ace_start {\
box-shadow: 0 0 3px 0px #0F0F0F;\
border-radius: 2px\
}\
.ace-vibrant-ink .ace_marker-layer .ace_step {\
background: rgb(102, 82, 0)\
}\
.ace-vibrant-ink .ace_marker-layer .ace_bracket {\
margin: -1px 0 0 -1px;\
border: 1px solid #404040\
}\
.ace-vibrant-ink .ace_marker-layer .ace_active-line {\
background: #333333\
}\
.ace-vibrant-ink .ace_gutter-active-line {\
background-color: #333333\
}\
.ace-vibrant-ink .ace_marker-layer .ace_selected-word {\
border: 1px solid #6699CC\
}\
.ace-vibrant-ink .ace_invisible {\
color: #404040\
}\
.ace-vibrant-ink .ace_keyword,\
.ace-vibrant-ink .ace_meta {\
color: #FF6600\
}\
.ace-vibrant-ink .ace_constant,\
.ace-vibrant-ink .ace_constant.ace_character,\
.ace-vibrant-ink .ace_constant.ace_character.ace_escape,\
.ace-vibrant-ink .ace_constant.ace_other {\
color: #339999\
}\
.ace-vibrant-ink .ace_constant.ace_numeric {\
color: #99CC99\
}\
.ace-vibrant-ink .ace_invalid,\
.ace-vibrant-ink .ace_invalid.ace_deprecated {\
color: #CCFF33;\
background-color: #000000\
}\
.ace-vibrant-ink .ace_fold {\
background-color: #FFCC00;\
border-color: #FFFFFF\
}\
.ace-vibrant-ink .ace_entity.ace_name.ace_function,\
.ace-vibrant-ink .ace_support.ace_function,\
.ace-vibrant-ink .ace_variable {\
color: #FFCC00\
}\
.ace-vibrant-ink .ace_variable.ace_parameter {\
font-style: italic\
}\
.ace-vibrant-ink .ace_string {\
color: #66FF00\
}\
.ace-vibrant-ink .ace_string.ace_regexp {\
color: #44B4CC\
}\
.ace-vibrant-ink .ace_comment {\
color: #9933CC\
}\
.ace-vibrant-ink .ace_entity.ace_other.ace_attribute-name {\
font-style: italic;\
color: #99CC99\
}\
.ace-vibrant-ink .ace_indent-guide {\
background: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAACCAYAAACZgbYnAAAAEklEQVQImWNgYGBgYNDTc/oPAALPAZ7hxlbYAAAAAElFTkSuQmCC) right repeat-y\
}";

var dom = require("../lib/dom");
dom.importCssString(exports.cssText, exports.cssClass);
});
/* ***** BEGIN LICENSE BLOCK *****
 * Distributed under the BSD license:
 *
 * Copyright (c) 2010, Ajax.org B.V.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of Ajax.org B.V. nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL AJAX.ORG B.V. BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * ***** END LICENSE BLOCK ***** */

ace.define('ace/theme/xcode', ['require', 'exports', 'module' , 'ace/lib/dom'], function(require, exports, module) {

exports.isDark = false;
exports.cssClass = "ace-xcode";
exports.cssText = "/* THIS THEME WAS AUTOGENERATED BY Theme.tmpl.css (UUID: EE3AD170-2B7F-4DE1-B724-C75F13FE0085) */\
.ace-xcode .ace_gutter {\
background: #e8e8e8;\
color: #333\
}\
.ace-xcode .ace_print-margin {\
width: 1px;\
background: #e8e8e8\
}\
.ace-xcode {\
background-color: #FFFFFF;\
color: #000000\
}\
.ace-xcode .ace_cursor {\
color: #000000\
}\
.ace-xcode .ace_marker-layer .ace_selection {\
background: #B5D5FF\
}\
.ace-xcode.ace_multiselect .ace_selection.ace_start {\
box-shadow: 0 0 3px 0px #FFFFFF;\
border-radius: 2px\
}\
.ace-xcode .ace_marker-layer .ace_step {\
background: rgb(198, 219, 174)\
}\
.ace-xcode .ace_marker-layer .ace_bracket {\
margin: -1px 0 0 -1px;\
border: 1px solid #BFBFBF\
}\
.ace-xcode .ace_marker-layer .ace_active-line {\
background: rgba(0, 0, 0, 0.071)\
}\
.ace-xcode .ace_gutter-active-line {\
background-color: rgba(0, 0, 0, 0.071)\
}\
.ace-xcode .ace_marker-layer .ace_selected-word {\
border: 1px solid #B5D5FF\
}\
.ace-xcode .ace_constant.ace_language,\
.ace-xcode .ace_keyword,\
.ace-xcode .ace_meta,\
.ace-xcode .ace_variable.ace_language {\
color: #C800A4\
}\
.ace-xcode .ace_invisible {\
color: #BFBFBF\
}\
.ace-xcode .ace_constant.ace_character,\
.ace-xcode .ace_constant.ace_other {\
color: #275A5E\
}\
.ace-xcode .ace_constant.ace_numeric {\
color: #3A00DC\
}\
.ace-xcode .ace_entity.ace_other.ace_attribute-name,\
.ace-xcode .ace_support.ace_constant,\
.ace-xcode .ace_support.ace_function {\
color: #450084\
}\
.ace-xcode .ace_fold {\
background-color: #C800A4;\
border-color: #000000\
}\
.ace-xcode .ace_entity.ace_name.ace_tag,\
.ace-xcode .ace_support.ace_class,\
.ace-xcode .ace_support.ace_type {\
color: #790EAD\
}\
.ace-xcode .ace_storage {\
color: #C900A4\
}\
.ace-xcode .ace_string {\
color: #DF0002\
}\
.ace-xcode .ace_comment {\
color: #008E00\
}\
.ace-xcode .ace_indent-guide {\
background: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAACCAYAAACZgbYnAAAAE0lEQVQImWP4////f4bLly//BwAmVgd1/w11/gAAAABJRU5ErkJggg==) right repeat-y\
}";

var dom = require("../lib/dom");
dom.importCssString(exports.cssText, exports.cssClass);
});
