import {type ComponentPropsWithoutRef, forwardRef} from 'react';
import {classes} from '../../util/ui_interop';
import css from './BracketButton.module.css';

export const BracketButton = forwardRef<
    HTMLButtonElement,
    ComponentPropsWithoutRef<'button'> & {
        inline?: boolean;
    }
>(({
    inline,
    className,
    ...props
}, ref) => (
    <button
        className={classes(css.bracketButton, className)}
        {...props}
        ref={ref}
    />
));
