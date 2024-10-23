import {type ComponentPropsWithoutRef, forwardRef} from 'react';
import {classes} from '../../util/ui_interop';
import css from './BracketButton.module.css';

export const BracketButton = forwardRef<HTMLButtonElement>(({
    inline,
    className,
    ...props
}: ComponentPropsWithoutRef<'button'> & {
    inline?: boolean;
}, ref) => (
    <button
        className={classes(css.bracketButton, className)}
        {...props}
        ref={ref}
    />
));
