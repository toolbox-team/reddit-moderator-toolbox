import {type ComponentPropsWithoutRef, forwardRef} from 'react';
import {classes} from '../../util/ui_interop';
import css from './ActionSelect.module.css';

export const ActionSelect = forwardRef<HTMLSelectElement>(({
    inline,
    className,
    ...props
}: ComponentPropsWithoutRef<'select'> & {
    inline?: boolean;
}, ref) => (
    <select
        className={classes(css.actionSelect, inline && css.inline, className)}
        {...props}
        ref={ref}
    />
));
