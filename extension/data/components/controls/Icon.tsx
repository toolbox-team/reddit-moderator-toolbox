import {icons} from '../../tbconstants';
import {classes} from '../../util/ui_interop';
import css from './Icon.module.css';

// this is a mess, but still kinda better than `dangerouslySetInnerHTML`!
// TODO: yeet this nonsense once we run out of things relying on the entity form
const iconsSafe = Object.fromEntries([...Object.entries(icons)].map(([name, entity]) => {
    const codePointHex = entity.replace(/&#x([0-9a-f]+);/i, '$1');
    const codePoint = parseInt(codePointHex, 16);
    return [name, String.fromCodePoint(codePoint)];
}));

export const Icon = ({icon, mood}: {
    icon: keyof typeof icons;
    mood?: 'positive' | 'negative';
}) => (
    <i className={classes(css.icon, mood && css[mood])}>
        {iconsSafe[icon]}
    </i>
);
