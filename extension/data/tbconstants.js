// A file dedicated to literal constants that need to be shared across multiple
// files. If it doesn't fit somewhere else, put it here.

/**
 * Material design icons mapped to toolbox names through their hexcode.
 *
 * Usage `<div class="tb-icon">${icons.NAME}</div>`
 * @constant {object}
 */
export const icons = {
    add: '&#xe145;', // add
    addBox: '&#xe146;', // add_box
    addCircle: '&#xe148;', // add_circle_outline
    arrowLeft: '&#xe314;', // keyboard_arrow_left
    arrowRight: '&#xe315;', // keyboard_arrow_right
    close: '&#xe5cd;', // close
    comments: '&#xe0b7;', // chat
    delete: '&#xe872;', // delete
    dotMenu: '&#xe5d4;', // more_vert
    edit: '&#xe3c9;', // edit
    help: '&#xe8fd;', // help_outline
    history: '&#xe889;', // history
    list: '&#xe896;', // list
    modlog: '&#xe3ec;', // grid_on
    modqueue: '&#xe8b2;', // report_problem
    newModmail: '&#xe168;', // move_to_inbox
    oldModmail: '&#xe156;', // inbox
    overlay: '&#xe8ea;', // view_array
    profile: '&#xe853;', // account_circle
    refresh: '&#xe5d5;', // refresh
    remove: '&#xe15b;', // remove
    settings: '&#xe8b8;', // settings
    sortDown: '&#xe5db;', // arrow_downward
    sortUp: '&#xe5d8;', // arrow_upward
    subTraffic: '&#xe6e1;', // show_chart
    tbConsole: '&#xe868;', // bug_report
    tbReload: '&#xe86a;', // cached
    tbSettingLink: '&#xe157;', // link
    tbSubConfig: '&#xe869;', // build
    unmoderated: '&#xe417;', // remove_red_eye
    userInbox: '&#xe0be;', // email
    usernote: '&#xe06f;', // note
};

/**
 * HTML for the syntax highlighter's theme selector.
 * @constant {string}
 */
export const syntaxHighlighterThemeSelect = `
    <select id="theme_selector">
        <option value="3024-day">3024-day</option>
        <option value="3024-night">3024-night</option>
        <option value="abcdef">abcdef</option>
        <option value="ambiance">ambiance</option>
        <option value="base16-dark">base16-dark</option>
        <option value="base16-light">base16-light</option>
        <option value="bespin">bespin</option>
        <option value="blackboard">blackboard</option>
        <option value="cobalt">cobalt</option>
        <option value="colorforth">colorforth</option>
        <option value="dracula">dracula</option>
        <option value="eclipse">eclipse</option>
        <option value="elegant">elegant</option>
        <option value="erlang-dark">erlang-dark</option>
        <option value="hopscotch">hopscotch</option>
        <option value="icecoder">icecoder</option>
        <option value="isotope">isotope</option>
        <option value="lesser-dark">lesser-dark</option>
        <option value="liquibyte">liquibyte</option>
        <option value="material">material</option>
        <option value="mbo">mbo</option>
        <option value="mdn-like">mdn-like</option>
        <option value="midnight">midnight</option>
        <option value="monokai">monokai</option>
        <option value="neat">neat</option>
        <option value="neo">neo</option>
        <option value="night">night</option>
        <option value="panda-syntax">panda-syntax</option>
        <option value="paraiso-dark">paraiso-dark</option>
        <option value="paraiso-light">paraiso-light</option>
        <option value="pastel-on-dark">pastel-on-dark</option>
        <option value="railscasts">railscasts</option>
        <option value="rubyblue">rubyblue</option>
        <option value="seti">seti</option>
        <option value="solarized dark">solarized dark</option>
        <option value="solarized light">solarized light</option>
        <option value="the-matrix">the-matrix</option>
        <option value="tomorrow-night-bright">tomorrow-night-bright</option>
        <option value="tomorrow-night-eighties">tomorrow-night-eighties</option>
        <option value="ttcn">ttcn</option>
        <option value="twilight">twilight</option>
        <option value="vibrant-ink">vibrant-ink</option>
        <option value="xq-dark">xq-dark</option>
        <option value="xq-light">xq-light</option>
        <option value="yeti">yeti</option>
        <option value="zenburn">zenburn</option>
    </select>
`;
