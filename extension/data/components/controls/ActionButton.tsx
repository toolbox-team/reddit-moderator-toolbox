import {type ComponentPropsWithoutRef, forwardRef} from 'react';
import {classes} from '../../util/ui_interop';
import css from './ActionButton.module.css';

export const ActionButton = forwardRef<HTMLButtonElement>(({
    inline,
    className,
    ...props
}: ComponentPropsWithoutRef<'button'> & {
    inline?: boolean;
}, ref) => (
    <button
        className={classes(css.actionButton, inline && css.inline, className)}
        {...props}
        ref={ref}
    />
));
